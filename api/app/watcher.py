# api/app/watcher.py
import time
import requests
from typing import Callable, List, Dict, Any

from . import schemas, crud, notifier
from .config import settings

ETHERSCAN_API = "https://api.etherscan.io/api"

def fetch_transfers(contract: str, start_block: int = 0) -> List[Dict[str, Any]]:
    params = {
        "module": "account",
        "action": "tokentx",
        "contractaddress": contract,
        "startblock": start_block,
        "endblock": start_block + settings.MAX_BLOCK_RANGE,
        "sort": "asc",
        "apikey": settings.ETHERSCAN_API_KEY,
    }
    resp = requests.get(ETHERSCAN_API, params=params, timeout=10)
    data = resp.json()
    if data.get("status") != "1":
        print(f"⚠️ [DEBUG] Etherscan error: {data.get('message')}")
        return []
    return data["result"]

def poll_and_notify(
    db,
    get_watchers: Callable[[Any], List[schemas.WatcherRead]],
    create_event: Callable[[Any, Dict[str, Any]], schemas.TokenEventCreate],
):
    print("🔄 [DEBUG] ▶ poll_and_notify start")
    watchers = get_watchers(db)
    print(f"🔄 [DEBUG] ▶ Watchers en BD: {len(watchers)}")

    for w in watchers:
        print(f"▶ Procesando watcher id={w.id} name={w.name!r} umbral={w.threshold}")
        last = crud.get_events_for_watcher(db, w.id, skip=0, limit=1)
        start_block = int(last[-1].block_number) + 1 if last else settings.START_BLOCK or 0
        print(f"   ▶ start_block={start_block}")
        txs = fetch_transfers(w.token_address, start_block)
        print(f"   ▶ transfers encontradas: {len(txs)}")

        for tx in txs:
            amt = float(tx["value"]) / 10**18
            if amt >= w.threshold:
                payload = {
                    "watcher_id":   w.id,
                    "contract":     w.token_address,
                    "volume":       amt,
                    "tx_hash":      tx["hash"],
                    "block_number": int(tx["blockNumber"]),
                }
                evt = create_event(db, payload)
                notifier.notify(w, evt)

        time.sleep(settings.POLL_INTERVAL or 1)

    print("🔄 [DEBUG] ▶ poll_and_notify end")

if __name__ == "__main__":
    from .database import SessionLocal

    db = SessionLocal()
    poll_and_notify(
        db=db,
        get_watchers=lambda session: crud.get_watchers(session),
        create_event=lambda session, data: crud.create_event(session, schemas.TokenEventCreate(**data)),
    )
    db.close()
