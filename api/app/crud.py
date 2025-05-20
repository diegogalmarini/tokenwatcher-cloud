# api/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc, func as sql_func # Para ordenar eventos y usar funciones SQL como sum
from fastapi import HTTPException
from pydantic import HttpUrl # Para la conversión en update_watcher

from . import models, schemas # Tus modelos y esquemas actualizados

# --- Watcher CRUD ---
def get_watcher(db: Session, watcher_id: int) -> models.Watcher | None:
    """Devuelve un watcher por su ID, o None si no existe."""
    return db.query(models.Watcher).filter(models.Watcher.id == watcher_id).first()

def get_watchers(db: Session, skip: int = 0, limit: int = 100) -> list[models.Watcher]:
    """Recupera la lista de watchers, paginada y ordenada por ID."""
    return (
        db.query(models.Watcher)
        .order_by(models.Watcher.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_watcher(db: Session, watcher: schemas.WatcherCreate) -> models.Watcher:
    """Crea un nuevo watcher en la base de datos."""
    db_watcher = models.Watcher(
        name=watcher.name,
        token_address=watcher.token_address,
        threshold=watcher.threshold,
        webhook_url=str(watcher.webhook_url) # Convertir HttpUrl de Pydantic a string para el modelo
    )
    db.add(db_watcher)
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def update_watcher(db: Session, watcher_id: int, watcher_update: schemas.WatcherUpdate) -> models.Watcher | None:
    """Actualiza los campos de un watcher existente."""
    db_watcher = get_watcher(db, watcher_id)
    if not db_watcher:
        # En lugar de devolver None, lanzamos la excepción aquí para que main.py no tenga que hacerlo.
        raise HTTPException(status_code=404, detail="Watcher not found for update")

    update_data = watcher_update.dict(exclude_unset=True) # Solo actualiza campos enviados
    for field, value in update_data.items():
        if field == "webhook_url" and isinstance(value, HttpUrl): # Si el valor es HttpUrl, convertir a string
             setattr(db_watcher, field, str(value))
        elif value is not None: # Para otros campos, aplicar si no son None (si el schema los permite como None)
            setattr(db_watcher, field, value)
        # Si el campo en el schema es Optional y se envía explícitamente None, se establecerá a None.
        elif field in update_data: # Asegura que el 'None' explícito también se aplique si el campo fue enviado
            setattr(db_watcher, field, value)


    # db.add(db_watcher) # No es estrictamente necesario si SQLAlchemy rastrea el objeto
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def delete_watcher(db: Session, watcher_id: int) -> models.Watcher | None: # Devolvemos el objeto para consistencia
    """Elimina un watcher y retorna el registro borrado."""
    db_watcher = get_watcher(db, watcher_id)
    if not db_watcher:
        raise HTTPException(status_code=404, detail="Watcher not found for deletion") # Ser explícito

    db.delete(db_watcher)
    db.commit()
    return db_watcher # El objeto aún contiene los datos antes de ser purgado de la sesión

# --- Event (TokenEvent) CRUD ---
def create_event(db: Session, event_data: schemas.TokenEventCreate) -> models.Event:
    """Crea un nuevo evento en la base de datos a partir de schemas.TokenEventCreate."""
    # Mapeo de campos desde schemas.TokenEventCreate (payload de watcher.py) a models.Event
    db_event = models.Event(
        watcher_id=event_data.watcher_id,
        token_address_observed=event_data.contract, # 'contract' del payload -> 'token_address_observed' del modelo
        amount=event_data.volume,                 # 'volume' del payload -> 'amount' del modelo
        transaction_hash=event_data.tx_hash,
        block_number=event_data.block_number
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_event(db: Session, event_id: int) -> models.Event | None:
    """Recupera un evento por su ID."""
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_events(db: Session, skip: int = 0, limit: int = 100) -> list[models.Event]:
    """Devuelve todos los eventos, paginados y ordenados por fecha de creación descendente."""
    return (
        db.query(models.Event)
        .order_by(desc(models.Event.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_events_for_watcher(db: Session, watcher_id: int, skip: int = 0, limit: int = 100) -> list[models.Event]:
    """Recupera los eventos asociados a un watcher, paginados y ordenados por fecha de creación descendente."""
    return (
        db.query(models.Event)
        .filter(models.Event.watcher_id == watcher_id)
        .order_by(desc(models.Event.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

# --- Transport CRUD ---
def get_transport(db: Session, transport_id: int) -> models.Transport | None:
    """Recupera un transporte por su ID."""
    return db.query(models.Transport).filter(models.Transport.id == transport_id).first()

def get_transports(db: Session, watcher_id: int | None = None, skip: int = 0, limit: int = 100) -> list[models.Transport]:
    """Recupera configs de transporte, opcionalmente filtradas por watcher_id."""
    query = db.query(models.Transport)
    if watcher_id is not None:
        query = query.filter(models.Transport.watcher_id == watcher_id)
    return query.order_by(models.Transport.id).offset(skip).limit(limit).all()

def create_transport(db: Session, transport: schemas.TransportCreate) -> models.Transport:
    """Crea una nueva configuración de transporte."""
    # Verificar que el watcher asociado exista
    db_watcher = get_watcher(db, transport.watcher_id)
    if not db_watcher:
        raise HTTPException(status_code=404, detail=f"Watcher with id {transport.watcher_id} not found, cannot create transport.")

    db_transport = models.Transport(
        watcher_id=transport.watcher_id,
        type=transport.type,
        config=transport.config # Asume que config es un dict compatible con JSON
    )
    db.add(db_transport)
    db.commit()
    db.refresh(db_transport)
    return db_transport

def delete_transport(db: Session, transport_id: int) -> models.Transport | None:
    """Elimina una configuración de transporte."""
    db_transport = get_transport(db, transport_id)
    if not db_transport:
        raise HTTPException(status_code=404, detail="Transport not found for deletion")

    db.delete(db_transport)
    db.commit()
    return db_transport

# --- Token Volume ---
# La función get_volume calcula el total de eventos.
# Las funciones get_token_volumes y create_token_volume son para una tabla separada `token_volumes`.
def get_volume(db: Session, contract_address: str) -> float:
    """
    Calcula el volumen total de tokens (amount) para una dirección de contrato específica
    observada en la tabla 'events'.
    """
    total_volume = (
        db.query(sql_func.sum(models.Event.amount))
        .filter(models.Event.token_address_observed == contract_address)
        .scalar()
    )
    return total_volume if total_volume is not None else 0.0

# CRUD para la tabla TokenVolume (si decides usarla para persistir volúmenes agregados)
def get_token_volume_entry(db: Session, contract_address: str) -> models.TokenVolume | None:
    """Obtiene una entrada específica de la tabla token_volumes."""
    return db.query(models.TokenVolume).filter(models.TokenVolume.contract == contract_address).first()

def get_all_token_volumes(db: Session, skip: int = 0, limit: int = 100) -> list[models.TokenVolume]:
    """Devuelve volúmenes de tokens almacenados en la tabla token_volumes."""
    return (
        db.query(models.TokenVolume)
        .order_by(models.TokenVolume.contract)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_or_update_token_volume(db: Session, volume_data: schemas.TokenRead) -> models.TokenVolume:
    """
    Crea o actualiza una entrada en la tabla token_volumes.
    schemas.TokenRead se usa como entrada (contract, volume).
    """
    db_vol = get_token_volume_entry(db, volume_data.contract)
    if db_vol:
        db_vol.volume = volume_data.volume
        # last_updated se actualiza automáticamente por onupdate=func.now() en el modelo
    else:
        db_vol = models.TokenVolume(
            contract=volume_data.contract,
            volume=volume_data.volume
        )
        db.add(db_vol)
    db.commit()
    db.refresh(db_vol)
    return db_vol