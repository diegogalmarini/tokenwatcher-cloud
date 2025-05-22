# api/app/watcher.py
import time
import requests
import json 
from typing import Callable, List, Dict, Any, Optional # Optional añadido
from sqlalchemy.orm import Session, selectinload # selectinload es importante aquí
from sqlalchemy import desc

# Tus importaciones de la app
from . import schemas, crud, notifier # Asegúrate que notifier está importado
from .config import settings
from .models import Watcher as WatcherModel, Event as EventModel, Transport as TransportModel # TransportModel añadido

ETHERSCAN_API_URL = "https://api.etherscan.io/api"

def fetch_transfers(contract_address: str, start_block: int) -> List[Dict[str, Any]]:
    try:
        # Asegurar que start_block sea un entero
        start_block = int(start_block) if start_block is not None else 0
    except ValueError:
        print(f"❌ [ERROR] start_block inválido: {start_block} para contrato {contract_address}. Usando 0 por defecto.")
        start_block = 0
    
    params = {
        "module": "account", "action": "tokentx", "contractaddress": contract_address,
        "startblock": str(start_block), "endblock": "latest", "page": 1, "offset": 1000, # Considera un offset más pequeño si 1000 es mucho
        "sort": "asc", "apikey": settings.ETHERSCAN_API_KEY,
    }
    print(f"  📞 [FETCH_TRANSFERS] Consultando Etherscan para {contract_address} desde bloque {start_block}...")
    response_text = "" 
    try:
        response = requests.get(ETHERSCAN_API_URL, params=params, timeout=20)
        response_text = response.text 
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
    except json.JSONDecodeError: # json ya fue importado
        print(f"  ❌ [FETCH_TRANSFERS_ERROR] Error al decodificar JSON de Etherscan para {contract_address}. Respuesta: {response_text[:500]}")
        return []

