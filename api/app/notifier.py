# api/app/notifier.py
import time
import requests 
from typing import List, Dict, Any, Optional # Optional añadido
from .config import settings # settings aún se usa para MAX_RETRIES, BATCH_SIZE, etc.

MAX_FIELD_VALUE_LENGTH = 1024 # Definido en tu archivo original

def _backoff_sleep(attempt: int, max_retries: int, base_delay: float) -> None:
    delay = base_delay * (2 ** (attempt - 1))
    print(f"    ⚠️ [NOTIFY_WARN] Rate limited o error. Reintento {attempt}/{max_retries} después de {delay:.2f}s") # Mensaje ligeramente modificado
    time.sleep(delay)

def _truncate_field(value: str, length: int = MAX_FIELD_VALUE_LENGTH) -> str:
    if len(value) > length:
        return value[:length - 3] + "..."
    return value

def notify_slack_blockkit(
    webhook_url: Optional[str], # CAMBIO: webhook_url ahora es un parámetro
    watcher_obj: Any, 
    events_list: List[Any]
) -> None:
    # CAMBIO: Verificar el webhook_url pasado como parámetro
    if not webhook_url or webhook_url == "YOUR_SLACK_WEBHOOK_URL_HERE" or "example.com" in webhook_url: # Añadido "example.com" como placeholder común
        print(f"    ℹ️ [NOTIFY_INFO] Slack webhook URL no válida o no proporcionada para Watcher ID={watcher_obj.id}. Saltando Slack.")
        return
    if not events_list:
        print(f"    ℹ️ [SLACK_INFO] Lista de eventos vacía para Watcher ID={watcher_obj.id}, no se enviará notificación a Slack.")
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
        when_utc = event_item.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if hasattr(event_item, 'created_at') and event_item.created_at else "N/A"
        
        fields = [
            {"type": "mrkdwn", "text": f"*Token Address (Watcher):*\n`{watcher_obj.token_address}`"}, # Clarificado
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
    
    if not blocks: # Debería ser redundante si ya verificamos events_list, pero por si acaso.
        return

    payload = {"blocks": blocks}
    
    for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
        try:
            # CAMBIO: Usar el webhook_url pasado como parámetro
            resp = requests.post(webhook_url, json=payload, timeout=10)
            resp.raise_for_status()
            print(f"    ✅ [NOTIFY_SUCCESS] Notificación Slack enviada para Watcher ID='{watcher_obj.id}'. URL: {webhook_url[:50]}...")
            return
        except requests.exceptions.RequestException as e:
            print(f"    ❌ [NOTIFY_ERROR] Fallo en API Slack (intento {attempt}) para Watcher ID='{watcher_obj.id}': {e}")
            if attempt < settings.NOTIFY_MAX_RETRIES:
                _backoff_sleep(attempt, settings.NOTIFY_MAX_RETRIES, settings.NOTIFY_BACKOFF_BASE)
            else:
                print(f"    ❌ [NOTIFY_FATAL] Fallo notificación Slack para Watcher ID='{watcher_obj.id}' después de {settings.NOTIFY_MAX_RETRIES} intentos.")

def notify_discord_embed(
    webhook_url: Optional[str], # CAMBIO: webhook_url ahora es un parámetro
    watcher_obj: Any, 
    events_list: List[Any]
) -> None:
    # CAMBIO: Verificar el webhook_url pasado como parámetro
    if not webhook_url or webhook_url == "YOUR_DISCORD_WEBHOOK_URL_HERE" or "example.com" in webhook_url: # Añadido "example.com"
        print(f"    ℹ️ [NOTIFY_INFO] Discord webhook URL no válida o no proporcionada para Watcher ID={watcher_obj.id}. Saltando notificación Discord.")
        return
    if not events_list:
        print(f"    ℹ️ [DISCORD_INFO] Lista de eventos vacía para Watcher ID={watcher_obj.id}, no se enviarán notificaciones a Discord.")
        return

    batch_size = min(settings.DISCORD_BATCH_SIZE, 10) 
    if batch_size <= 0: batch_size = 1 # Asegurar que batch_size sea al menos 1

    for i in range(0, len(events_list), batch_size):
        current_batch_events = events_list[i:i + batch_size]
        embeds: List[Dict[str, Any]] = []
        
        print(f"    ℹ️ [DISCORD_BATCH_PROC] Procesando lote {i//batch_size + 1} de {len(current_batch_events)} evento(s) para Discord (Watcher ID={watcher_obj.id}).")

        for event_item in current_batch_events:
            etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{event_item.transaction_hash}"
            # Formatear timestamp, asegurando que created_at es un objeto datetime
            when_utc = "N/A"
            if hasattr(event_item, 'created_at') and event_item.created_at:
                try:
                    when_utc = event_item.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
                except AttributeError: # Si created_at no es un objeto datetime (ej. es un string ya)
                    when_utc = str(event_item.created_at)


            embed_fields = [
                {"name": "Token Address (Watcher)", "value": _truncate_field(f"`{watcher_obj.token_address}`"), "inline": False}, # Clarificado
                {"name": "Amount",   "value": _truncate_field(f"{event_item.amount:.4f}"),    "inline": True},
                {"name": "Block",    "value": _truncate_field(str(event_item.block_number)),      "inline": True},
                {"name": "When (Detected UTC)",     "value": _truncate_field(when_utc),                       "inline": False},
                {"name": "Transaction", "value": f"[View on Etherscan]({etherscan_url})", "inline": False},
            ]
            if hasattr(event_item, 'token_address_observed') and event_item.token_address_observed != watcher_obj.token_address:
                embed_fields.insert(1, {"name": "Actual Token (Event)", "value": _truncate_field(f"`{event_item.token_address_observed}`"), "inline": False})

            embed_title_suffix = ""
            # Ajuste en la lógica del sufijo para mayor claridad
            total_event_count = len(events_list)
            total_batches = (total_event_count + batch_size - 1) // batch_size
            current_batch_number = i // batch_size + 1

            if total_batches > 1:
                embed_title_suffix = f" (Lote {current_batch_number}/{total_batches})"
            elif total_event_count > 1 and total_event_count <= batch_size : # Si hay múltiples eventos pero caben en un solo lote
                 embed_title_suffix = f" ({total_event_count} eventos)"


            embed = {
                "title": f"🚨 Token Alert: {watcher_obj.name}{embed_title_suffix}",
                "color": 15548997, # Color naranja/rojo
                "fields": embed_fields,
                "footer": {"text": "TokenWatcher-Cloud"}
                # Considerar añadir timestamp al embed:
                # "timestamp": event_item.created_at.isoformat() if hasattr(event_item, 'created_at') and event_item.created_at else datetime.utcnow().isoformat()
            }
            embeds.append(embed)

        if not embeds: # Si por alguna razón no se generaron embeds para este lote
            continue

        payload = {"embeds": embeds}
        success_this_batch = False
        response_from_discord = None 
        for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
            try:
                # CAMBIO: Usar el webhook_url pasado como parámetro
                response_from_discord = requests.post(webhook_url, json=payload, timeout=10)
                response_from_discord.raise_for_status()
                print(f"    ✅ [NOTIFY_SUCCESS] Lote de Discord enviado para Watcher ID='{watcher_obj.id}'. URL: {webhook_url[:50]}...")
                success_this_batch = True
                break 
            except requests.exceptions.RequestException as e:
                print(f"    ❌ [NOTIFY_ERROR] Fallo en API Discord para lote (intento {attempt}) Watcher ID='{watcher_obj.id}': {e}")
                
                status_code_for_rate_limit = response_from_discord.status_code if response_from_discord is not None else None
                if status_code_for_rate_limit == 429: # Específico para rate limit
                    retry_after_str = response_from_discord.headers.get("Retry-After", str(settings.NOTIFY_BACKOFF_BASE * (2 ** (attempt - 1))))
                    try:
                        retry_after_seconds = float(retry_after_str)
                        # Discord a veces envía ms, así que si es un número grande, podría ser ms.
                        if retry_after_seconds > 1000: # Heurística: si es > 1000, asumir milisegundos
                             retry_after_seconds /= 1000.0
                    except ValueError:
                        retry_after_seconds = settings.NOTIFY_BACKOFF_BASE * (2 ** (attempt - 1))
                    
                    print(f"    ⚠️ [DISCORD_RATE_LIMIT] Discord sugiere esperar {retry_after_seconds:.2f}s. Aplicando delay.")
                    time.sleep(max(0.1, retry_after_seconds) + 0.5) # Asegurar un delay mínimo y añadir margen
                    if attempt >= settings.NOTIFY_MAX_RETRIES:
                        print(f"    ❌ [NOTIFY_FATAL] Falló envío de lote de Discord para Watcher ID='{watcher_obj.id}' después de {settings.NOTIFY_MAX_RETRIES} intentos (con rate limit).")
                        break 
                    continue 
                
                if attempt < settings.NOTIFY_MAX_RETRIES:
                    _backoff_sleep(attempt, settings.NOTIFY_MAX_RETRIES, settings.NOTIFY_BACKOFF_BASE)
                else:
                    print(f"    ❌ [NOTIFY_FATAL] Falló envío de lote de Discord para Watcher ID='{watcher_obj.id}' después de {settings.NOTIFY_MAX_RETRIES} intentos.")
        
        if success_this_batch and (i + batch_size) < len(events_list): 
            print(f"    ℹ️ [DISCORD_BATCH_DELAY] Esperando ~1-2s antes de enviar el siguiente lote de Discord (buena práctica para evitar rate limit)...")
            time.sleep(1.5) # Un pequeño delay entre lotes a la misma URL de Discord