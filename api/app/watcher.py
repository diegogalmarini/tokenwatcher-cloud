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

    print("🔄 [DEBUG] ▶ Arrancando cron poll_and_notify")
    watchers = get_watchers()
    print(f"🔄 [DEBUG] ▶ Watchers en BD: {len(watchers)}")
    for w in watchers:
        print(f"[DEBUG] ▶ Procesando watcher id={w.id} nombre={w.name!r} threshold={w.threshold}")
        # Determinar bloque desde el que empezar
        last_events = crud.get_events_for_watcher(db, w.id, skip=0, limit=1)
        if last_events:
            start_block = int(last_events[-1].block_number) + 1
        else:
            start_block = settings.START_BLOCK or 0
        print(f"[DEBUG] ▶ start_block para watcher {w.id} = {start_block}")

        # Buscamos los transfers
        txs = fetch_transfers(w.contract, start_block=start_block)
        print(f"[DEBUG] ▶ encontrados {len(txs)} txs desde bloque {start_block}")

        for tx in txs:
            amt = float(tx["value"]) / 10**18
            print(f"[DEBUG] ▶ tx @block={tx['blockNumber']} amount={amt}")
            if amt >= w.threshold:
                print("✅ [DEBUG] ▶ above threshold, creando evento")
                payload = {
                    "watcher_id":   w.id,
                    "contract":     w.contract,
                    "volume":       amt,
                    "tx_hash":      tx["hash"],
                    "block_number": int(tx["blockNumber"])   # ← lo añadimos aquí
                }
                evt = create_event(payload)
                print(f"[DEBUG] ▶ Created event id={evt.id}")
                print("🔔 [DEBUG] ▶ Notifying Slack…")
                notifier.notify(w, evt)
                print("✅ [DEBUG] ▶ Notification done")

        time.sleep(settings.POLL_INTERVAL or 1)

    print("🔄 [DEBUG] ▶ poll_and_notify end")


if __name__ == "__main__":
    # Este bloque se ejecuta cuando Render corre: python -m api.app.watcher
    from .config import SessionLocal
    from .crud import get_watchers, create_event

    db = SessionLocal()
    print("[DEBUG] ■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    print("[DEBUG] ▶ Arrancando cron poll_and_notify")
    poll_and_notify(
        db=db,
        get_watchers=lambda: get_watchers(db),
        create_event=lambda data: create_event(schemas.TokenEventCreate(**data)),
    )
    db.close()
    print("[DEBUG] ▶ cron terminado")
    print("[DEBUG] ■■■■■■■■■■■■■■■■■■■■■■■■■■■")
