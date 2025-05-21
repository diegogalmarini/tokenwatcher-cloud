# api/app/watcher.py
import time
import requests
import json # Necesario para json.JSONDecodeError si lo usas
from typing import Callable, List, Dict, Any 
from sqlalchemy.orm import Session
from sqlalchemy import desc

from . import schemas, crud, notifier
from .config import settings
from .models import Watcher as WatcherModel, Event as EventModel

ETHERSCAN_API_URL = "https://api.etherscan.io/api"

def fetch_transfers(contract_address: str, start_block: int) -> List[Dict[str, Any]]:
    try:
        start_block = int(start_block)
    except ValueError:
        print(f"❌ [ERROR] start_block inválido: {start_block} para contrato {contract_address}. Usando 0 por defecto.")
        start_block = 0
    
    params = {
        "module": "account", "action": "tokentx", "contractaddress": contract_address,
        "startblock": str(start_block), "endblock": "latest", "page": 1, "offset": 1000,
        "sort": "asc", "apikey": settings.ETHERSCAN_API_KEY,
    }
    print(f"  📞 [FETCH_TRANSFERS] Consultando Etherscan para {contract_address} desde bloque {start_block}...")
    response_text = "" # Para logueo en caso de JSONDecodeError
    try:
        response = requests.get(ETHERSCAN_API_URL, params=params, timeout=20)
        response_text = response.text # Guardar texto para posible error de JSON
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "1":
            result = data.get("result", [])
            print(f"  ✅ [FETCH_TRANSFERS] Etherscan devolvió {len(result)} transacciones.")
            return result
        elif data.get("message") == "No transactions found":
            print(f"  ℹ️ [FETCH_TRANSFERS] No se encontraron transacciones nuevas para {contract_address} desde bloque {start_block}.")
            return []
        else:
            print(f"  ⚠️ [FETCH_TRANSFERS_WARN] Etherscan API devolvió status '{data.get('status')}' con mensaje: '{data.get('message')}' para {contract_address}.")
            return []
    except requests.exceptions.Timeout:
        print(f"  ❌ [FETCH_TRANSFERS_ERROR] Timeout al contactar Etherscan API para {contract_address}.")
        return []
    except requests.exceptions.RequestException as e:
        print(f"  ❌ [FETCH_TRANSFERS_ERROR] Fallo en la solicitud a Etherscan API para {contract_address}: {e}")
        return []
    except json.JSONDecodeError:
        print(f"  ❌ [FETCH_TRANSFERS_ERROR] Error al decodificar JSON de Etherscan para {contract_address}. Respuesta: {response_text[:500]}") # Loguear parte de la respuesta
        return []

