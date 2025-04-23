import time
import requests
from typing import Callable, List, Dict
from . import schemas, crud
from .config import settings

ETHERSCAN_API = "https://api.etherscan.io/api"

def fetch_transfers(contract: str, start_block: int = 0) -> List[Dict]:
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
    create_event: Callable[[schemas.TokenEventCreate], schemas.TokenEventCreate],
    get_watchers: Callable[[], List]
):
    from . import notifier

    watchers = get_watchers()
    for w in watchers:
        # 1) Determinar el bloque desde el que empezar
        last_events = crud.get_events_for_watcher(db, w.id, skip=0, limit=1)
        if last_events:
            start_block = last_events[-1].block_number + 1
        else:
            start_block = settings.START_BLOCK or 0
        print(f"[DEBUG] Watcher {w.id}: start_block={start_block}", flush=True)

        # 2) Traer transferencias nuevas
        txs = fetch_transfers(w.contract, start_block=start_block)

        # 3) Filtrar y crear evento + notificar
        for tx in txs:
            block = int(tx.get("blockNumber", 0))
            amt = float(tx.get("value", 0)) / 10**18
            if amt >= w.threshold:
                print(f"[DEBUG] Transfer at block {block}, amount {amt}", flush=True)
                payload = {
                    "watcher_id": w.id,
                    "contract": w.contract,
                    "volume": amt,
                    "tx_hash": tx.get("hash"),
                    "block_number": block
                }
                evt = create_event(schemas.TokenEventCreate(**payload))
                print(f"[INFO] ✅ New event {evt.id} for watcher {w.id} – notifying…", flush=True)
                notifier.notify(w, evt)

        time.sleep(1)