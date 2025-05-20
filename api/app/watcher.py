import time
import requests
from typing import Callable, List, Dict

from . import schemas, notifier, crud
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
        "endblock": start_block + settings.MAX_BLOCK_RANGE,
        "sort": "asc",
        "apikey": settings.ETHERSCAN_API_KEY,
    }
    resp = requests.get(ETHERSCAN_API, params=params, timeout=10)
    data = resp.json()
    if data.get("status") != "1":
        print(f"⚠️ [DEBUG] Etherscan no devolvió transfers status=1: {data.get('message')}")
        return []
    return data["result"]


def poll_and_notify(
    db,
    create_event: Callable[[Dict], schemas.TokenEventCreate],
    get_watchers: Callable[[], List],
):
    """
    Recorre cada Watcher, busca nuevas transacciones, filtra por threshold,
    registra TokenEvent y dispara notificación vía notifier.notify().
    """
    print("🔄 [DEBUG] ▶ poll_and_notify start")
    watchers = get_watchers()
    print(f"🔄 [DEBUG] ▶ Watchers en BD: {len(watchers)}")

    for w in watchers:
        print(f"▶ [DEBUG] Procesando watcher id={w.id} nombre={w.name!r} threshold={w.threshold}")
        # Determinar bloque desde el que empezar
        last_events = crud.get_events_for_watcher(db, w.id, skip=0, limit=1)
        if last_events:
            start_block = int(last_events[-1].block_number) + 1
        else:
            start_block = settings.START_BLOCK or 0
        print(f"   ▶ [DEBUG] start_block para watcher {w.id} = {start_block}")

        txs = fetch_transfers(w.contract, start_block=start_block)
        print(f"   ▶ [DEBUG] encontrados {len(txs)} txs desde bloque {start_block}")

        for tx in txs:
            amt = float(tx["value"]) / 10**18
            print(f"   ▶ [DEBUG] tx @block={tx['blockNumber']} amount={amt:.6f}")
            if amt >= w.threshold:
                print("   ✅ [DEBUG] above threshold, creando evento")
                payload = {
                    "watcher_id":   w.id,
                    "contract":     w.contract,
                    "volume":       amt,
                    "tx_hash":      tx["hash"],
                    "block_number": int(tx["blockNumber"]),
                }
                evt = create_event(payload)
                print(f"   ✅ [DEBUG] Created event id={evt.id}")

                print("   🔔 [DEBUG] Notificando canales…")
                try:
                    notifier.notify(w, evt)
                except Exception as e:
                    print(f"   ❌ [ERROR] notifier.notify() falló: {e!r}")
                else:
                    print("   ✅ [DEBUG] Notification done")

        time.sleep(settings.POLL_INTERVAL or 1)

    print("🔄 [DEBUG] ▶ poll_and_notify end")


if __name__ == "__main__":
    # Bloque que Render invoca con `python -m api.app.watcher`
    from api.app.config import SessionLocal
    from api.app.crud import get_watchers, create_event

    db = SessionLocal()
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    print("▶ [DEBUG] Arrancando cron poll_and_notify")
    poll_and_notify(
        db=db,
        get_watchers=lambda: get_watchers(db),
        create_event=lambda data: create_event(db, schemas.TokenEventCreate(**data)),
    )
    db.close()
    print("▶ [DEBUG] cron terminado")
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