def poll_and_notify(
    db: Session,
    get_active_watchers_func: Callable[[], List[WatcherModel]], # CAMBIO: Nombre de la función
    create_event_func: Callable[[schemas.TokenEventCreate], EventModel],
):
    print("🔄 [POLL_CYCLE] Iniciando ciclo de sondeo y notificación...")
    try:
        # CAMBIO: Usar la función para obtener solo watchers activos
        active_watchers = get_active_watchers_func()
    except Exception as e:
        print(f"❌ [POLL_ERROR] Error al obtener watchers activos de la BD: {e!r}")
        return

    if not active_watchers:
        print("ℹ️ [POLL_INFO] No hay watchers activos para procesar. Finalizando ciclo.")
        return
    print(f"ℹ️ [POLL_INFO] Procesando {len(active_watchers)} watcher(s) activo(s)...")

    for watcher_instance in active_watchers:
        # El modelo Watcher ya no tiene webhook_url, se accede via watcher_instance.transports
        print(f"  ▶️ [WATCHER_PROC] Procesando Watcher ID={watcher_instance.id}, Nombre='{watcher_instance.name}', Token='{watcher_instance.token_address}', Umbral={watcher_instance.threshold}, Activo={watcher_instance.is_active}")
        
        # Lógica para determinar start_block_for_watcher (mejorada y más robusta)
        start_block_for_watcher: int = settings.START_BLOCK # Default global si no hay eventos previos
        try:
            latest_event_block_tuple = (db.query(EventModel.block_number)
                                   .filter(EventModel.watcher_id == watcher_instance.id)
                                   .order_by(desc(EventModel.block_number))
                                   .first())
            if latest_event_block_tuple:
                # Asegurarse que el resultado no es None y es convertible a int
                latest_block_num_str = str(latest_event_block_tuple[0])
                if latest_block_num_str.isdigit():
                    start_block_for_watcher = int(latest_block_num_str) + 1
                else: # Si no es un dígito (inesperado), usar el START_BLOCK por defecto
                    print(f"    ⚠️ [START_BLOCK_WARN] Block number del último evento no es un dígito para Watcher ID={watcher_instance.id}: '{latest_block_num_str}'. Usando START_BLOCK global.")
            # Si no hay eventos previos (latest_event_block_tuple es None), se usa el START_BLOCK global.
        except Exception as e_get_block:
            print(f"    ❌ [START_BLOCK_ERROR] Error al obtener el último block_number para Watcher ID={watcher_instance.id}: {e_get_block!r}. Usando START_BLOCK global.")
        
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
                    token_decimal_str = tx_data.get("tokenDecimal", "18")
                    if not token_decimal_str.isdigit():
                         print(f"      ⚠️ [TX_WARN] tokenDecimal no numérico: '{token_decimal_str}' en tx: {tx_data.get('hash')}. Usando 18 por defecto.")
                         token_decimal = 18
                    else:
                        token_decimal = int(token_decimal_str)

                    value_str = tx_data.get("value", "0")
                    if not value_str.isdigit():
                        print(f"      ⚠️ [TX_WARN] Valor no numérico para 'value' en tx: {tx_data.get('hash')}. Saltando tx.")
                        continue
                    
                    amount_transferred = float(value_str) / (10**token_decimal)
                    current_block_number_str = tx_data.get("blockNumber", "0")
                    if not current_block_number_str.isdigit():
                        print(f"      ⚠️ [TX_WARN] blockNumber no numérico: '{current_block_number_str}' en tx: {tx_data.get('hash')}. Saltando tx.")
                        continue
                    current_block_number = int(current_block_number_str)

                    print(f"      🔎 [TX_DETAIL] Hash={tx_data.get('hash', 'N/A')[:10]}.., Block={current_block_number}, Amount={amount_transferred:.4f}")

                    if amount_transferred >= watcher_instance.threshold:
                        print(f"      ❗ [THRESHOLD_MET] Monto {amount_transferred:.4f} >= umbral {watcher_instance.threshold}. Creando evento...")
                        event_payload_schema = schemas.TokenEventCreate(
                            watcher_id=watcher_instance.id,
                            contract=tx_data.get("contractAddress", watcher_instance.token_address), # contractAddress de la tx
                            volume=amount_transferred,
                            tx_hash=tx_data.get("hash", "N/A"),
                            block_number=current_block_number,
                        )
                        # Verificar duplicados usando transaction_hash y watcher_id (o un subconjunto único)
                        existing_event_check = db.query(EventModel.id)\
                            .filter(EventModel.transaction_hash == event_payload_schema.tx_hash,
                                    EventModel.watcher_id == watcher_instance.id)\
                            .first() # Solo necesitamos saber si existe, no el objeto completo.
                        
                        if existing_event_check:
                            print(f"      ⚠️ [DUPLICATE_EVENT] Evento con tx_hash {event_payload_schema.tx_hash} para Watcher ID={watcher_instance.id} ya existe. Saltando.")
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
        
        # --- NUEVA LÓGICA DE NOTIFICACIÓN ---
        if newly_created_events_for_this_watcher:
            print(f"  🔔 [NOTIFICATION_PROCESSING] {len(newly_created_events_for_this_watcher)} evento(s) nuevo(s) para Watcher ID={watcher_instance.id}. Buscando transports...")
            
            # watcher_instance.transports ya está cargado gracias a selectinload en crud.get_active_watchers
            if not watcher_instance.transports:
                print(f"    ℹ️ [NO_TRANSPORTS] No hay transports configurados para Watcher ID={watcher_instance.id}. No se enviarán notificaciones.")
            else:
                for transport_instance in watcher_instance.transports:
                    webhook_url: Optional[str] = None
                    if isinstance(transport_instance.config, dict): # Verificar que config sea un dict
                        webhook_url = transport_instance.config.get("url")
                    
                    if not webhook_url:
                        print(f"    ⚠️ [TRANSPORT_INVALID_CONFIG] Transport ID={transport_instance.id} (tipo: {transport_instance.type}) para Watcher ID={watcher_instance.id} no tiene una URL válida en 'config'. Saltando.")
                        continue

                    try:
                        print(f"    ▶️ [SENDING_VIA_TRANSPORT] Intentando enviar via Transport ID={transport_instance.id}, Tipo='{transport_instance.type}', WatcherID={watcher_instance.id}")
                        if transport_instance.type == "slack":
                            notifier.notify_slack_blockkit(
                                webhook_url=webhook_url, 
                                watcher_obj=watcher_instance, 
                                events_list=newly_created_events_for_this_watcher
                            )
                        elif transport_instance.type == "discord":
                            notifier.notify_discord_embed(
                                webhook_url=webhook_url, 
                                watcher_obj=watcher_instance, 
                                events_list=newly_created_events_for_this_watcher
                            )
                        # Aquí puedes añadir más elif para otros tipos de transport
                        else:
                            print(f"    ⚠️ [UNKNOWN_TRANSPORT_TYPE] Tipo de transport '{transport_instance.type}' no reconocido para Transport ID={transport_instance.id}. Saltando.")
                    except Exception as e_notify_dispatch:
                        print(f"    ❌ [NOTIFICATION_DISPATCH_ERROR] Falló el envío para Transport ID={transport_instance.id} (Watcher ID={watcher_instance.id}): {e_notify_dispatch!r}")
        else:
            print(f"  ℹ️ [NO_NEW_EVENTS_TO_NOTIFY] No hay eventos nuevos que cumplan el umbral para notificar para Watcher ID={watcher_instance.id} en este ciclo.")

        # Considerar un delay entre el procesamiento de watchers si Etherscan tiene límites de tasa estrictos
        # o si el número de watchers es muy alto.
        # time.sleep(1) # Pequeño delay para no sobrecargar APIs externas si hay muchos watchers.

    print("🔄 [POLL_CYCLE] Ciclo de sondeo y notificación finalizado.")

if __name__ == "__main__":
    from api.app.database import SessionLocal 
    # crud, schemas, notifier ya están importados al principio del archivo
    # models también está importado (WatcherModel, EventModel, TransportModel)

    db_session = SessionLocal()
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    print("▶ [WATCHER_SCRIPT_RUN] Iniciando TokenWatcher Poller (ejecución directa de script)...")
    try:
        # CAMBIO: Usar la función que obtiene solo watchers activos
        get_watchers_for_run = lambda: crud.get_active_watchers(db_session)
        create_event_for_run = lambda data_payload: crud.create_event(db_session, data_payload)
        
        poll_and_notify(
            db=db_session,
            get_active_watchers_func=get_watchers_for_run, # Pasando la función correcta
            create_event_func=create_event_for_run
        )
    except Exception as e_main:
        print(f"❌ [WATCHER_SCRIPT_FATAL] Excepción no manejada en la ejecución del script watcher: {e_main!r}")
    finally:
        db_session.close()
        print("▶ [WATCHER_SCRIPT_RUN] Sesión de base de datos cerrada. Poller finalizado.")
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")