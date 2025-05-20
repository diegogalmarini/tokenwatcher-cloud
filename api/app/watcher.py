# api/app/watcher.py
import time
import requests
from typing import Callable, List, Dict, Any # Any para w
from sqlalchemy.orm import Session # Para type hint de db
from sqlalchemy import desc # Para ordenar

# Tus importaciones de módulos locales deben estar alineadas con las versiones corregidas
from . import schemas, crud, notifier # crud y notifier deben estar definidos
from .config import settings # settings para API keys, URLs, etc.
from .models import Watcher as WatcherModel, Event as EventModel # Para type hints

ETHERSCAN_API_URL = "https://api.etherscan.io/api" # o settings.ETHERSCAN_API_URL si lo tienes en config

def fetch_transfers(contract_address: str, start_block: int) -> List[Dict[str, Any]]:
    """
    Llama a Etherscan API y devuelve la lista de transferencias ERC-20 para un contrato
    desde start_block hasta un rango máximo o 'latest'.
    """
    # Asegurar que start_block sea un entero válido
    try:
        start_block = int(start_block)
    except ValueError:
        print(f"❌ [ERROR] start_block inválido: {start_block} para contrato {contract_address}. Usando 0 por defecto.")
        start_block = 0
    
    # Determinar end_block: puede ser 'latest' o un cálculo de rango
    # Si MAX_BLOCK_RANGE es muy grande, Etherscan podría dar timeout o errores.
    # Usar 'latest' es más simple si el manejo de paginación/rangos no es crítico aquí.
    # O puedes calcular end_block = start_block + settings.MAX_BLOCK_RANGE
    # Por ahora, usar 'latest' y offset para manejar muchos resultados si fuera necesario.
    # El offset de Etherscan es de hasta 10000 por página.
    params = {
        "module": "account",
        "action": "tokentx",
        "contractaddress": contract_address,
        "startblock": str(start_block),
        "endblock": "latest", # O: str(start_block + settings.MAX_BLOCK_RANGE -1) si MAX_BLOCK_RANGE > 0
        "page": 1,            # Podrías necesitar paginar si esperas más de 'offset' resultados
        "offset": 1000,       # Etherscan puede devolver hasta 10000, pero 1000 es un buen default.
        "sort": "asc",        # Procesar transacciones en orden cronológico
        "apikey": settings.ETHERSCAN_API_KEY,
    }
    
    print(f"  📞 [FETCH_TRANSFERS] Consultando Etherscan para {contract_address} desde bloque {start_block}...")
    try:
        response = requests.get(ETHERSCAN_API_URL, params=params, timeout=20) # Timeout un poco más generoso
        response.raise_for_status()  # Lanza HTTPError para respuestas 4xx/5xx
        data = response.json()

        if data.get("status") == "1":
            result = data.get("result", [])
            print(f"  ✅ [FETCH_TRANSFERS] Etherscan devolvió {len(result)} transacciones.")
            return result
        elif data.get("message") == "No transactions found":
            print(f"  ℹ️ [FETCH_TRANSFERS] No se encontraron transacciones nuevas para {contract_address} desde bloque {start_block}.")
            return []
        else:
            # Otro tipo de error o mensaje de Etherscan
            print(f"  ⚠️ [FETCH_TRANSFERS_WARN] Etherscan API devolvió status '{data.get('status')}' con mensaje: '{data.get('message')}' para {contract_address}.")
            return []

    except requests.exceptions.Timeout:
        print(f"  ❌ [FETCH_TRANSFERS_ERROR] Timeout al contactar Etherscan API para {contract_address}.")
        return []
    except requests.exceptions.RequestException as e:
        print(f"  ❌ [FETCH_TRANSFERS_ERROR] Fallo en la solicitud a Etherscan API para {contract_address}: {e}")
        return []
    except json.JSONDecodeError:
        print(f"  ❌ [FETCH_TRANSFERS_ERROR] Error al decodificar JSON de Etherscan para {contract_address}. Respuesta: {response.text[:200]}") # Loguear parte de la respuesta
        return []

