# api/app/notifier.py

import requests
from .config import settings

def notify(watcher, event):
    """
    Envía a Slack una notificación de un TokenEvent.
    Toma la URL de settings.SLACK_WEBHOOK_URL.
    """
    url = settings.SLACK_WEBHOOK_URL
    if not url:
        print("[DEBUG] ⚠️ No SLACK_WEBHOOK_URL configurada, saltando notify.")
        return

    # Construimos el mensaje
    text = (
        f"*Watcher:* {watcher.name}\n"
        f"*Contract:* `{event.contract}`\n"
        f"*Volume:* {event.volume:.4f} ETH\n"
        f"*Tx:* https://etherscan.io/tx/{event.tx_hash}"
    )
    payload = {"text": text}

    # Posteamos a Slack
    resp = requests.post(url, json=payload)
    if resp.status_code != 200:
        print(f"[DEBUG] ⚠️ Slack devolvió {resp.status_code}: {resp.text}")
