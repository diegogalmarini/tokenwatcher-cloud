# api/app/notifier.py
import time
import requests 
from typing import List, Dict, Any
from .config import settings

MAX_FIELD_VALUE_LENGTH = 1024

def _backoff_sleep(attempt: int, max_retries: int, base_delay: float) -> None:
    delay = base_delay * (2 ** (attempt - 1))
    print(f"    ⚠️ [NOTIFY_WARN] Rate limited. Retry {attempt}/{max_retries} after {delay:.2f}s")
    time.sleep(delay)

def _truncate_field(value: str, length: int = MAX_FIELD_VALUE_LENGTH) -> str:
    if len(value) > length:
        return value[:length - 3] + "..."
    return value

def notify_slack_blockkit(watcher_obj: Any, events_list: List[Any]) -> None:
    if not settings.SLACK_WEBHOOK_URL or settings.SLACK_WEBHOOK_URL == "YOUR_SLACK_WEBHOOK_URL_HERE":
        print("    ℹ️ [NOTIFY_INFO] Slack webhook URL not configured. Skipping Slack.")
        return
    if not events_list:
        print("    ℹ️ [SLACK_INFO] Lista de eventos vacía, no se enviará notificación a Slack.")
        return

    blocks: List[Dict[str, Any]] = []
    blocks.append({
        "type": "header",
        "text": {"type": "plain_text", "text": f":rotating_light: TokenWatcher: {watcher_obj.name} ({len(events_list)} evento(s))", "emoji": True}
    })
    blocks.append({"type": "divider"})

    for idx, event_item in enumerate(events_list):
        if idx >= settings.SLACK_BATCH_SIZE : 
            blocks.append({
                "type": "context",
                "elements": [{"type": "mrkdwn", "text": f"Y {len(events_list) - settings.SLACK_BATCH_SIZE} evento(s) más..."}]
            })
            break

        etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{event_item.transaction_hash}"
        # Asumimos que event_item.created_at es un objeto datetime
        when_utc = event_item.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if hasattr(event_item, 'created_at') and event_item.created_at else "N/A"
        
        fields = [
            {"type": "mrkdwn", "text": f"*Token Address:*\n`{watcher_obj.token_address}`"},
            {"type": "mrkdwn", "text": f"*Amount:*\n{event_item.amount:.4f}"},
            {"type": "mrkdwn", "text": f"*Block:*\n{event_item.block_number}"},
            {"type": "mrkdwn", "text": f"*When (Detected UTC):*\n{when_utc}"},
            {"type": "mrkdwn", "text": f"*Transaction:*\n<{etherscan_url}|View on Etherscan>"},
        ]
        if hasattr(event_item, 'token_address_observed') and event_item.token_address_observed != watcher_obj.token_address:
             fields.insert(1, {"type": "mrkdwn", "text": f"*Actual Token (Event):*\n`{event_item.token_address_observed}`"})

        blocks.append({"type": "section", "fields": fields})
        if idx < len(events_list) - 1 and idx < settings.SLACK_BATCH_SIZE -1 :
            blocks.append({"type": "divider"})
    
    if not blocks:
        return

    payload = {"blocks": blocks}
    
    for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
        try:
            resp = requests.post(settings.SLACK_WEBHOOK_URL, json=payload, timeout=10)
            resp.raise_for_status()
            print(f"    ✅ [NOTIFY_SUCCESS] Slack notification sent for watcher '{watcher_obj.name}'.")
            return
        except requests.exceptions.RequestException as e:
            print(f"    ❌ [NOTIFY_ERROR] Slack API request failed (attempt {attempt}): {e}")
            if attempt < settings.NOTIFY_MAX_RETRIES:
                _backoff_sleep(attempt, settings.NOTIFY_MAX_RETRIES, settings.NOTIFY_BACKOFF_BASE)
            else:
                print(f"    ❌ [NOTIFY_FATAL] Slack notify failed for watcher '{watcher_obj.name}' after {settings.NOTIFY_MAX_RETRIES} attempts.")

