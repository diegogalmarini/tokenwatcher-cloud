# api/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException
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
        webhook_url=str(watcher.webhook_url),
    )
    db.add(db_watcher)
    db.commit()
    db.refresh(db_watcher)
    return db_watcher


def update_watcher(
    db: Session, watcher_id: int, watcher_update: schemas.WatcherUpdate
) -> models.Watcher:
    db_watcher = get_watcher(db, watcher_id)
    if not db_watcher:
        raise HTTPException(status_code=404, detail="Watcher not found")
    update_data = watcher_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_watcher, field, value)
    db.add(db_watcher)
    db.commit()
    db.refresh(db_watcher)
    return db_watcher


def delete_watcher(db: Session, watcher_id: int) -> models.Watcher:
    db_watcher = get_watcher(db, watcher_id)
    if not db_watcher:
        raise HTTPException(status_code=404, detail="Watcher not found")
    db.delete(db_watcher)
    db.commit()
    return db_watcher


# --- Event (TokenEvent) CRUD ---

def create_event(db: Session, event_data: schemas.TokenEventCreate) -> models.Event:
    """
    Crea un nuevo evento en la base de datos a partir de schemas.TokenEventCreate.
    """
    db_event = models.Event(
        watcher_id=event_data.watcher_id,
        token_address_observed=event_data.contract,
        amount=event_data.volume,
        transaction_hash=event_data.tx_hash,
        block_number=event_data.block_number,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


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


def get_events_for_watcher(
    db: Session, watcher_id: int, skip: int = 0, limit: int = 100
) -> list[models.Event]:
    return (
        db.query(models.Event)
        .filter(models.Event.watcher_id == watcher_id)
        .order_by(desc(models.Event.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


# --- Transport CRUD (opcional) ---

def get_transports(db: Session, skip: int = 0, limit: int = 100) -> list[models.Transport]:
    return (
        db.query(models.Transport)
        .order_by(models.Transport.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_transport(db: Session, transport: schemas.TransportCreate) -> models.Transport:
    db_trans = models.Transport(
        watcher_id=transport.watcher_id,
        type=transport.type,
        config=transport.config,
    )
    db.add(db_trans)
    db.commit()
    db.refresh(db_trans)
    return db_trans


def get_transport(db: Session, transport_id: int) -> models.Transport | None:
    return db.query(models.Transport).filter(models.Transport.id == transport_id).first()


def delete_transport(db: Session, transport_id: int) -> models.Transport:
    db_trans = get_transport(db, transport_id)
    if not db_trans:
        raise HTTPException(status_code=404, detail="Transport not found")
    db.delete(db_trans)
    db.commit()
    return db_trans


# --- TokenVolume CRUD (opcional) ---

def get_token_volumes(db: Session, skip: int = 0, limit: int = 100) -> list[models.TokenVolume]:
    return (
        db.query(models.TokenVolume)
        .order_by(models.TokenVolume.contract)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_token_volume(db: Session, volume: schemas.TokenRead) -> models.TokenVolume:
    db_vol = models.TokenVolume(
        contract=volume.contract,
        volume=volume.volume,
    )
    db.add(db_vol)
    db.commit()
    db.refresh(db_vol)
    return db_vol
