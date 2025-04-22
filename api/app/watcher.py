import time
import requests
from typing import Callable, List, Dict

from . import schemas, crud, notifier
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
    create_event: Callable[[schemas.TokenEventCreate], schemas.TokenEventRead],
    get_watchers: Callable[[], List[schemas.WatcherRead]]
):
    watchers = get_watchers()
    for w in watchers:
        # calcula desde qué bloque
        last = crud.get_events_for_watcher(db, w.id, skip=0, limit=1)
        if last:
            start_block = int(last[-1].block_number) + 1
        else:
            start_block = settings.START_BLOCK or 0

        txs = fetch_transfers(w.contract, start_block=start_block)
        for tx in txs:
            volume = float(tx["value"]) / 10**18
            if volume >= w.threshold:
                payload = {
                    "watcher_id":   w.id,
                    "contract":     w.contract,
                    "volume":       volume,
                    "tx_hash":      tx["hash"],
                    "block_number": int(tx["blockNumber"]),
                }
                evt = create_event(schemas.TokenEventCreate(**payload))
                notifier.notify(w, evt)

        time.sleep(1)
