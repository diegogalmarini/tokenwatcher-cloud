# api/app/notifier.py
import time
from typing import List, Dict, Any 
import requests
from .config import settings
# from .models import Watcher as WatcherModel, Event as EventModel # Para type hints más estrictos

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
        print("    ℹ️ [NOTIFY_INFO] Slack webhook URL not configured. Skipping Slack notification.")
        return

    blocks: List[Dict[str, Any]] = []
    blocks.append({
        "type": "header",
        "text": {"type": "plain_text", "text": f":rotating_light: TokenWatcher: {watcher_obj.name}", "emoji": True}
    })
    blocks.append({"type": "divider"})

    for event_item in events_list:
        etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{event_item.transaction_hash}"
        when_utc = event_item.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")

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
        blocks.append({"type": "divider"})

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

    embeds: List[Dict[str, Any]] = []
    for event_item in events_list[:settings.DISCORD_BATCH_SIZE]:
        etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{event_item.transaction_hash}"
        when_utc = event_item.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")

        embed_fields = [
            {"name": "Token Address", "value": _truncate_field(f"`{watcher_obj.token_address}`"), "inline": False},
            {"name": "Amount",   "value": _truncate_field(f"{event_item.amount:.4f}"),    "inline": True},
            {"name": "Block",    "value": _truncate_field(str(event_item.block_number)),      "inline": True},
            {"name": "When (Detected UTC)",     "value": _truncate_field(when_utc),                       "inline": False},
            {"name": "Transaction", "value": f"[View on Etherscan]({etherscan_url})", "inline": False},
        ]
        if hasattr(event_item, 'token_address_observed') and event_item.token_address_observed != watcher_obj.token_address:
            embed_fields.insert(1, {"name": "Actual Token (Event)", "value": _truncate_field(f"`{event_item.token_address_observed}`"), "inline": False})

        embed = {
            "title": f"🚨 Token Transfer Alert: {watcher_obj.name}",
            "color": 15548997, 
            "fields": embed_fields,
            "footer": {"text": "TokenWatcher-Cloud"}
        }
        embeds.append(embed)

    payload = {"embeds": embeds}

    for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
        try:
            resp = requests.post(settings.DISCORD_WEBHOOK_URL, json=payload, timeout=10)
            resp.raise_for_status()
            print(f"    ✅ [NOTIFY_SUCCESS] Discord notification sent for watcher '{watcher_obj.name}'.")
            return
        except requests.exceptions.RequestException as e:
            print(f"    ❌ [NOTIFY_ERROR] Discord API request failed (attempt {attempt}): {e}")
            if attempt < settings.NOTIFY_MAX_RETRIES:
                _backoff_sleep(attempt, settings.NOTIFY_MAX_RETRIES, settings.NOTIFY_BACKOFF_BASE)
            else:
                print(f"    ❌ [NOTIFY_FATAL] Discord notify failed for watcher '{watcher_obj.name}' after {settings.NOTIFY_MAX_RETRIES} attempts.")

# CAMBIO: El segundo parámetro ahora se llama event_obj
def notify(watcher: Any, event_obj: Any) -> None: 
    """
    Envía un único evento a los canales configurados.
    """
    print(f"    ℹ️ [NOTIFY_INFO] Preparing notifications for event id={event_obj.id} of watcher '{watcher.name}'.")
    events_to_notify = [event_obj] # Usar event_obj aquí

    # Comprobación de URLs de webhook y llamada a las funciones de notificación
    if settings.SLACK_WEBHOOK_URL and settings.SLACK_WEBHOOK_URL != "YOUR_SLACK_WEBHOOK_URL_HERE":
        try:
            notify_slack_blockkit(watcher, events_to_notify)
        except Exception as e_slack:
            print(f"    ❌ [NOTIFY_SLACK_EXCEPTION] Exception during Slack notification: {e_slack!r}")
    else:
        print("    ℹ️ [NOTIFY_INFO] Slack webhook URL not configured in notify function.")

    if settings.DISCORD_WEBHOOK_URL and settings.DISCORD_WEBHOOK_URL != "YOUR_DISCORD_WEBHOOK_URL_HERE":
        try:
            notify_discord_embed(watcher, events_to_notify)
        except Exception as e_discord:
            print(f"    ❌ [NOTIFY_DISCORD_EXCEPTION] Exception during Discord notification: {e_discord!r}")
    else:
        print("    ℹ️ [NOTIFY_INFO] Discord webhook URL not configured in notify function.")

    print(f"    ℹ️ [NOTIFY_INFO] All notification attempts for event id={event_obj.id} concluded.")