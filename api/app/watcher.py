# api/app/watcher.py

import time
import requests
from typing import Callable, List, Dict

from . import schemas, crud, notifier
from .config import settings

ETHERSCAN_API = "https://api.etherscan.io/api"

def fetch_transfers(contract: str, start_block: int = 0) -> List[Dict]:
    """
    Llama a Etherscan y devuelve la lista de transfers ERC‑20
    desde `start_block` hasta latest.
    """
    params = {
        "module": "account",
        "action": "tokentx",
        "contractaddress": contract,
        "startblock": start_block,
        "endblock": 99999999,
        "sort": "asc",
        "apikey": settings.ETHERSCAN_API_KEY
    }
    resp = requests.get(ETHERSCAN_API, params=params)
    data = resp.json()
    if data.get("status") != "1":
        return []
    return data["result"]  # cada tx dict incluye "blockNumber", "hash", "value", etc.

def poll_and_notify(
    db,
    create_event: Callable[[Dict], schemas.TokenEventCreate],
    get_watchers: Callable[[], List[schemas.WatcherRead]]
):
    """
    Recorre cada Watcher, busca nuevas transacciones, filtra por threshold,
    registra TokenEvent (incluyendo block_number) y dispara notificación.
    """
    watchers = get_watchers()

    for w in watchers:
        # 1) Calcula desde qué bloque arrancar
        last_events = crud.get_events_for_watcher(db, w.id, skip=0, limit=1)
        if last_events:
            # TokenEvent model tiene ahora block_number
            start_block = int(last_events[-1].block_number) + 1
        else:
            start_block = settings.START_BLOCK or 0

        # 2) Trae las txs desde Etherscan
        txs = fetch_transfers(w.contract, start_block=start_block)

        # 3) Filtra y crea eventos
        for tx in txs:
            volume = float(tx["value"]) / 10**18
            if volume >= w.threshold:
                payload = {
                    "watcher_id": w.id,
                    "contract":   w.contract,
                    "volume":     volume,
                    "tx_hash":    tx["hash"],
                    "block_number": int(tx["blockNumber"]),  # <-- aquí añadimos block_number
                }
                evt = create_event(schemas.TokenEventCreate(**payload))
                notifier.notify(w, evt)

        # 4) Para no superar rate‐limit de Etherscan
        time.sleep(1)