# Esta función es la que se llama desde el cron job y/o el @repeat_every de main.py
def poll_and_notify(
    db: Session,
    get_watchers_func: Callable[[], List[WatcherModel]],
    create_event_func: Callable[[schemas.TokenEventCreate], EventModel], # Espera un objeto schema, devuelve un objeto modelo
):
    """
    Recorre cada Watcher, busca nuevas transacciones, filtra por threshold,
    registra TokenEvent y dispara notificación vía notifier.notify().
    """
    print("🔄 [POLL_CYCLE] Iniciando ciclo de sondeo y notificación...")
    
    try:
        active_watchers = get_watchers_func()
    except Exception as e:
        print(f"❌ [POLL_ERROR] Error al obtener watchers de la BD: {e!r}")
        return # Salir si no podemos obtener watchers

    if not active_watchers:
        print("ℹ️ [POLL_INFO] No hay watchers activos configurados. Finalizando ciclo.")
        return

    print(f"ℹ️ [POLL_INFO] Procesando {len(active_watchers)} watcher(s)...")

    for watcher_instance in active_watchers: # Renombrar w a watcher_instance para claridad
        print(f"  ▶️ [WATCHER_PROC] Procesando Watcher ID={watcher_instance.id}, Nombre='{watcher_instance.name}', Token='{watcher_instance.token_address}', Umbral={watcher_instance.threshold}")
        
        # Determinar el bloque inicial para este watcher
        # Usar la sesión de BD (db) que se pasó a poll_and_notify
        last_event = db.query(EventModel.block_number)\
                       .filter(EventModel.watcher_id == watcher_instance.id)\
                       .order_by(desc(EventModel.block_number))\
                       .first()
        
        start_block_for_watcher = (int(last_event[0]) + 1) if last_event else settings.START_BLOCK
        print(f"    🔍 [START_BLOCK] Para Watcher ID={watcher_instance.id}, comenzando desde el bloque: {start_block_for_watcher}")

        try:
            transactions = fetch_transfers(watcher_instance.token_address, start_block=start_block_for_watcher)
        except Exception as e:
            print(f"    ❌ [TX_FETCH_ERROR] Error irrecuperable en fetch_transfers para {watcher_instance.token_address}: {e!r}. Saltando este watcher.")
            continue # Saltar al siguiente watcher

        if not transactions:
            print(f"    ℹ️ [TX_INFO] No hay transacciones nuevas para Watcher ID={watcher_instance.id} desde el bloque {start_block_for_watcher}.")
            continue
            
        print(f"    📊 [TX_FOUND] {len(transactions)} transacciones encontradas para Watcher ID={watcher_instance.id}.")

        for tx_data in transactions:
            try:
                token_decimal = int(tx_data.get("tokenDecimal", "18")) # Etherscan lo da como string
                value_str = tx_data.get("value", "0")
                if not value_str.isdigit(): # Validación simple
                    print(f"      ⚠️ [TX_WARN] Valor no numérico para 'value' en tx: {tx_data.get('hash')}. Saltando tx.")
                    continue
                
                amount_transferred = float(value_str) / (10**token_decimal)
                
                print(f"      🔎 [TX_DETAIL] Hash={tx_data.get('hash', 'N/A')[:10]}.., Block={tx_data.get('blockNumber')}, Amount={amount_transferred:.4f}")

                if amount_transferred >= watcher_instance.threshold:
                    print(f"      ❗ [THRESHOLD_MET] Monto {amount_transferred:.4f} >= umbral {watcher_instance.threshold}. Creando evento...")
                    
                    # Crear el payload para schemas.TokenEventCreate
                    # 'contract' en el payload es la dirección del contrato del token del evento
                    event_payload_schema = schemas.TokenEventCreate(
                        watcher_id=watcher_instance.id,
                        contract=tx_data.get("contractAddress", watcher_instance.token_address), # Usar contractAddress de la tx, fallback al del watcher
                        volume=amount_transferred,
                        tx_hash=tx_data.get("hash", "N/A"), # Asegurarse que hash siempre exista
                        block_number=int(tx_data.get("blockNumber", "0")), # Asegurar que blockNumber exista y sea int
                    )
                    
                    # Prevenir duplicados por tx_hash
                    existing_event_check = db.query(EventModel).filter(EventModel.transaction_hash == event_payload_schema.tx_hash).first()
                    if existing_event_check:
                        print(f"      ⚠️ [DUPLICATE_EVENT] Evento con tx_hash {event_payload_schema.tx_hash} ya existe. Saltando.")
                        continue

                    created_event_model = create_event_func(event_payload_schema) # Llama a la función crud.create_event
                    print(f"      ✅ [EVENT_CREATED] Evento ID={created_event_model.id} persistido para Watcher ID={watcher_instance.id}.")

                    print(f"      🔔 [NOTIFICATION_SENDING] Notificando para evento ID={created_event_model.id}...")
                    try:
                        notifier.notify(watcher=watcher_instance, event_obj=created_event_model)
                    except Exception as e_notify:
                        print(f"      ❌ [NOTIFICATION_ERROR] Falló notifier.notify() para evento ID={created_event_model.id}: {e_notify!r}")
                    else:
                        print(f"      ✅ [NOTIFICATION_SUCCESS] Notificaciones enviadas para evento ID={created_event_model.id}.")
            except KeyError as ke:
                print(f"      ❌ [TX_PROCESS_ERROR] Falta una clave esperada en los datos de la transacción: {ke}. Datos: {tx_data}")
            except ValueError as ve:
                print(f"      ❌ [TX_PROCESS_ERROR] Error de valor al procesar la transacción (ej. conversión a float/int): {ve}. Datos: {tx_data}")
            except Exception as e_tx_proc:
                print(f"      ❌ [TX_PROCESS_ERROR] Error general al procesar transacción {tx_data.get('hash', 'N/A')}: {e_tx_proc!r}")
        
        # Pequeña pausa entre watchers para no saturar APIs externas si tienes muchos.
        # Ajusta o elimina según necesidad.
        if len(active_watchers) > 1:
            time.sleep(1) 

    print("🔄 [POLL_CYCLE] Ciclo de sondeo y notificación finalizado.")


