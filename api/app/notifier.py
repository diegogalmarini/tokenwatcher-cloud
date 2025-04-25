# api/app/notifier.py

import time
import math
import requests
from typing import List, Dict, Any
from .config import settings

def _backoff_sleep(attempt: int) -> None:
    """Sleep exponential backoff: base * 2**(attempt-1)."""
    delay = settings.NOTIFY_BACKOFF_BASE * (2 ** (attempt - 1))
    print(f"⚠️ [WARN] retry {attempt}/{settings.NOTIFY_MAX_RETRIES} after {delay}s")
    time.sleep(delay)

def notify_slack_blockkit(watcher: Any, events: List[Dict]) -> None:
    """
    Envía hasta SLACK_BATCH_SIZE eventos usando Slack Block Kit.
    """
    blocks: List[Dict[str, Any]] = []

    # Header
    blocks.append({
        "type": "header",
        "text": {"type": "plain_text", "text": f":rotating_light: TokenWatcher Alert: {watcher.name}", "emoji": True}
    })
    # Divider
    blocks.append({"type": "divider"})

    # Por cada evento, añadir sección con fields
    for evt in events:
        etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{evt.tx_hash}"
        when = evt.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
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
        else:
            print(f"⚠️ [WARN] Slack rate limited ({resp.status_code}), retrying…")
            _backoff_sleep(attempt)
    raise RuntimeError(f"Slack notify failed after {settings.NOTIFY_MAX_RETRIES} attempts")

def notify_discord_embed(watcher: Any, events: List[Dict]) -> None:
    """
    Envía hasta DISCORD_BATCH_SIZE eventos usando embeds de Discord.
    """
    embeds: List[Dict[str, Any]] = []
    for evt in events:
        etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{evt.tx_hash}"
        when = evt.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
        embed = {
            "title": f"🚨 Alert: {watcher.name}",
            "color": 0xE03E2F,  # rojo token
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
        else:
            print(f"⚠️ [WARN] Discord rate limited ({resp.status_code}), retrying…")
            _backoff_sleep(attempt)
    raise RuntimeError(f"Discord notify failed after {settings.NOTIFY_MAX_RETRIES} attempts")

def notify(watcher: Any, event: Any) -> None:
    """
    Función unificada: lee nuevos eventos sin procesar de la BD,
    los agrupa y llama por lotes a Slack y Discord.
    """
    # importar crud aquí para evitar ciclo
    from . import crud
    db = crud.get_db_session()
    pending = crud.get_unnotified_events(db, watcher.id)
    if not pending:
        return

    # Procesar en batches
    for i in range(0, len(pending), settings.SLACK_BATCH_SIZE):
        batch = pending[i : i + settings.SLACK_BATCH_SIZE]
        try:
            notify_slack_blockkit(watcher, batch)
        except Exception as e:
            print(f"[ERROR] Slack notify failed: {e!r}")

    for i in range(0, len(pending), settings.DISCORD_BATCH_SIZE):
        batch = pending[i : i + settings.DISCORD_BATCH_SIZE]
        try:
            notify_discord_embed(watcher, batch)
        except Exception as e:
            print(f"[ERROR] Discord notify failed: {e!r}")

    # Marcar como notificados
    crud.mark_events_notified(db, [e.id for e in pending])
    print("✅ [DEBUG] Notification done")
