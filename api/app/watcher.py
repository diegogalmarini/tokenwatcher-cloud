# api/app/watcher.py

import time
import requests
from typing import Callable, List, Dict
from . import schemas, crud
from .config import settings

ETHERSCAN_API = "https://api.etherscan.io/api"

def fetch_transfers(contract: str, start_block: int = 0) -> List[Dict]:
    """
    Llama a Etherscan y devuelve la lista de transfers ERC-20
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
        print(f"[DEBUG] fetch_transfers returned no data for {contract} from block {start_block}")
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

    print("[DEBUG] ▶ Entering poll_and_notify")           ### DEBUG
    watchers = get_watchers()
    print(f"[DEBUG] ▶ Found {len(watchers)} watchers")    ### DEBUG

    for w in watchers:
        print(f"[DEBUG] — processing watcher {w.id} «{w.name}» threshold={w.threshold}")  ### DEBUG

        # Determinar bloque desde el que empezar
        last_events = crud.get_events_for_watcher(db, w.id, skip=0, limit=1)
        start_block = 0
        if last_events:
            # usamos el nuevo atributo block_number
            start_block = int(last_events[-1].block_number) + 1
        print(f"[DEBUG]   start_block for watcher {w.id} = {start_block}")  ### DEBUG

        # Traemos todas las txs nuevas
        txs = fetch_transfers(w.contract, start_block=start_block)
        print(f"[DEBUG]   fetched {len(txs)} txs from Etherscan")  ### DEBUG

        for tx in txs:
            # blockNumber viene como string
            blk = int(tx.get("blockNumber", start_block))
            amt = float(tx["value"]) / 10**18
            print(f"[DEBUG]     tx @block={blk} amount={amt}")  ### DEBUG

            if amt >= w.threshold:
                print(f"[DEBUG]     ✅ above threshold, creating event")  ### DEBUG
                payload = {
                    "watcher_id": w.id,
                    "contract":   w.contract,
                    "volume":     amt,
                    "tx_hash":    tx["hash"],
                    "block_number": blk            # nuevo campo
                }
                evt = create_event(payload)
                print(f"[DEBUG]     ✅ Created event id={evt.id}")  ### DEBUG
                print(f"[DEBUG]     📣 Notifying Slack…")         ### DEBUG
                notifier.notify(w, evt)
                print(f"[DEBUG]     ✅ Notification done")        ### DEBUG

        time.sleep(1)
