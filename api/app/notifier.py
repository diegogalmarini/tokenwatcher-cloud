# src/api/app/notifier.py

import os
import requests
from datetime import datetime

from .config import settings
from .schemas import TokenEventRead, WatcherRead

def _format_message(w: WatcherRead, e: TokenEventRead) -> str:
    """Genera el texto enriquecido para la alerta."""
    ts = e.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
    etherscan_link = f"https://etherscan.io/tx/{e.tx_hash}"
    return (
        f"*Watcher:* `{w.name}`\n"
        f"*Contract:* `{w.contract}`\n"
        f"*Volume:* `{e.volume:.4f}` ETH\n"
        f"*Block:* `{e.block_number}`\n"
        f"*When:* {ts}\n"
        f"*Tx:* <{etherscan_link}|{e.tx_hash}>\n"
    )

def _notify_slack(w: WatcherRead, e: TokenEventRead) -> None:
    """Envia la alerta a Slack usando el webhook."""
    url = settings.SLACK_WEBHOOK_URL
    payload = {"text": _format_message(w, e)}
    resp = requests.post(url, json=payload, timeout=5)
    resp.raise_for_status()

def _notify_discord(w: WatcherRead, e: TokenEventRead) -> None:
    """Envia la alerta a Discord usando el webhook."""
    url = settings.DISCORD_WEBHOOK_URL
    data = {
        "embeds": [
            {
                "title": f"🚨 {w.name} alert!",
                "description": _format_message(w, e),
                "timestamp": e.timestamp.isoformat(),
                "color": 0x007ACC,
            }
        ]
    }
    resp = requests.post(url, json=data, timeout=5)
    resp.raise_for_status()

def notify(watcher, event) -> None:
    """
    Punto único de entrada para notificaciones.
    Llama internamente a Slack, Discord, etc.
    """
    errors = []
    try:
        _notify_slack(watcher, event)
    except Exception as ex:
        errors.append(f"Slack: {ex!r}")
    try:
        _notify_discord(watcher, event)
    except Exception as ex:
        errors.append(f"Discord: {ex!r}")

    if errors:
        # Logueamos todos los errores juntos
        print(f"❌ [ERROR] notifier.notify() hubo fallos: {' | '.join(errors)}")
    else:
        print("✅ [DEBUG] notifier.notify() completado con éxito")
