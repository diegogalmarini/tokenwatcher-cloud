# api/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc # Para ordenar eventos
from fastapi import HTTPException
from . import models, schemas # Tus modelos y esquemas actualizados

# --- Watcher CRUD ---
def get_watcher(db: Session, watcher_id: int) -> models.Watcher | None:
    return db.query(models.Watcher).filter(models.Watcher.id == watcher_id).first()

def get_watchers(db: Session, skip: int = 0, limit: int = 100) -> list[models.Watcher]:
    return db.query(models.Watcher).order_by(models.Watcher.id).offset(skip).limit(limit).all()

def create_watcher(db: Session, watcher: schemas.WatcherCreate) -> models.Watcher:
    # Asumimos que schemas.WatcherCreate ahora incluye 'name'
    db_watcher = models.Watcher(
        name=watcher.name,
        token_address=watcher.token_address,
        threshold=watcher.threshold,
        webhook_url=str(watcher.webhook_url) # Pydantic HttpUrl a string para el modelo
    )
    db.add(db_watcher)
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def update_watcher(db: Session, watcher_id: int, watcher_update: schemas.WatcherUpdate) -> models.Watcher | None:
    db_watcher = get_watcher(db, watcher_id)
    if not db_watcher:
        # get_watcher ya no lanza HTTPException, así que lo manejamos aquí o hacemos que get_watcher lo lance
        raise HTTPException(status_code=404, detail="Watcher not found to update")

    # Usa exclude_unset=True para actualizar solo los campos proporcionados
    update_data = watcher_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_watcher, field, value)
    
    db.add(db_watcher) # Aunque SQLAlchemy rastrea cambios, es buena práctica explicitarlo.
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def delete_watcher(db: Session, watcher_id: int) -> models.Watcher | None: # Cambiado para devolver el objeto borrado o None
    db_watcher = get_watcher(db, watcher_id)
    if not db_watcher:
        raise HTTPException(status_code=404, detail="Watcher not found to delete")
    
    db.delete(db_watcher)
    db.commit()
    # El objeto db_watcher ya no está en la sesión y no se puede refrescar.
    # Se devuelve el objeto tal como estaba antes de borrarlo, o None si prefieres.
    # Para consistencia con otros endpoints que devuelven el objeto, lo devolvemos.
    # O puedes simplemente devolver {"ok": True} desde el endpoint en main.py.
    # Por ahora, lo devuelvo. Ajusta según tu API.
    return db_watcher


# --- Event (TokenEvent) CRUD ---
def create_event(db: Session, event_data: schemas.TokenEventDataForCreation) -> models.Event:
    """
    Crea un nuevo evento en la base de datos.
    Mapea desde schemas.TokenEventDataForCreation a los campos de models.Event.
    """
    db_event = models.Event(
        watcher_id=event_data.watcher_id,
        token_address_observed=event_data.contract, # Mapeo de 'contract' del payload a 'token_address_observed' del modelo
        amount=event_data.volume,                 # Mapeo de 'volume' del payload a 'amount' del modelo
        transaction_hash=event_data.tx_hash,
        block_number=event_data.block_number
        # Si tuvieras 'event_type' en TokenEventDataForCreation, lo mapearías aquí.
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_events(db: Session, skip: int = 0, limit: int = 100) -> list[models.Event]:
    """
    Obtiene una lista de todos los eventos, los más recientes primero.
    """
    return (
        db.query(models.Event)
        .order_by(desc(models.Event.created_at)) # o models.Event.id si prefieres
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_events_for_watcher(db: Session, watcher_id: int, skip: int = 0, limit: int = 100) -> list[models.Event]:
    """
    Obtiene una lista de eventos para un watcher específico, los más recientes primero.
    """
    # Primero verifica que el watcher exista, aunque el endpoint en main.py ya lo hace.
    # watcher = get_watcher(db, watcher_id)
    # if not watcher:
    #     raise HTTPException(status_code=404, detail=f"Watcher with id {watcher_id} not found, cannot get events.")

    return (
        db.query(models.Event)
        .filter(models.Event.watcher_id == watcher_id)
        .order_by(desc(models.Event.created_at)) # o models.Event.id
        .offset(skip)
        .limit(limit)
        .all()
    )

# --- Transport CRUD (basado en tu main.py) ---
# Nota: Necesitarás modelos y esquemas para Transport si no los has creado completamente.
# Asumiré que existen models.Transport y schemas.TransportCreate/TransportRead como los definí en la respuesta anterior.

def get_transport(db: Session, transport_id: int) -> models.Transport | None:
    return db.query(models.Transport).filter(models.Transport.id == transport_id).first()

def get_transports(db: Session, watcher_id: int | None = None, skip: int = 0, limit: int = 100) -> list[models.Transport]:
    query = db.query(models.Transport)
    if watcher_id is not None:
        query = query.filter(models.Transport.watcher_id == watcher_id)
    return query.order_by(models.Transport.id).offset(skip).limit(limit).all()

def create_transport(db: Session, transport: schemas.TransportCreate) -> models.Transport:
    # Verifica que el watcher exista
    db_watcher = get_watcher(db, transport.watcher_id)
    if not db_watcher:
        raise HTTPException(status_code=404, detail=f"Watcher with id {transport.watcher_id} not found, cannot create transport.")
    
    db_transport = models.Transport(**transport.dict())
    db.add(db_transport)
    db.commit()
    db.refresh(db_transport)
    return db_transport

def delete_transport(db: Session, transport_id: int) -> models.Transport | None:
    db_transport = get_transport(db, transport_id)
    if not db_transport:
        raise HTTPException(status_code=404, detail="Transport not found to delete")
    
    db.delete(db_transport)
    db.commit()
    return db_transport


# --- Token Volume (basado en tu main.py) ---
# Esta función parece requerir una lógica de agregación sobre los eventos.
def get_volume(db: Session, contract_address: str) -> float:
    """
    Calcula el volumen total de tokens para una dirección de contrato específica.
    Esto podría implicar sumar los 'amount' de los eventos relevantes.
    La implementación exacta dependerá de cómo quieras definir "volumen total".
    Aquí un ejemplo simple sumando todos los 'amount' de la tabla 'events'
    que coincidan con 'token_address_observed'.
    """
    # Necesitarías importar 'func' de sqlalchemy: from sqlalchemy import func
    # total_volume = (
    #     db.query(func.sum(models.Event.amount))
    #     .filter(models.Event.token_address_observed == contract_address)
    #     .scalar()
    # )
    # return total_volume if total_volume is not None else 0.0
    print(f"INFO: La función get_volume para {contract_address} necesita ser implementada según la lógica de negocio.")
    return 0.0 # Placeholder, implementa la lógica real.