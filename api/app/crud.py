# api/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc, func as sql_func
from fastapi import HTTPException
from pydantic import HttpUrl

from . import models, schemas, auth # auth.py contendrá utilidades de contraseña

# --- User CRUD ---
def get_user(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    # Asumimos que is_active tiene un default=True en el modelo User
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Watcher CRUD ---
def get_watcher(db: Session, watcher_id: int) -> models.Watcher | None:
    return db.query(models.Watcher).filter(models.Watcher.id == watcher_id).first()

def get_watchers(db: Session, owner_id: int | None = None, skip: int = 0, limit: int = 100) -> list[models.Watcher]:
    query = db.query(models.Watcher)
    if owner_id is not None:
        query = query.filter(models.Watcher.owner_id == owner_id)
    return query.order_by(models.Watcher.id).offset(skip).limit(limit).all()

def create_watcher(db: Session, watcher: schemas.WatcherCreate, owner_id: int) -> models.Watcher:
    db_watcher = models.Watcher(
        name=watcher.name,
        token_address=watcher.token_address,
        threshold=watcher.threshold,
        webhook_url=str(watcher.webhook_url),
        owner_id=owner_id
    )
    db.add(db_watcher)
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def update_watcher(db: Session, watcher_id: int, watcher_update: schemas.WatcherUpdate, owner_id: int) -> models.Watcher | None:
    db_watcher = db.query(models.Watcher).filter(models.Watcher.id == watcher_id, models.Watcher.owner_id == owner_id).first()
    if not db_watcher:
        raise HTTPException(status_code=404, detail="Watcher not found or not owned by user")

    update_data = watcher_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "webhook_url" and isinstance(value, HttpUrl):
             setattr(db_watcher, field, str(value))
        else:
            setattr(db_watcher, field, value)
    
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def delete_watcher(db: Session, watcher_id: int, owner_id: int) -> models.Watcher | None:
    db_watcher = db.query(models.Watcher).filter(models.Watcher.id == watcher_id, models.Watcher.owner_id == owner_id).first()
    if not db_watcher:
        raise HTTPException(status_code=404, detail="Watcher not found or not owned by user")
    
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
        db.rollback()
        print(f"❌ [CRUD_CREATE_EVENT_ERROR] Error al guardar evento (tx_hash: {event_data.tx_hash}): {e_crud_create!r}")
        raise

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

def get_events_for_watcher(db: Session, watcher_id: int, owner_id: int | None = None, skip: int = 0, limit: int = 100) -> list[models.Event]:
    query = db.query(models.Event).filter(models.Event.watcher_id == watcher_id)
    if owner_id is not None:
        exists_watcher_for_owner = db.query(models.Watcher.id)\
            .filter(models.Watcher.id == watcher_id, models.Watcher.owner_id == owner_id)\
            .first()
        if not exists_watcher_for_owner:
            return []
    return (
        query
        .order_by(desc(models.Event.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

# --- Transport CRUD ---
def get_transport(db: Session, transport_id: int) -> models.Transport | None:
    return db.query(models.Transport).filter(models.Transport.id == transport_id).first()

def get_transports(db: Session, watcher_id: int | None = None, owner_id: int | None = None, skip: int = 0, limit: int = 100) -> list[models.Transport]:
    query = db.query(models.Transport)
    if watcher_id is not None:
        if owner_id is not None:
            watcher = get_watcher(db, watcher_id)
            if not watcher or watcher.owner_id != owner_id:
                return []
        query = query.filter(models.Transport.watcher_id == watcher_id)
    elif owner_id is not None:
        query = query.join(models.Watcher).filter(models.Watcher.owner_id == owner_id)
    return query.order_by(models.Transport.id).offset(skip).limit(limit).all()

def create_transport(db: Session, transport: schemas.TransportCreate, owner_id: int) -> models.Transport:
    db_watcher = get_watcher(db, transport.watcher_id)
    if not db_watcher or db_watcher.owner_id != owner_id:
        raise HTTPException(status_code=403, detail=f"Not authorized to create transport for watcher id {transport.watcher_id}")

    db_transport = models.Transport(
        watcher_id=transport.watcher_id,
        type=transport.type,
        config=transport.config
    )
    db.add(db_transport)
    db.commit()
    db.refresh(db_transport)
    return db_transport

def delete_transport(db: Session, transport_id: int, owner_id: int) -> models.Transport | None:
    db_transport = db.query(models.Transport)\
        .join(models.Watcher)\
        .filter(models.Transport.id == transport_id, models.Watcher.owner_id == owner_id)\
        .first()
    if not db_transport:
        raise HTTPException(status_code=404, detail="Transport not found or not authorized to delete")
    db.delete(db_transport)
    db.commit()
    return db_transport

# --- TokenVolume & Calculated Volume ---
def get_volume(db: Session, contract_address: str) -> float:
    total_volume = (
        db.query(sql_func.sum(models.Event.amount))
        .filter(models.Event.token_address_observed == contract_address)
        .scalar()
    )
    return total_volume if total_volume is not None else 0.0

def get_token_volume_entry(db: Session, contract_address: str) -> models.TokenVolume | None:
    return db.query(models.TokenVolume).filter(models.TokenVolume.contract == contract_address).first()

def get_all_token_volumes(db: Session, skip: int = 0, limit: int = 100) -> list[models.TokenVolume]:
    return (
        db.query(models.TokenVolume)
        .order_by(models.TokenVolume.contract)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_or_update_token_volume(db: Session, volume_data: schemas.TokenRead) -> models.TokenVolume:
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