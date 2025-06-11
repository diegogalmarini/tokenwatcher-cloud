# api/app/watcher.py
import time
import requests
import json
import logging
from typing import Callable, List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from web3 import Web3

from . import schemas, crud, notifier
from .config import settings
from .models import Watcher as WatcherModel, TokenEvent as EventModel
from .clients import etherscan_client
from .clients import coingecko_client # Ya estamos importando el cliente

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ETHERSCAN_API_URL = "https://api.etherscan.io/api"

def fetch_transfers(contract_address: str, start_block: int) -> List[Dict[str, Any]]:
    # ... (Esta función no cambia)
    try:
        start_block = int(start_block) if start_block is not None else 0
    except ValueError:
        logger.error(f"❌ [FETCH_TRANSFERS] start_block inválido: {start_block} para contrato {contract_address}. Usando 0.")
        start_block = 0

    params = {
        "module": "account", "action": "tokentx", "contractaddress": contract_address,
        "startblock": str(start_block), "endblock": "latest", "page": 1, "offset": 1000,
        "sort": "asc", "apikey": settings.ETHERSCAN_API_KEY,
    }
    logger.info(f"  📞 [FETCH_TRANSFERS] Consultando Etherscan para {contract_address} desde bloque {start_block}...")
    # ... (El resto de la lógica de fetch_transfers se mantiene igual)
    return [] # Devuelve una lista vacía en caso de error para que no se muestre el código completo


def poll_and_notify(
    db: Session,
    get_active_watchers_func: Callable[[], List[WatcherModel]],
    create_event_func: Callable[[schemas.TokenEventCreate], Optional[EventModel]],
):
    logger.info("🔄 [POLL_CYCLE] Iniciando ciclo de sondeo y notificación...")
    try:
        active_watchers = get_active_watchers_func()
    except Exception as e:
        logger.exception(f"❌ [POLL_ERROR] Error al obtener watchers activos de la BD: {e!r}")
        return

    if not active_watchers:
        logger.info("ℹ️ [POLL_INFO] No hay watchers activos para procesar. Finalizando ciclo.")
        return
    logger.info(f"ℹ️ [POLL_INFO] Procesando {len(active_watchers)} watcher(s) activo(s)...")

    for watcher_instance in active_watchers:
        logger.info(f"  ▶️ [WATCHER_PROC] Procesando Watcher ID={watcher_instance.id}, Nombre='{watcher_instance.name}'")

        start_block_for_watcher: int = settings.START_BLOCK
        try:
            latest_event = db.query(EventModel).filter(EventModel.watcher_id == watcher_instance.id).order_by(desc(EventModel.block_number)).first()
            if latest_event:
                start_block_for_watcher = latest_event.block_number + 1
        except Exception as e_get_block:
            logger.exception(f"    ❌ [START_BLOCK_ERROR] Error al obtener el último block_number para Watcher ID={watcher_instance.id}: {e_get_block!r}. Usando START_BLOCK global.")

        logger.info(f"    🔍 [START_BLOCK] Para Watcher ID={watcher_instance.id}, comenzando desde el bloque: {start_block_for_watcher}")

        newly_created_events_for_this_watcher: List[EventModel] = []
        try:
            transactions = fetch_transfers(watcher_instance.token_address, start_block=start_block_for_watcher)
        except Exception as e:
            logger.exception(f"    ❌ [TX_FETCH_ERROR] Error irrecuperable en fetch_transfers para {watcher_instance.token_address}: {e!r}. Saltando este watcher.")
            continue

        if not transactions:
            logger.info(f"    ℹ️ [TX_INFO] No hay transacciones nuevas para Watcher ID={watcher_instance.id}.")
        else:
            logger.info(f"    📊 [TX_FOUND] {len(transactions)} transacciones encontradas para Watcher ID={watcher_instance.id}.")
            
            # --- CAMBIO: Obtenemos el precio actual UNA VEZ por watcher ---
            current_price_data = coingecko_client.get_token_market_data(watcher_instance.token_address)
            current_price = current_price_data.get("price") if current_price_data else None
            if current_price:
                 logger.info(f"    💲 [PRICE_FETCH] Precio actual para {watcher_instance.name} es ${current_price:.4f}")
            else:
                 logger.warning(f"    ⚠️ [PRICE_FETCH] No se pudo obtener el precio actual para {watcher_instance.name}.")


            for tx_data in transactions:
                try:
                    # ... (la lógica para procesar cada tx_data se mantiene igual) ...
                    token_decimal_str = tx_data.get("tokenDecimal", "18")
                    token_decimal = int(token_decimal_str) if token_decimal_str.isdigit() else 18
                    value_str = tx_data.get("value", "0")
                    if not value_str.isdigit(): continue
                    amount_transferred = float(value_str) / (10**token_decimal)
                    # ...

                    if amount_transferred >= watcher_instance.threshold:
                        logger.info(f"      ❗ [THRESHOLD_MET] Monto {amount_transferred:.4f} >= umbral {watcher_instance.threshold}. Creando evento...")
                        
                        # --- CAMBIO: Usamos el precio actual en lugar de buscar el histórico ---
                        usd_value = None
                        if current_price is not None:
                            usd_value = amount_transferred * current_price
                            logger.info(f"      💲 [USD_CALC] Valor USD calculado: {usd_value:.2f}")
                        else:
                            logger.warning(f"      ⚠️ [USD_CALC] Usando valor USD nulo porque no se pudo obtener el precio actual.")

                        event_payload_schema = schemas.TokenEventCreate(
                            watcher_id=watcher_instance.id,
                            # ... (resto de campos)
                            usd_value=usd_value,
                            # ... (resto de campos)
                        )

                        created_event = create_event_func(event_payload_schema)
                        if created_event:
                            logger.info(f"      ✅ [EVENT_CREATED/EXISTED] Evento ID={created_event.id} procesado (USD: {created_event.usd_value}, Symbol: {created_event.token_symbol}).")
                            newly_created_events_for_this_watcher.append(created_event)

                except Exception as e_tx_proc:
                    logger.exception(f"      ❌ [TX_PROCESS_ERROR] Error general al procesar tx {tx_data.get('hash', 'N/A')}: {e_tx_proc!r}")

        if newly_created_events_for_this_watcher:
            # ... (la lógica de notificación se mantiene igual) ...
            pass
        else:
            logger.info(f"  ℹ️ [NO_NEW_EVENTS_TO_NOTIFY] No hay eventos nuevos para notificar (Watcher ID={watcher_instance.id}).")

    logger.info("🔄 [POLL_CYCLE] Ciclo de sondeo y notificación finalizado.")

if __name__ == "__main__":
    from .database import SessionLocal
    from . import crud

    db_session = SessionLocal()
    logger.info("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    logger.info("▶ [WATCHER_SCRIPT_RUN] Iniciando TokenWatcher Poller (ejecución directa)...")
    try:
        get_watchers_for_run = lambda: crud.get_active_watchers(db_session)
        # Asegurarse que crud.create_event puede ser llamado así y que su tipo de retorno es compatible
        create_event_for_run = lambda data_payload: crud.create_event(db_session, data_payload)

        poll_and_notify(
            db=db_session,
            get_active_watchers_func=get_watchers_for_run,
            create_event_func=create_event_for_run
        )
    except Exception as e_main:
        logger.exception(f"❌ [WATCHER_SCRIPT_FATAL] Excepción no manejada: {e_main!r}")
    finally:
        db_session.close()
        logger.info("▶ [WATCHER_SCRIPT_RUN] Sesión DB cerrada. Poller finalizado.")
    logger.info("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")