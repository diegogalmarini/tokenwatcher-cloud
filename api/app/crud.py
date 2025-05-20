# api/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc, func as sql_func
from fastapi import HTTPException
from pydantic import HttpUrl # Importar HttpUrl para isinstance

from . import models, schemas

# --- Watcher CRUD ---
def get_watcher(db: Session, watcher_id: int) -> models.Watcher | None:
    return db.query(models.Watcher).filter(models.Watcher.id == watcher_id).first()

def get_watchers(db: Session, skip: int = 0, limit: int = 100) -> list[models.Watcher]:
    return (
        db.query(models.Watcher)
        .order_by(models.Watcher.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_watcher(db: Session, watcher: schemas.WatcherCreate) -> models.Watcher:
    db_watcher = models.Watcher(
        name=watcher.name,
        token_address=watcher.token_address,
        threshold=watcher.threshold,
        webhook_url=str(watcher.webhook_url) # Convertir HttpUrl a str
    )
    db.add(db_watcher)
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def update_watcher(db: Session, watcher_id: int, watcher_update: schemas.WatcherUpdate) -> models.Watcher: # Cambiado para que coincida con tu versión
    db_watcher = get_watcher(db, watcher_id)
    if not db_watcher:
        raise HTTPException(status_code=404, detail="Watcher not found for update")

    update_data = watcher_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "webhook_url" and isinstance(value, HttpUrl):
             setattr(db_watcher, field, str(value))
        else: # Permitir que se establezcan valores None si se envían explícitamente para campos opcionales
            setattr(db_watcher, field, value)
    
    # db.add(db_watcher) # No es necesario si el objeto está en sesión
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def delete_watcher(db: Session, watcher_id: int) -> models.Watcher: # Cambiado para que coincida con tu versión
    db_watcher = get_watcher(db, watcher_id)
    if not db_watcher:
        raise HTTPException(status_code=404, detail="Watcher not found for deletion")
    
    db.delete(db_watcher)
    db.commit()
    return db_watcher

# --- Event (TokenEvent) CRUD ---
def create_event(db: Session, event_data: schemas.TokenEventCreate) -> models.Event:
    db_event = models.Event(
        watcher_id=event_data.watcher_id,
        token_address_observed=event_data.contract,
        amount=event_data.volume,
        transaction_hash=event_data.tx_hash,
        block_number=event_data.block_number,
    )
    try:
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event
    except Exception as e_crud_create:
        db.rollback() # MUY IMPORTANTE: hacer rollback en caso de error en la transacción
        print(f"❌ [CRUD_CREATE_EVENT_ERROR] Error al guardar evento (tx_hash: {event_data.tx_hash}): {e_crud_create!r}")
        # Considera cómo quieres manejar este error. Relanzarlo hará que el watcher.py lo capture.
        raise # Relanzar la excepción para que el вызывающий código (watcher.py) la maneje

def get_event(db: Session, event_id: int) -> models.Event | None:
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_events(db: Session, skip: int = 0, limit: int = 100) -> list[models.Event]:
    return (
        db.query(models.Event)
        .order_by(desc(models.Event.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_events_for_watcher(db: Session, watcher_id: int, skip: int = 0, limit: int = 100) -> list[models.Event]:
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
    return db.query(models.Transport).filter(models.Transport.id == transport_id).first()

def get_transports(db: Session, watcher_id: int | None = None, skip: int = 0, limit: int = 100) -> list[models.Transport]:
    query = db.query(models.Transport)
    if watcher_id is not None:
        query = query.filter(models.Transport.watcher_id == watcher_id)
    return query.order_by(models.Transport.id).offset(skip).limit(limit).all()

def create_transport(db: Session, transport: schemas.TransportCreate) -> models.Transport:
    db_watcher = get_watcher(db, transport.watcher_id)
    if not db_watcher:
        raise HTTPException(status_code=404, detail=f"Watcher with id {transport.watcher_id} not found, cannot create transport.")
    db_trans = models.Transport(
        watcher_id=transport.watcher_id,
        type=transport.type,
        config=transport.config,
    )
    db.add(db_trans)
    db.commit()
    db.refresh(db_trans)
    return db_trans

def delete_transport(db: Session, transport_id: int) -> models.Transport: # Cambiado para que coincida con tu versión
    db_trans = get_transport(db, transport_id)
    if not db_trans:
        raise HTTPException(status_code=404, detail="Transport not found")
    db.delete(db_trans)
    db.commit()
    return db_trans

# --- TokenVolume & Calculated Volume ---
def get_volume(db: Session, contract_address: str) -> float: # Esta calcula sobre la marcha
    total_volume = (
        db.query(sql_func.sum(models.Event.amount))
        .filter(models.Event.token_address_observed == contract_address)
        .scalar()
    )
    return total_volume if total_volume is not None else 0.0

def get_token_volume_entry(db: Session, contract_address: str) -> models.TokenVolume | None:
    return db.query(models.TokenVolume).filter(models.TokenVolume.contract == contract_address).first()

def get_all_token_volumes(db: Session, skip: int = 0, limit: int = 100) -> list[models.TokenVolume]: # Renombrado desde tu get_token_volumes
    return (
        db.query(models.TokenVolume)
        .order_by(models.TokenVolume.contract)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_or_update_token_volume(db: Session, volume_data: schemas.TokenRead) -> models.TokenVolume: # Renombrado desde tu create_token_volume
    db_vol = get_token_volume_entry(db, volume_data.contract)
    if db_vol:
        db_vol.volume = volume_data.volume
    else:
        db_vol = models.TokenVolume(
            contract=volume_data.contract,
            volume=volume_data.volume
        )
        db.add(db_vol)
    try:
        db.commit()
        db.refresh(db_vol)
        return db_vol
    except Exception as e:
        db.rollback()
        print(f"❌ [CRUD_TOKEN_VOLUME_ERROR] Error al guardar TokenVolume para {volume_data.contract}: {e!r}")
        raise