def notify_discord_embed(watcher_obj: Any, events_list: List[Any]) -> None:
    if not settings.DISCORD_WEBHOOK_URL or settings.DISCORD_WEBHOOK_URL == "YOUR_DISCORD_WEBHOOK_URL_HERE":
        print("    ℹ️ [NOTIFY_INFO] Discord webhook URL not configured. Skipping Discord notification.")
        return
    if not events_list:
        print("    ℹ️ [DISCORD_INFO] Lista de eventos vacía, no se enviarán notificaciones a Discord.")
        return

    batch_size = min(settings.DISCORD_BATCH_SIZE, 10) 
    if batch_size <= 0: batch_size = 1

    for i in range(0, len(events_list), batch_size):
        current_batch_events = events_list[i:i + batch_size]
        embeds: List[Dict[str, Any]] = []
        
        print(f"    ℹ️ [DISCORD_BATCH_PROC] Procesando lote {i//batch_size + 1} de {len(current_batch_events)} evento(s) para Discord.")

        for event_item in current_batch_events:
            etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{event_item.transaction_hash}"
            when_utc = event_item.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if hasattr(event_item, 'created_at') and event_item.created_at else "N/A"
            
            embed_fields = [
                {"name": "Token Address", "value": _truncate_field(f"`{watcher_obj.token_address}`"), "inline": False},
                {"name": "Amount",   "value": _truncate_field(f"{event_item.amount:.4f}"),    "inline": True},
                {"name": "Block",    "value": _truncate_field(str(event_item.block_number)),      "inline": True},
                {"name": "When (Detected UTC)",     "value": _truncate_field(when_utc),                       "inline": False},
                {"name": "Transaction", "value": f"[View on Etherscan]({etherscan_url})", "inline": False},
            ]
            if hasattr(event_item, 'token_address_observed') and event_item.token_address_observed != watcher_obj.token_address:
                embed_fields.insert(1, {"name": "Actual Token (Event)", "value": _truncate_field(f"`{event_item.token_address_observed}`"), "inline": False})

            embed_title_suffix = ""
            if len(events_list) > batch_size:
                embed_title_suffix = f" (Lote {i//batch_size + 1} de { (len(events_list) + batch_size - 1) // batch_size })"
            elif len(events_list) > 1:
                 embed_title_suffix = f" ({len(events_list)} eventos)"

            embed = {
                "title": f"🚨 Token Alert: {watcher_obj.name}{embed_title_suffix}",
                "color": 15548997, 
                "fields": embed_fields,
                "footer": {"text": "TokenWatcher-Cloud"}
            }
            embeds.append(embed)

        if not embeds:
            continue

        payload = {"embeds": embeds}
        success_this_batch = False
        response_from_discord = None # Para acceder a headers
        for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
            try:
                response_from_discord = requests.post(settings.DISCORD_WEBHOOK_URL, json=payload, timeout=10)
                response_from_discord.raise_for_status()
                print(f"    ✅ [NOTIFY_SUCCESS] Lote de Discord enviado para watcher '{watcher_obj.name}'.")
                success_this_batch = True
                break 
            except requests.exceptions.RequestException as e:
                print(f"    ❌ [NOTIFY_ERROR] Discord API request para lote (attempt {attempt}) falló: {e}")
                # Manejo específico para rate limit de Discord
                if response_from_discord is not None and response_from_discord.status_code == 429:
                    retry_after_str = response_from_discord.headers.get("Retry-After", str(settings.NOTIFY_BACKOFF_BASE * (2 ** (attempt - 1))))
                    try:
                        # Discord puede enviar 'Retry-After' en segundos (entero) o milisegundos (flotante).
                        # Si es un entero grande, podría ser timestamp UNIX, lo cual es menos común para Retry-After.
                        # Generalmente es un delay en segundos.
                        retry_after_seconds = float(retry_after_str)
                    except ValueError:
                        retry_after_seconds = settings.NOTIFY_BACKOFF_BASE * (2 ** (attempt - 1)) # Fallback
                    
                    print(f"    ⚠️ [DISCORD_RATE_LIMIT] Discord sugiere esperar {retry_after_seconds:.2f}s. Aplicando delay.")
                    time.sleep(retry_after_seconds + 0.5) # Añadir un pequeño margen
                    if attempt >= settings.NOTIFY_MAX_RETRIES:
                        print(f"    ❌ [NOTIFY_FATAL] Falló envío de lote de Discord para watcher '{watcher_obj.name}' después de {settings.NOTIFY_MAX_RETRIES} intentos (con rate limit).")
                        break # Salir del bucle de reintentos para este lote
                    continue # Saltar al siguiente intento después del delay de Retry-After
                
                # Para otros errores o si no hay Retry-After
                if attempt < settings.NOTIFY_MAX_RETRIES:
                    _backoff_sleep(attempt, settings.NOTIFY_MAX_RETRIES, settings.NOTIFY_BACKOFF_BASE)
                else:
                    print(f"    ❌ [NOTIFY_FATAL] Falló envío de lote de Discord para watcher '{watcher_obj.name}' después de {settings.NOTIFY_MAX_RETRIES} intentos.")
        
        if success_this_batch and (i + batch_size) < len(events_list): 
            print(f"    ℹ️ [DISCORD_BATCH_DELAY] Esperando 2s antes de enviar el siguiente lote de Discord...")
            time.sleep(2)