# api/app/notifier.py
import time
import requests 
import json
import re
from typing import List, Dict, Any, Optional
from .config import settings
from . import email_utils
from . import schemas
from .clients import telegram_client
import logging

logger = logging.getLogger(__name__)

MAX_FIELD_VALUE_LENGTH = 1024

def _backoff_sleep(attempt: int, max_retries: int, base_delay: float) -> None:
    delay = base_delay * (2 ** (attempt - 1))
    logger.warning(f"Rate limited o error. Reintento {attempt}/{max_retries} después de {delay:.2f}s")
    time.sleep(delay)

def _truncate_field(value: str, length: int = MAX_FIELD_VALUE_LENGTH) -> str:
    if len(str(value)) > length:
        return str(value)[:length - 3] + "..."
    return str(value)

def escape_markdown_v2(text: str) -> str:
    if not isinstance(text, str):
        text = str(text)
    escape_chars = r'_*[]()~`>#+-=|{}.!'
    return re.sub(f'([{re.escape(escape_chars)}])', r'\\\1', text)

def notify_slack_blockkit(webhook_url: Optional[str], watcher_obj: Any, events_list: List[Any]) -> None:
    if not webhook_url or "example.com" in webhook_url:
        logger.info(f"Slack webhook URL no válida para Watcher ID={watcher_obj.id}. Saltando Slack.")
        return
    if not events_list:
        logger.info(f"Lista de eventos vacía para Watcher ID={watcher_obj.id}, no se enviará notificación a Slack.")
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
            {"type": "mrkdwn", "text": f"*Token Address (Watcher):*\n`{watcher_obj.token_address}`"},
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
            resp = requests.post(webhook_url, json=payload, timeout=10)
            resp.raise_for_status()
            logger.info(f"Notificación Slack enviada para Watcher ID='{watcher_obj.id}'.")
            return
        except requests.exceptions.RequestException as e:
            logger.error(f"Fallo en API Slack (intento {attempt}) para Watcher ID='{watcher_obj.id}': {e}")
            if attempt < settings.NOTIFY_MAX_RETRIES:
                _backoff_sleep(attempt, settings.NOTIFY_MAX_RETRIES, settings.NOTIFY_BACKOFF_BASE)
            else:
                logger.error(f"Fallo notificación Slack para Watcher ID='{watcher_obj.id}' después de {settings.NOTIFY_MAX_RETRIES} intentos.")

def notify_discord_embed(webhook_url: Optional[str], watcher_obj: Any, events_list: List[Any]) -> None:
    if not webhook_url or "example.com" in webhook_url:
        logger.info(f"Discord webhook URL no válida para Watcher ID={watcher_obj.id}. Saltando notificación Discord.")
        return
    if not events_list:
        logger.info(f"Lista de eventos vacía para Watcher ID={watcher_obj.id}, no se enviarán notificaciones a Discord.")
        return

    batch_size = min(settings.DISCORD_BATCH_SIZE, 10) 
    if batch_size <= 0: batch_size = 1

    for i in range(0, len(events_list), batch_size):
        current_batch_events = events_list[i:i + batch_size]
        embeds: List[Dict[str, Any]] = []
        
        logger.info(f"Procesando lote {i//batch_size + 1} de {len(current_batch_events)} evento(s) para Discord (Watcher ID={watcher_obj.id}).")

        for event_item in current_batch_events:
            etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{event_item.transaction_hash}"
            when_utc = "N/A"
            if hasattr(event_item, 'created_at') and event_item.created_at:
                try:
                    when_utc = event_item.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
                except AttributeError:
                    when_utc = str(event_item.created_at)

            embed_fields = [
                {"name": "Token Address (Watcher)", "value": _truncate_field(f"`{watcher_obj.token_address}`"), "inline": False},
                {"name": "Amount",   "value": _truncate_field(f"{event_item.amount:.4f}"),    "inline": True},
                {"name": "Block",    "value": _truncate_field(str(event_item.block_number)),      "inline": True},
                {"name": "When (Detected UTC)",     "value": _truncate_field(when_utc),                       "inline": False},
                {"name": "Transaction", "value": f"[View on Etherscan]({etherscan_url})", "inline": False},
            ]
            if hasattr(event_item, 'token_address_observed') and event_item.token_address_observed != watcher_obj.token_address:
                embed_fields.insert(1, {"name": "Actual Token (Event)", "value": _truncate_field(f"`{event_item.token_address_observed}`"), "inline": False})

            embed_title_suffix = ""
            total_event_count = len(events_list)
            total_batches = (total_event_count + batch_size - 1) // batch_size
            current_batch_number = i // batch_size + 1
            if total_batches > 1:
                embed_title_suffix = f" (Batch {current_batch_number}/{total_batches})"
            elif total_event_count > 1 and total_event_count <= batch_size :
                 embed_title_suffix = f" ({total_event_count} eventos)"

            embed = { "title": f"🚨 Token Alert: {watcher_obj.name}{embed_title_suffix}", "color": 15548997, "fields": embed_fields, "footer": {"text": "TokenWatcher-Cloud"}}
            embeds.append(embed)

        if not embeds:
            continue

        payload = {"embeds": embeds}
        success_this_batch = False
        response_from_discord = None 
        for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
            try:
                response_from_discord = requests.post(webhook_url, json=payload, timeout=10)
                response_from_discord.raise_for_status()
                logger.info(f"Lote de Discord enviado para Watcher ID='{watcher_obj.id}'.")
                success_this_batch = True
                break 
            except requests.exceptions.RequestException as e:
                logger.error(f"Fallo en API Discord para lote (intento {attempt}) Watcher ID='{watcher_obj.id}': {e}")
                status_code_for_rate_limit = response_from_discord.status_code if response_from_discord is not None else None
                if status_code_for_rate_limit == 429:
                    retry_after_str = response_from_discord.headers.get("Retry-After", str(settings.NOTIFY_BACKOFF_BASE * (2 ** (attempt - 1))))
                    try:
                        retry_after_seconds = float(retry_after_str)
                        if retry_after_seconds > 1000:
                             retry_after_seconds /= 1000.0
                    except ValueError:
                        retry_after_seconds = settings.NOTIFY_BACKOFF_BASE * (2 ** (attempt - 1))
                    logger.warning(f"Discord sugiere esperar {retry_after_seconds:.2f}s. Aplicando delay.")
                    time.sleep(max(0.1, retry_after_seconds) + 0.5)
                    if attempt >= settings.NOTIFY_MAX_RETRIES:
                        logger.error(f"Falló envío de lote de Discord para Watcher ID='{watcher_obj.id}' después de {settings.NOTIFY_MAX_RETRIES} intentos (con rate limit).")
                        break 
                    continue 
                if attempt < settings.NOTIFY_MAX_RETRIES:
                    _backoff_sleep(attempt, settings.NOTIFY_MAX_RETRIES, settings.NOTIFY_BACKOFF_BASE)
                else:
                    logger.error(f"Falló envío de lote de Discord para Watcher ID='{watcher_obj.id}' después de {settings.NOTIFY_MAX_RETRIES} intentos.")
        
        if success_this_batch and (i + batch_size) < len(events_list): 
            logger.info("Esperando ~1-2s antes de enviar el siguiente lote de Discord...")
            time.sleep(1.5)