# Este bloque se ejecuta si llamas al script directamente: `python -m api.app.watcher`
if __name__ == "__main__":
    # CAMBIO: Importar SessionLocal desde el módulo database.py
    from api.app.database import SessionLocal
    # crud y schemas ya se importan relativamente al principio del archivo watcher.py

    # Crear una sesión de base de datos para esta ejecución del script
    db_session = SessionLocal()
    
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    print("▶ [WATCHER_SCRIPT_RUN] Iniciando TokenWatcher Poller (ejecución directa de script)...")
    
    try:
        # Definir las funciones lambda que se pasarán a poll_and_notify
        # Estas lambdas usan la sesión 'db_session' creada para esta ejecución
        get_watchers_for_run = lambda: crud.get_watchers(db_session)
        # La 'data' que recibe create_event_for_run es un objeto schemas.TokenEventCreate
        create_event_for_run = lambda data_payload: crud.create_event(db_session, data_payload)

        poll_and_notify(
            db=db_session, # Pasar la sesión de BD
            get_watchers_func=get_watchers_for_run,
            create_event_func=create_event_for_run
        )
    except Exception as e_main:
        print(f"❌ [WATCHER_SCRIPT_FATAL] Excepción no manejada en la ejecución del script watcher: {e_main!r}")
    finally:
        db_session.close()
        print("▶ [WATCHER_SCRIPT_RUN] Sesión de base de datos cerrada. Poller finalizado.")
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")