def poll_and_notify(
    db: Session,
    get_watchers_func: Callable[[], List[WatcherModel]],
    create_event_func: Callable[[schemas.TokenEventCreate], EventModel],
):
    print("🔄 [POLL_CYCLE] Iniciando ciclo de sondeo y notificación...")
    try:
        active_watchers = get_watchers_func()
    except Exception as e:
        print(f"❌ [POLL_ERROR] Error al obtener watchers de la BD: {e!r}")
        return

    if not active_watchers:
        print("ℹ️ [POLL_INFO] No hay watchers activos configurados. Finalizando ciclo.")
        return
    print(f"ℹ️ [POLL_INFO] Procesando {len(active_watchers)} watcher(s)...")

    for watcher_instance in active_watchers:
        print(f"  ▶️ [WATCHER_PROC] Procesando Watcher ID={watcher_instance.id}, Nombre='{watcher_instance.name}', Token='{watcher_instance.token_address}', Umbral={watcher_instance.threshold}")
        
        last_event = db.query(EventModel.block_number)\
                       .filter(EventModel.watcher_id == watcher_instance.id)\
                       .order_by(desc(EventModel.block_number))\
                       .first()
        start_block_for_watcher = (int(last_event[0]) + 1) if last_event else settings.START_BLOCK
        print(f"    🔍 [START_BLOCK] Para Watcher ID={watcher_instance.id}, comenzando desde el bloque: {start_block_for_watcher}")

        newly_created_events_for_this_watcher: List[EventModel] = []
        try:
            transactions = fetch_transfers(watcher_instance.token_address, start_block=start_block_for_watcher)
        except Exception as e:
            print(f"    ❌ [TX_FETCH_ERROR] Error irrecuperable en fetch_transfers para {watcher_instance.token_address}: {e!r}. Saltando este watcher.")
            continue

        if not transactions:
            print(f"    ℹ️ [TX_INFO] No hay transacciones nuevas para Watcher ID={watcher_instance.id} desde el bloque {start_block_for_watcher}.")
        else:
            print(f"    📊 [TX_FOUND] {len(transactions)} transacciones encontradas para Watcher ID={watcher_instance.id}.")
            for tx_data in transactions:
                try:
                    token_decimal = int(tx_data.get("tokenDecimal", "18"))
                    value_str = tx_data.get("value", "0")
                    if not value_str.isdigit():
                        print(f"      ⚠️ [TX_WARN] Valor no numérico para 'value' en tx: {tx_data.get('hash')}. Saltando tx.")
                        continue
                    amount_transferred = float(value_str) / (10**token_decimal)
                    print(f"      🔎 [TX_DETAIL] Hash={tx_data.get('hash', 'N/A')[:10]}.., Block={tx_data.get('blockNumber')}, Amount={amount_transferred:.4f}")

                    if amount_transferred >= watcher_instance.threshold:
                        print(f"      ❗ [THRESHOLD_MET] Monto {amount_transferred:.4f} >= umbral {watcher_instance.threshold}. Creando evento...")
                        event_payload_schema = schemas.TokenEventCreate(
                            watcher_id=watcher_instance.id,
                            contract=tx_data.get("contractAddress", watcher_instance.token_address),
                            volume=amount_transferred,
                            tx_hash=tx_data.get("hash", "N/A"),
                            block_number=int(tx_data.get("blockNumber", "0")),
                        )
                        existing_event_check = db.query(EventModel).filter(EventModel.transaction_hash == event_payload_schema.tx_hash).first()
                        if existing_event_check:
                            print(f"      ⚠️ [DUPLICATE_EVENT] Evento con tx_hash {event_payload_schema.tx_hash} ya existe. Saltando.")
                            continue
                        created_event_model = create_event_func(event_payload_schema)
                        print(f"      ✅ [EVENT_CREATED] Evento ID={created_event_model.id} persistido para Watcher ID={watcher_instance.id}.")
                        newly_created_events_for_this_watcher.append(created_event_model)
                except KeyError as ke:
                    print(f"      ❌ [TX_PROCESS_ERROR] Falta una clave esperada en los datos de la transacción: {ke}. Datos: {tx_data}")
                except ValueError as ve:
                    print(f"      ❌ [TX_PROCESS_ERROR] Error de valor al procesar la transacción: {ve}. Datos: {tx_data}")
                except Exception as e_tx_proc:
                    print(f"      ❌ [TX_PROCESS_ERROR] Error general al procesar transacción {tx_data.get('hash', 'N/A')}: {e_tx_proc!r}")
        
        if newly_created_events_for_this_watcher:
            print(f"  🔔 [GROUPED_NOTIFICATION_SENDING] {len(newly_created_events_for_this_watcher)} evento(s) nuevo(s) para Watcher ID={watcher_instance.id}. Preparando notificación agrupada...")
            try:
                if settings.SLACK_WEBHOOK_URL and settings.SLACK_WEBHOOK_URL != "YOUR_SLACK_WEBHOOK_URL_HERE":
                    print(f"    ℹ️ [SLACK_BATCH] Enviando {len(newly_created_events_for_this_watcher)} evento(s) a Slack para watcher '{watcher_instance.name}'...")
                    notifier.notify_slack_blockkit(watcher=watcher_instance, events_list=newly_created_events_for_this_watcher)
                else:
                    print("    ℹ️ [SLACK_BATCH] Slack webhook URL no configurada. Saltando.")

                if settings.DISCORD_WEBHOOK_URL and settings.DISCORD_WEBHOOK_URL != "YOUR_DISCORD_WEBHOOK_URL_HERE":
                    print(f"    ℹ️ [DISCORD_BATCH] Enviando {len(newly_created_events_for_this_watcher)} evento(s) a Discord para watcher '{watcher_instance.name}'...")
                    notifier.notify_discord_embed(watcher=watcher_instance, events_list=newly_created_events_for_this_watcher) 
                else:
                    print("    ℹ️ [DISCORD_BATCH] Discord webhook URL no configurada. Saltando.")
                print(f"    ✅ [GROUPED_NOTIFICATION_SUCCESS] Notificaciones agrupadas enviadas/intentadas para Watcher ID={watcher_instance.id}.")
            except Exception as e_notify_group:
                print(f"    ❌ [GROUPED_NOTIFICATION_ERROR] Falló el envío de notificaciones agrupadas para Watcher ID={watcher_instance.id}: {e_notify_group!r}")
        else:
            print(f"  ℹ️ [NO_NEW_EVENTS_TO_NOTIFY] No hay eventos nuevos que cumplan el umbral para notificar para Watcher ID={watcher_instance.id} en este ciclo.")

        if len(active_watchers) > 1: # Solo aplicar delay si hay más watchers en la cola
            time.sleep(settings.POLL_INTERVAL / len(active_watchers) if len(active_watchers) > 0 else settings.POLL_INTERVAL ) # Un delay dinámico o fijo
            # O un simple time.sleep(1) o time.sleep(0.5)

    print("🔄 [POLL_CYCLE] Ciclo de sondeo y notificación finalizado.")

if __name__ == "__main__":
    from api.app.database import SessionLocal 
    # crud y schemas se importan al principio del archivo

    db_session = SessionLocal()
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    print("▶ [WATCHER_SCRIPT_RUN] Iniciando TokenWatcher Poller (ejecución directa de script)...")
    try:
        get_watchers_for_run = lambda: crud.get_watchers(db_session)
        create_event_for_run = lambda data_payload: crud.create_event(db_session, data_payload)
        poll_and_notify(
            db=db_session,
            get_watchers_func=get_watchers_for_run,
            create_event_func=create_event_for_run
        )
    except Exception as e_main:
        print(f"❌ [WATCHER_SCRIPT_FATAL] Excepción no manejada en la ejecución del script watcher: {e_main!r}")
    finally:
        db_session.close()
        print("▶ [WATCHER_SCRIPT_RUN] Sesión de base de datos cerrada. Poller finalizado.")
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")