def notify_email_batch(transport_config: Dict[str, Any], watcher_obj: Any, events_list: List[schemas.TokenEventRead]):
    to_email = transport_config.get("email")
    if not to_email:
        logger.info(f"Configuración de email incompleta para Watcher ID={watcher_obj.id}. Saltando Email.")
        return
    logger.info(f"Procesando {len(events_list)} evento(s) para enviar un email de resumen a {to_email}...")
    try:
        success = email_utils.send_token_alert_email_batch(to_email=to_email, watcher_name=watcher_obj.name, events=events_list)
        if success:
            logger.info(f"Email de resumen enviado a {to_email} para {len(events_list)} evento(s).")
        else:
            logger.error(f"Fallo al enviar email de resumen a {to_email}.")
    except Exception as e:
        logger.exception(f"Excepción al construir o enviar email de resumen: {e}")

def notify_telegram_batch(transport_config: Dict[str, Any], watcher_obj: Any, events_list: List[schemas.TokenEventRead]):
    bot_token = transport_config.get("bot_token")
    chat_id = transport_config.get("chat_id")
    if not bot_token or not chat_id:
        logger.info(f"Configuración de Telegram incompleta para Watcher ID={watcher_obj.id}. Saltando Telegram.")
        return
    logger.info(f"Procesando {len(events_list)} evento(s) para enviar a Telegram Chat ID {chat_id}...")
    for event in events_list:
        try:
            watcher_name_escaped = escape_markdown_v2(watcher_obj.name)
            amount_formatted = escape_markdown_v2(f"{event.amount:,.4f} {event.token_symbol or ''}".strip())
            usd_value_formatted = escape_markdown_v2(f"${event.usd_value:,.2f} USD") if event.usd_value is not None else "N/A"
            from_addr_escaped = escape_markdown_v2(event.from_address)
            to_addr_escaped = escape_markdown_v2(event.to_address)
            etherscan_link = f"{settings.ETHERSCAN_TX_URL}/{event.transaction_hash}"
            text_message = (
                f"🚨 *{watcher_name_escaped}*\n\n"
                f"A significant transfer has been detected:\n\n"
                f"▪️ *Amount*: `{amount_formatted}`\n"
                f"▪️ *USD Value*: `{usd_value_formatted}`\n"
                f"▪️ *From*: `{from_addr_escaped}`\n"
                f"▪️ *To*: `{to_addr_escaped}`\n\n"
                f"[View Transaction on Etherscan]({etherscan_link})"
            )
            telegram_client.send_telegram_message(bot_token=bot_token, chat_id=chat_id, text=text_message)
            time.sleep(1)
        except Exception as e:
            logger.error(f"Excepción al enviar mensaje de Telegram para evento ID {event.id}: {e}")

def send_notifications_for_event_batch(watcher_obj: Any, events_list: List[schemas.TokenEventRead]):
    if not events_list:
        return
    if not watcher_obj.transports:
        logger.warning(f"El Watcher ID={watcher_obj.id} no tiene transportes configurados.")
        return
    for transport in watcher_obj.transports:
        transport_type = transport.type.lower()
        transport_config = transport.config
        if not isinstance(transport_config, dict):
            try:
                transport_config = json.loads(transport_config) if isinstance(transport_config, str) else {}
            except json.JSONDecodeError:
                logger.error(f"El config del transporte ID={transport.id} no es un JSON válido.")
                continue
        logger.info(f"-> [DISPATCH] Procesando transporte tipo '{transport_type}' para Watcher ID={watcher_obj.id}")
        if transport_type == "slack":
            webhook_url = transport_config.get("url")
            notify_slack_blockkit(webhook_url, watcher_obj, events_list)
        elif transport_type == "discord":
            webhook_url = transport_config.get("url")
            notify_discord_embed(webhook_url, watcher_obj, events_list)
        elif transport_type == "email":
            notify_email_batch(transport_config, watcher_obj, events_list)
        elif transport_type == "telegram":
            notify_telegram_batch(transport_config, watcher_obj, events_list)
        else:
            logger.warning(f"Tipo de transporte desconocido '{transport_type}' para Watcher ID={watcher_obj.id}.")