# api/app/notifier.py

import requests
from datetime import datetime
from typing import Any, Dict
from .config import settings

def send_slack(webhook_url: str, watcher_name: str, event: Any) -> None:
    """
    Envía una notificación formateada a Slack usando Block Kit.
    """
    timestamp_str = event.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    etherscan_url = f"https://etherscan.io/tx/{event.tx_hash}"
    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"⚡ TokenWatcher — {watcher_name}"}
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Contract:*\n`{event.contract}`"},
                {"type": "mrkdwn", "text": f"*Volume:*\n`{event.volume:.4f}`"},
                {"type": "mrkdwn", "text": f"*Tx Hash:*\n`{event.tx_hash}`"},
                {"type": "mrkdwn", "text": f"*Fecha:*\n{timestamp_str}"}
            ]
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "Ver en Etherscan"},
                    "url": etherscan_url
                }
            ]
        }
    ]
    payload = {"blocks": blocks}
    requests.post(webhook_url, json=payload, timeout=5)


def send_discord(webhook_url: str, watcher_name: str, event: Any) -> None:
    """
    Envía una notificación formateada a Discord usando embeds.
    """
    timestamp_iso = event.timestamp.isoformat()
    embed: Dict[str, Any] = {
        "title": f"⚡ TokenWatcher — {watcher_name}",
        "fields": [
            {"name": "Contract", "value": event.contract, "inline": True},
            {"name": "Volume",   "value": f"{event.volume:.4f}",   "inline": True},
            {"name": "Tx Hash",  "value": event.tx_hash,            "inline": False},
            {"name": "Fecha",    "value": timestamp_iso,            "inline": False},
        ],
        "url": f"https://etherscan.io/tx/{event.tx_hash}",
        "timestamp": timestamp_iso
    }
    payload = {"embeds": [embed]}
    requests.post(webhook_url, json=payload, timeout=5)


def send_telegram(webhook_url: str, text: str) -> None:
    """
    Envía un mensaje simple a Telegram. 
    Asume que `webhook_url` incluye token y chat_id adecuados.
    """
    requests.post(webhook_url, json={"text": text}, timeout=5)


def send_email(to_address: str, subject: str, body: str) -> None:
    """
    Stub para envío de email. Aquí podrías integrar SendGrid, Mailgun, SMTP, etc.
    """
    # Ejemplo con SendGrid (si añades SENDGRID_API_KEY en config):
    # import sendgrid
    # sg = sendgrid.SendGridAPIClient(settings.SENDGRID_API_KEY)
    # message = Mail(
    #     from_email='noreply@tokenwatcher.cloud',
    #     to_emails=to_address,
    #     subject=subject,
    #     html_content=body
    # )
    # sg.send(message)
    pass


def notify(event: Any, watcher: Any, transport: Any) -> None:
    """
    Dispara la notificación según el tipo de transporte.
    event: ORM TokenEvent
    watcher: ORM Watcher
    transport: ORM Transport (t.type, t.address)
    """
    # Título común y cuerpo plano (fallback)
    title = f"TokenWatcher — {watcher.name}"
    body = (
        f"Contract: `{event.contract}`\n"
        f"Volume: `{event.volume:.4f}`\n"
        f"Tx: `{event.tx_hash}`\n"
        f"Date: {event.timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"<https://etherscan.io/tx/{event.tx_hash}|Ver en Etherscan>"
    )

    ttype = transport.type.lower()
    if ttype == "slack":
        send_slack(transport.address, watcher.name, event)
    elif ttype == "discord":
        send_discord(transport.address, watcher.name, event)
    elif ttype == "telegram":
        send_telegram(transport.address, body)
    elif ttype == "email":
        send_email(transport.address, title, body)
    else:
        # Puedes añadir más canales o hacer logging
        print(f"⚠️ Canal desconocido {transport.type!r}, mensaje: {body}")
