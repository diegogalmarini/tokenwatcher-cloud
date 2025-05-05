import time
from typing import List, Dict, Any
import requests
from .config import settings

def _backoff_sleep(attempt: int) -> None:
    """Sleep exponential backoff: base * 2**(attempt-1)."""
    delay = settings.NOTIFY_BACKOFF_BASE * (2 ** (attempt - 1))
    print(f"⚠️ [WARN] retry {attempt}/{settings.NOTIFY_MAX_RETRIES} after {delay}s")
    time.sleep(delay)

def notify_slack_blockkit(watcher: Any, events: List[Any]) -> None:
    """
    Envía un batch de eventos a Slack usando Block Kit.
    """
    blocks: List[Dict[str, Any]] = []

    # Header
    blocks.append({
        "type": "header",
        "text": {"type": "plain_text", "text": f":rotating_light: TokenWatcher Alert: {watcher.name}", "emoji": True}
    })
    blocks.append({"type": "divider"})

    for evt in events:
        etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{evt.tx_hash}"
        when = evt.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        blocks.append({
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Contract:*\n```{watcher.contract}```"},
                {"type": "mrkdwn", "text": f"*Volume:*\n{evt.volume:.4f} ETH"},
                {"type": "mrkdwn", "text": f"*Block:*\n{evt.block_number}"},
                {"type": "mrkdwn", "text": f"*When:*\n{when}"},
                {"type": "mrkdwn", "text": f"*Tx:*\n<{etherscan_url}|Ver en Etherscan>"},
            ]
        })
        blocks.append({"type": "divider"})

    payload = {"blocks": blocks}
    url = settings.SLACK_WEBHOOK_URL

    for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
        resp = requests.post(url, json=payload)
        if resp.ok:
            print("✅ [DEBUG] Slack notified")
            return
        print(f"⚠️ [WARN] Slack rate limited ({resp.status_code}), retrying…")
        _backoff_sleep(attempt)

    raise RuntimeError(f"Slack notify failed after {settings.NOTIFY_MAX_RETRIES} attempts")

def notify_discord_embed(watcher: Any, events: List[Any]) -> None:
    """
    Envía un batch de eventos a Discord usando embeds.
    """
    embeds: List[Dict[str, Any]] = []
    for evt in events:
        etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{evt.tx_hash}"
        when = evt.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        embed = {
            "title": f"🚨 Alert: {watcher.name}",
            "color": 0xE03E2F,
            "fields": [
                {"name": "Contract", "value": f"`{watcher.contract}`", "inline": False},
                {"name": "Volume",   "value": f"{evt.volume:.4f} ETH",    "inline": True},
                {"name": "Block",    "value": f"{evt.block_number}",      "inline": True},
                {"name": "When",     "value": when,                       "inline": False},
                {"name": "Tx",       "value": f"[Ver en Etherscan]({etherscan_url})", "inline": False},
            ],
            "footer": {"text": "TokenWatcher-Cloud"}
        }
        embeds.append(embed)

    payload = {"embeds": embeds[:settings.DISCORD_BATCH_SIZE]}
    url = settings.DISCORD_WEBHOOK_URL

    for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
        resp = requests.post(url, json=payload)
        if resp.ok:
            print("✅ [DEBUG] Discord notified")
            return
        print(f"⚠️ [WARN] Discord rate limited ({resp.status_code}), retrying…")
        _backoff_sleep(attempt)

    raise RuntimeError(f"Discord notify failed after {settings.NOTIFY_MAX_RETRIES} attempts")

def notify(watcher: Any, evt: Any) -> None:
    """
    Envía un único evento a Slack y Discord en lotes de tamaño 1.
    """
    try:
        notify_slack_blockkit(watcher, [evt])
    except Exception as e:
        print(f"[ERROR] Slack notify failed: {e!r}")

    try:
        notify_discord_embed(watcher, [evt])
    except Exception as e:
        print(f"[ERROR] Discord notify failed: {e!r}")

    print("✅ [DEBUG] Notification done")
