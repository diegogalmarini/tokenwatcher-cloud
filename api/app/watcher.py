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
from .clients import etherscan_client, coingecko_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def fetch_transfers(contract_address: str, start_block: int) -> List[Dict[str, Any]]:
    try:
        start_block = int(start_block) if start_block is not None else 0
    except (ValueError, TypeError):
        logger.error(f"❌ [FETCH_TRANSFERS] start_block inválido: {start_block} para contrato {contract_address}. Usando 0.")
        start_block = 0

    params = {
        "module": "account", "action": "tokentx", "contractaddress": contract_address,
        "startblock": str(start_block), "endblock": "latest", "page": 1, "offset": 1000,
        "sort": "asc", "apikey": settings.ETHERSCAN_API_KEY,
    }
    logger.info(f"  📞 [FETCH_TRANSFERS] Consultando Etherscan para {contract_address} desde bloque {start_block}...")
    try:
        response = requests.get("https://api.etherscan.io/api", params=params, timeout=20)
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "1":
            return data.get("result", [])
        return []
    except requests.exceptions.RequestException as e:
        logger.error(f"  ❌ [FETCH_TRANSFERS_ERROR] Fallo en la solicitud a Etherscan API para {contract_address}: {e}")
        return []
    except json.JSONDecodeError:
        logger.error(f"  ❌ [FETCH_TRANSFERS_ERROR] Error al decodificar JSON de Etherscan para {contract_address}.")
        return []


def poll_and_notify(
    db: Session,
    get_active_watchers_func: Callable[[], List[WatcherModel]],
    create_event_func: Callable[[schemas.TokenEventCreate], Optional[EventModel]],
):
    logger.info("🔄 [POLL_CYCLE] Iniciando ciclo de sondeo y notificación...")
    active_watchers = get_active_watchers_func()

    if not active_watchers:
        logger.info("ℹ️ [POLL_INFO] No hay watchers activos para procesar.")
        return
    logger.info(f"ℹ️ [POLL_INFO] Procesando {len(active_watchers)} watcher(s) activo(s)...")

    for watcher_instance in active_watchers:
        logger.info(f"  ▶️ [WATCHER_PROC] Procesando Watcher ID={watcher_instance.id}, Nombre='{watcher_instance.name}'")

        latest_event = db.query(EventModel).filter(EventModel.watcher_id == watcher_instance.id).order_by(desc(EventModel.block_number)).first()
        start_block_for_watcher = latest_event.block_number + 1 if latest_event else settings.START_BLOCK
        logger.info(f"    🔍 [START_BLOCK] Para Watcher ID={watcher_instance.id}, comenzando desde el bloque: {start_block_for_watcher}")

        transactions = fetch_transfers(watcher_instance.token_address, start_block=start_block_for_watcher)
        
        if not transactions:
            continue

        # --- MODIFICADO: Obtenemos el precio actual UNA VEZ por watcher ---
        current_price_data = coingecko_client.get_token_market_data(watcher_instance.token_address)
        current_price = current_price_data.get("price") if current_price_data else None
        if current_price is None:
            logger.warning(f"    ⚠️ [PRICE_FETCH] No se pudo obtener el precio actual para {watcher_instance.name}. Se procesarán eventos sin valor USD.")

        newly_created_events_for_this_watcher: List[EventModel] = []
        for tx_data in transactions:
            try:
                amount_transferred = float(tx_data.get("value", "0")) / (10**int(tx_data.get("tokenDecimal", "18")))
                
                if amount_transferred >= watcher_instance.threshold:
                    logger.info(f"      ❗ [THRESHOLD_MET] Monto {amount_transferred:.4f} >= umbral {watcher_instance.threshold}. Creando evento...")
                    
                    # --- MODIFICADO: Usamos el precio actual en lugar de buscar el histórico ---
                    usd_value = (amount_transferred * current_price) if current_price is not None else None
                    
                    checksum_address = Web3.to_checksum_address(tx_data.get("contractAddress", watcher_instance.token_address))

                    event_payload_schema = schemas.TokenEventCreate(
                        watcher_id=watcher_instance.id,
                        token_address_observed=checksum_address,
                        from_address=tx_data.get("from", "").lower(),
                        to_address=tx_data.get("to", "").lower(),
                        amount=amount_transferred,
                        transaction_hash=tx_data.get("hash", "N/A"),
                        block_number=int(tx_data.get("blockNumber", "0")),
                        usd_value=usd_value,
                        token_name=tx_data.get("tokenName"),
                        token_symbol=tx_data.get("tokenSymbol")
                    )

                    created_event = create_event_func(event_payload_schema)
                    if created_event:
                        logger.info(f"      ✅ [EVENT_CREATED/EXISTED] Evento ID={created_event.id} procesado.")
                        newly_created_events_for_this_watcher.append(created_event)

            except Exception as e_tx_proc:
                logger.exception(f"      ❌ [TX_PROCESS_ERROR] Error general al procesar tx {tx_data.get('hash', 'N/A')}: {e_tx_proc!r}")

        if newly_created_events_for_this_watcher:
            logger.info(f"  🔔 [NOTIFICATION_PROCESSING] {len(newly_created_events_for_this_watcher)} evento(s) para notificar (Watcher ID={watcher_instance.id}).")
            for transport_instance in watcher_instance.transports:
                webhook_url = transport_instance.config.get("url") if isinstance(transport_instance.config, dict) else None
                if webhook_url:
                    try:
                        logger.info(f"    ▶️ [SENDING_VIA_TRANSPORT] Enviando via {transport_instance.type} (ID={transport_instance.id})")
                        if transport_instance.type == "slack":
                            notifier.notify_slack_blockkit(webhook_url, watcher_instance, newly_created_events_for_this_watcher)
                        elif transport_instance.type == "discord":
                            notifier.notify_discord_embed(webhook_url, watcher_instance, newly_created_events_for_this_watcher)
                    except Exception as e_notify:
                        logger.exception(f"    ❌ [NOTIFICATION_DISPATCH_ERROR] Falló envío para Transport ID={transport_instance.id}: {e_notify!r}")

    logger.info("🔄 [POLL_CYCLE] Ciclo de sondeo y notificación finalizado.")

if __name__ == "__main__":
    from .database import SessionLocal
    
    db_session = SessionLocal()
    logger.info("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    logger.info("▶ [WATCHER_SCRIPT_RUN] Iniciando TokenWatcher Poller (ejecución directa)...")
    try:
        get_watchers_for_run = lambda: crud.get_active_watchers(db_session)
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