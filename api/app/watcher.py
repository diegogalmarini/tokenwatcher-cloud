# api/app/watcher.py

import time
import requests
from typing import Callable, List, Dict
from . import schemas, crud
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
    return data["result"]

def poll_and_notify(
    db,
    create_event: Callable[[Dict], schemas.TokenEventCreate],
    get_watchers: Callable[[], List]
):
    """
    Recorre cada Watcher, busca nuevas transacciones, filtra por threshold,
    registra TokenEvent y dispara notificación vía notifier.
    """
    from . import notifier

    watchers = get_watchers()
    for w in watchers:
        # Determinar bloque desde el que empezar
        last_events = crud.get_events_for_watcher(db, w.id, skip=0, limit=1)
        start_block = 0
        if last_events:
            # suponemos que TokenEventRead tiene block_number
            start_block = int(last_events[-1].block_number) + 1

        txs = fetch_transfers(w.contract, start_block=start_block)

        for tx in txs:
            amt = float(tx["value"]) / 10**18
            if amt >= w.threshold:
                payload = {
                    "watcher_id": w.id,
                    "contract": w.contract,
                    "volume": amt,
                    "tx_hash": tx["hash"]
                }
                evt = create_event(payload)
                notifier.notify(w, evt)

        time.sleep(1)
