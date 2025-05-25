# api/app/watcher.py
import time
import requests
import json
import logging
from typing import Callable, List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from web3 import Web3 # <--- NUEVA IMPORTACIÓN

from . import schemas, crud, notifier
from .config import settings
from .models import Watcher as WatcherModel, TokenEvent as EventModel
from .clients import etherscan_client
from .clients import coingecko_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ETHERSCAN_API_URL = "https://api.etherscan.io/api"

def fetch_transfers(contract_address: str, start_block: int) -> List[Dict[str, Any]]:
    # ... (tu función fetch_transfers se mantiene igual) ...
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
    response_text = ""
    try:
        response = requests.get(ETHERSCAN_API_URL, params=params, timeout=20)
        response_text = response.text
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "1":
            result = data.get("result", [])
            logger.info(f"  ✅ [FETCH_TRANSFERS] Etherscan devolvió {len(result)} transacciones.")
            return result
        elif data.get("message") == "No transactions found":
            logger.info(f"  ℹ️ [FETCH_TRANSFERS] No se encontraron transacciones nuevas para {contract_address} desde bloque {start_block}.")
            return []
        else:
            logger.warning(f"  ⚠️ [FETCH_TRANSFERS_WARN] Etherscan API devolvió status '{data.get('status')}' con mensaje: '{data.get('message')}' para {contract_address}.")
            return []
    except requests.exceptions.Timeout:
        logger.error(f"  ❌ [FETCH_TRANSFERS_ERROR] Timeout al contactar Etherscan API para {contract_address}.")
        return []
    except requests.exceptions.RequestException as e:
        logger.error(f"  ❌ [FETCH_TRANSFERS_ERROR] Fallo en la solicitud a Etherscan API para {contract_address}: {e}")
        return []
    except json.JSONDecodeError:
        logger.error(f"  ❌ [FETCH_TRANSFERS_ERROR] Error al decodificar JSON de Etherscan para {contract_address}. Respuesta: {response_text[:500]}")
        return []


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
            for tx_data in transactions:
                try:
                    token_decimal_str = tx_data.get("tokenDecimal", "18")
                    token_decimal = int(token_decimal_str) if token_decimal_str.isdigit() else 18
                    value_str = tx_data.get("value", "0")
                    if not value_str.isdigit(): continue
                    amount_transferred = float(value_str) / (10**token_decimal)
                    current_block_number_str = tx_data.get("blockNumber", "0")
                    if not current_block_number_str.isdigit(): continue
                    current_block_number = int(current_block_number_str)
                    from_addr = tx_data.get("from", "").lower()
                    to_addr = tx_data.get("to", "").lower()
                    tx_hash = tx_data.get("hash", "N/A")

                    # --- INICIO CAMBIO CHECKSUM ---
                    contract_addr_from_tx = tx_data.get("contractAddress", watcher_instance.token_address)
                    try:
                        # Asegura que la dirección observada esté en formato checksum
                        token_address_observed_checksummed = Web3.to_checksum_address(contract_addr_from_tx)
                    except Exception:
                        # Si falla la conversión (ej. dirección inválida), usa la original o la del watcher
                        logger.warning(f"      ⚠️ [CHECKSUM_WARN] No se pudo convertir a checksum: {contract_addr_from_tx}. Usando original.")
                        token_address_observed_checksummed = contract_addr_from_tx
                    # --- FIN CAMBIO CHECKSUM ---


                    if not from_addr or not to_addr or tx_hash == "N/A": continue
                    logger.debug(f"      🔎 [TX_DETAIL] Hash={tx_hash[:10]}.., Block={current_block_number}, Amount={amount_transferred:.4f}")

                    if amount_transferred >= watcher_instance.threshold:
                        logger.info(f"      ❗ [THRESHOLD_MET] Monto {amount_transferred:.4f} >= umbral {watcher_instance.threshold}. Creando evento...")

                        existing_event_check = db.query(EventModel.id).filter(EventModel.transaction_hash == tx_hash, EventModel.watcher_id == watcher_instance.id).first()
                        if existing_event_check:
                            logger.warning(f"      ⚠️ [DUPLICATE_EVENT] Evento con tx_hash {tx_hash} ya existe. Saltando.")
                            continue

                        usd_value = None
                        timestamp = etherscan_client.get_block_timestamp(current_block_number)
                        if timestamp:
                            # Usamos la dirección checksummed para buscar el precio
                            price = coingecko_client.get_historical_price_usd(token_address_observed_checksummed, timestamp)
                            if price is not None:
                                usd_value = amount_transferred * price
                                logger.info(f"      💲 [USD_CALC] Valor USD calculado: {usd_value:.2f}")
                            else:
                                logger.warning(f"      ⚠️ [USD_CALC] No se pudo obtener precio para {token_address_observed_checksummed} en timestamp {timestamp}.")
                        else:
                             logger.warning(f"      ⚠️ [USD_CALC] No se pudo obtener timestamp para bloque {current_block_number}.")

                        event_payload_schema = schemas.TokenEventCreate(
                            watcher_id=watcher_instance.id,
                            token_address_observed=token_address_observed_checksummed, # <-- USA LA VERSIÓN CHECKSUMMED
                            from_address=from_addr,
                            to_address=to_addr,
                            amount=amount_transferred,
                            transaction_hash=tx_hash,
                            block_number=current_block_number,
                            usd_value=usd_value
                        )

                        created_event = create_event_func(event_payload_schema)
                        if created_event:
                             logger.info(f"      ✅ [EVENT_CREATED] Evento ID={created_event.id} persistido (USD: {created_event.usd_value}).")
                             newly_created_events_for_this_watcher.append(created_event)
                        else:
                             logger.error(f"      ❌ [EVENT_CREATE_FAIL] No se pudo crear el evento para tx_hash {tx_hash}.")
                except Exception as e_tx_proc:
                    logger.exception(f"      ❌ [TX_PROCESS_ERROR] Error general al procesar tx {tx_data.get('hash', 'N/A')}: {e_tx_proc!r}")

        if newly_created_events_for_this_watcher:
            logger.info(f"  🔔 [NOTIFICATION_PROCESSING] {len(newly_created_events_for_this_watcher)} evento(s) nuevo(s) para notificar (Watcher ID={watcher_instance.id}).")
            if not watcher_instance.transports:
                logger.info(f"    ℹ️ [NO_TRANSPORTS] No hay transports para Watcher ID={watcher_instance.id}.")
            else:
                for transport_instance in watcher_instance.transports:
                    webhook_url = transport_instance.config.get("url") if isinstance(transport_instance.config, dict) else None
                    if not webhook_url:
                        logger.warning(f"    ⚠️ [TRANSPORT_INVALID_CONFIG] Transport ID={transport_instance.id} no tiene URL.")
                        continue
                    try:
                        logger.info(f"    ▶️ [SENDING_VIA_TRANSPORT] Enviando via {transport_instance.type} (ID={transport_instance.id})")
                        if transport_instance.type == "slack":
                            notifier.notify_slack_blockkit(webhook_url, watcher_instance, newly_created_events_for_this_watcher)
                        elif transport_instance.type == "discord":
                            notifier.notify_discord_embed(webhook_url, watcher_instance, newly_created_events_for_this_watcher)
                    except Exception as e_notify:
                        logger.exception(f"    ❌ [NOTIFICATION_DISPATCH_ERROR] Falló envío para Transport ID={transport_instance.id}: {e_notify!r}")
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