# api/app/notifier.py

import os
import requests
from datetime import datetime
from typing import Dict

from .schemas import TokenEventRead, WatcherRead
from .config import settings

# Endpoints de los webhooks desde env vars
SLACK_WEBHOOK = settings.SLACK_WEBHOOK_URL
DISCORD_WEBHOOK = settings.DISCORD_WEBHOOK_URL

def build_slack_block(w: WatcherRead, e: TokenEventRead) -> Dict:
    """Construye payload con Block Kit para Slack."""
    return {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🚨 TokenWatcher Alert: {w.name}",
                    "emoji": True
                }
            },
            {"type": "divider"},
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Contract:*\n`{w.contract}`"},
                    {"type": "mrkdwn", "text": f"*Volume:*\n{e.volume:.4f} ETH"},
                    {"type": "mrkdwn", "text": f"*Block:*\n{e.block_number}"},
                    {"type": "mrkdwn", "text": f"*When:*\n{e.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}"}
                ]
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Ver Tx en Etherscan 🔗"},
                        "url": f"https://etherscan.io/tx/{e.tx_hash}"
                    }
                ]
            }
        ]
    }

def notify_slack(w: WatcherRead, e: TokenEventRead):
    """Envía la alerta a Slack usando Block Kit."""
    payload = build_slack_block(w, e)
    resp = requests.post(SLACK_WEBHOOK, json=payload, timeout=5)
    resp.raise_for_status()

def build_discord_embed(w: WatcherRead, e: TokenEventRead) -> Dict:
    """Construye embed para Discord."""
    return {
        "embeds": [
            {
                "title": f"🚨 Alert: {w.name}",
                "color": 0xE74C3C,
                "fields": [
                    {"name": "Contract", "value": f"`{w.contract}`", "inline": True},
                    {"name": "Volume",   "value": f"{e.volume:.4f} ETH",       "inline": True},
                    {"name": "Block",    "value": str(e.block_number),         "inline": True},
                ],
                "timestamp": e.timestamp.isoformat(),
                "footer": {"text": f"Tx: {e.tx_hash}", "icon_url": ""}
            }
        ]
    }

def notify_discord(w: WatcherRead, e: TokenEventRead):
    """Envía la alerta a Discord usando embed."""
    payload = build_discord_embed(w, e)
    resp = requests.post(DISCORD_WEBHOOK, json=payload, timeout=5)
    resp.raise_for_status()

def notify(w: WatcherRead, e: TokenEventRead):
    """Invoca todos los canales de notificación."""
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
        # Log interno o manejo adicional
        print(f"[ERROR] Notification errors: {errors}")
    else:
        print("[DEBUG] ✅ Notification done")
