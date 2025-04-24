import requests
from typing import Any

from .schemas import TransportRead, TokenEventRead, WatcherRead

def notify_slack(watcher: WatcherRead, event: TokenEventRead) -> None:
    """
    Envía un mensaje enriquecido a Slack usando bloques.
    """
    # Buscamos la transport de tipo slack
    slack_url = None
    for t in watcher.transports:  # t es TransportRead
        if t.type.lower() == "slack":
            slack_url = t.address
            break
    if not slack_url:
        return

    blocks: list[Any] = [
        {"type": "section",
         "text": {
             "type": "mrkdwn",
             "text": (
                 f"*Watcher:* {watcher.name}\n"
                 f"*Contract:* `{watcher.contract}`\n"
                 f"*Volume:* `{event.volume:.4f} ETH`\n"
                 f"*Tx:* <https://etherscan.io/tx/{event.tx_hash}|Ver en Etherscan>\n"
                 f"*Fecha:* {event.timestamp.isoformat()}"
             )
         }},
        {"type": "divider"}
    ]

    resp = requests.post(slack_url, json={"blocks": blocks})
    resp.raise_for_status()


def notify_discord(watcher: WatcherRead, event: TokenEventRead) -> None:
    """
    Envía un embed sencillo a un webhook de Discord.
    """
    discord_url = None
    for t in watcher.transports:
        if t.type.lower() == "discord":
            discord_url = t.address
            break
    if not discord_url:
        return

    embed = {
        "embeds": [
            {
                "title": f"{watcher.name} superó {watcher.threshold} ETH",
                "fields": [
                    {"name": "Contract", "value": watcher.contract, "inline": False},
                    {"name": "Volume",   "value": f"{event.volume:.4f} ETH",  "inline": True},
                    {"name": "Tx",       "value": f"https://etherscan.io/tx/{event.tx_hash}", "inline": False},
                    {"name": "Fecha",    "value": event.timestamp.isoformat(), "inline": True},
                ],
                "color": 3066993
            }
        ]
    }

    resp = requests.post(discord_url, json=embed)
    resp.raise_for_status()


def notify(watcher: WatcherRead, event: TokenEventRead) -> None:
    """
    Lógica unificada: dispara Slack y Discord (si existen).
    """
    # Slack
    try:
        notify_slack(watcher, event)
    except Exception as e:
        print(f"❌ [ERROR] Slack notify failed: {e!r}")
    else:
        print("✅ [DEBUG] Slack notified")

    # Discord
    try:
        notify_discord(watcher, event)
    except Exception as e:
        print(f"❌ [ERROR] Discord notify failed: {e!r}")
    else:
        print("✅ [DEBUG] Discord notified")
