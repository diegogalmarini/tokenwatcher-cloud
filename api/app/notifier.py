# api/app/notifier.py

import time
import requests
from datetime import datetime
from typing import Dict

from .schemas import TokenEventRead, WatcherRead
from .config import settings

SLACK_WEBHOOK   = settings.SLACK_WEBHOOK_URL
DISCORD_WEBHOOK = settings.DISCORD_WEBHOOK_URL

def _post_with_retry(url: str, payload: Dict, max_retries: int = 3):
    """
    Hace POST a `url` con `payload`, reintentando ante 429 hasta max_retries.
    """
    for attempt in range(1, max_retries + 1):
        resp = requests.post(url, json=payload, timeout=5)
        if resp.status_code == 429:
            # Slack / Discord te dicen cuánto esperar en Retry-After
            retry_after = int(resp.headers.get("Retry-After", "1"))
            print(f"[WARN] Rate limited ({url}), retry {attempt}/{max_retries} after {retry_after}s")
            time.sleep(retry_after)
            continue
        # Si es otro error HTTP, lanza excepción
        resp.raise_for_status()
        return
    raise requests.HTTPError(f"Too many rate-limit retries for {url}")

def build_slack_block(w: WatcherRead, e: TokenEventRead) -> Dict:
    return {
        "blocks": [
            {"type": "header", "text": {"type": "plain_text", "text": f"🚨 TokenWatcher Alert: {w.name}", "emoji": True}},
            {"type": "divider"},
            {"type": "section", "fields": [
                {"type": "mrkdwn", "text": f"*Contract:*\n`{w.contract}`"},
                {"type": "mrkdwn", "text": f"*Volume:*\n{e.volume:.4f} ETH"},
                {"type": "mrkdwn", "text": f"*Block:*\n{e.block_number}"},
                {"type": "mrkdwn", "text": f"*When:*\n{e.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}"}
            ]},
            {"type": "actions", "elements": [
                {"type": "button", "text": {"type": "plain_text","text":"Ver Tx en Etherscan 🔗"},
                 "url": f"https://etherscan.io/tx/{e.tx_hash}"}
            ]}
        ]
    }

def notify_slack(w: WatcherRead, e: TokenEventRead):
    payload = build_slack_block(w, e)
    _post_with_retry(SLACK_WEBHOOK, payload)

def build_discord_embed(w: WatcherRead, e: TokenEventRead) -> Dict:
    return {
        "embeds": [{
            "title": f"🚨 Alert: {w.name}",
            "color": 0xE74C3C,
            "fields": [
                {"name": "Contract", "value": f"`{w.contract}`", "inline": True},
                {"name": "Volume",   "value": f"{e.volume:.4f} ETH",       "inline": True},
                {"name": "Block",    "value": str(e.block_number),         "inline": True},
            ],
            "timestamp": e.timestamp.isoformat(),
            "footer": {"text": f"Tx: {e.tx_hash}"}
        }]
    }

def notify_discord(w: WatcherRead, e: TokenEventRead):
    payload = build_discord_embed(w, e)
    _post_with_retry(DISCORD_WEBHOOK, payload)

def notify(w: WatcherRead, e: TokenEventRead):
    errors = []
    try:
        notify_slack(w, e)
    except Exception as ex:
        errors.append(f"Slack: {ex!r}")
    try:
        notify_discord(w, e)
    except Exception as ex:
        errors.append(f"Discord: {ex!r}")

    if errors:
        print(f"[ERROR] Notification errors: {errors}")
    else:
        print("[DEBUG] ✅ Notification done")
