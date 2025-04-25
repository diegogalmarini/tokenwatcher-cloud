# api/app/notifier.py

import time
import logging
from typing import List, Dict, Any
import requests
from .schemas import TokenEventRead
from .config import settings

logger = logging.getLogger("notifier")


def _post_with_retry(
    url: str,
    payload: Dict[str, Any],
    headers: Dict[str, str] = None,
    max_retries: int = None,
    backoff_base: float = None,
):
    """Envía POST a `url` con retry + backoff exponencial."""
    retries = 0
    max_retries = max_retries or settings.NOTIFY_MAX_RETRIES  # e.g. 3
    backoff_base = backoff_base or settings.NOTIFY_BACKOFF_BASE  # e.g. 1.0
    while True:
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            resp.raise_for_status()
            return resp
        except requests.HTTPError as e:
            status = getattr(e.response, "status_code", None)
            # sólo retry en 429 o 5xx
            if status == 429 or (status and 500 <= status < 600):
                if retries < max_retries:
                    delay = backoff_base * (2**retries)
                    logger.warning(f"Rate limited ({url}), retry {retries+1}/{max_retries} after {delay}s")
                    time.sleep(delay)
                    retries += 1
                    continue
            # si no es retryable o agotamos retries:
            logger.error(f"Notify failed ({url}): {e!r}")
            raise


def _chunked(items: List[Any], size: int) -> List[List[Any]]:
    """Divide lista en trozos de `size`."""
    return [items[i : i + size] for i in range(0, len(items), size)]


def notify_slack_batch(watcher: Any, events: List[TokenEventRead]):
    """
    Envía un único mensaje a Slack con hasta SLACK_BATCH_SIZE alertas.
    Usamos bloques (blocks) para formatear cada evento.
    """
    url = settings.SLACK_WEBHOOK_URL
    batch_size = settings.SLACK_BATCH_SIZE or len(events)
    for chunk in _chunked(events, batch_size):
        blocks = [
            {"type": "header", "text": {"type": "plain_text", "text": f":rotating_light: TokenWatcher Alert: {watcher.name}"}}
        ]
        for e in chunk:
            blocks.extend([
                {"type": "section", "fields": [
                    {"type": "mrkdwn", "text": f"*Contract:*\n```{e.contract}```"},
                    {"type": "mrkdwn", "text": f"*Volume:*\n{e.volume:.4f} ETH"},
                    {"type": "mrkdwn", "text": f"*Block:*\n{e.block_number}"},
                    {"type": "mrkdwn", "text": f"*When:*\n{e.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}"},
                    {"type": "mrkdwn", "text": f"*Tx:*\n<{settings.ETHERSCAN_TX_URL}/{e.tx_hash}|Ver en Etherscan>"}
                ]},
                {"type": "divider"},
            ])
        payload = {"blocks": blocks}
        _post_with_retry(url, payload)


def notify_discord_batch(watcher: Any, events: List[TokenEventRead]):
    """
    Envía un único embed a Discord con hasta DISCORD_BATCH_SIZE campos.
    """
    url = settings.DISCORD_WEBHOOK_URL
    batch_size = settings.DISCORD_BATCH_SIZE or len(events)
    for chunk in _chunked(events, batch_size):
        embed = {
            "title": f"🚨 Alert: {watcher.name}",
            "color": 0xDD2222,
            "fields": [],
            "footer": {"text": "TokenWatcher-Cloud"},
            "timestamp": None  # Discord rellenará al recibir
        }
        for e in chunk:
            embed["fields"].append({
                "name": "Contract",
                "value": f"`{e.contract}`",
                "inline": True
            })
            embed["fields"].append({
                "name": "Volume",
                "value": f"{e.volume:.4f} ETH",
                "inline": True
            })
            embed["fields"].append({
                "name": "Block",
                "value": str(e.block_number),
                "inline": True
            })
            embed["fields"].append({
                "name": "Tx",
                "value": f"[Ver en Etherscan]({settings.ETHERSCAN_TX_URL}/{e.tx_hash})",
                "inline": False
            })
        payload = {"embeds": [embed]}
        _post_with_retry(url, payload)


def notify_channels(watcher: Any, events: List[TokenEventRead]):
    """
    Punto único de entrada: envía batch a todos los canales configurados.
    """
    errors = []
    try:
        notify_slack_batch(watcher, events)
        logger.debug("Slack notified")
    except Exception as e:
        errors.append(f"Slack: {e!r}")
    try:
        notify_discord_batch(watcher, events)
        logger.debug("Discord notified")
    except Exception as e:
        errors.append(f"Discord: {e!r}")

    if errors:
        logger.error(f"[ERROR] Notification errors: {errors}")
    else:
        logger.debug("[DEBUG] Notification done")
