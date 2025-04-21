# api/app/notifier.py

import requests
from .config import settings

def notify_slack(webhook: str, text: str):
    requests.post(webhook, json={"text": text}, timeout=5)

def notify(watcher, event):
    """
    Construye y envía el mensaje a cada transport configurado.
    """
    msg = (
        f"*Watcher*: {watcher.name}\n"
        f"*Contract*: {watcher.contract}\n"
        f"*Volume*: {event.volume:.4f} ETH\n"
        f"*Tx*: https://etherscan.io/tx/{event.tx_hash}"
    )
    for t in watcher.transports:
        if t.type.lower() == "slack":
            notify_slack(t.address, msg)
        # aquí podrías añadir Discord, Email, Telegram…
