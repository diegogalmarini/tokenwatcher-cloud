# api/app/crud.py

from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas

# — Watchers CRUD —
def create_watcher(db: Session, w: schemas.WatcherCreate):
    db_w = models.Watcher(**w.model_dump())
    db.add(db_w)
    db.commit()
    db.refresh(db_w)
    return db_w

def get_watcher(db: Session, watcher_id: int):
    return db.query(models.Watcher).filter(models.Watcher.id == watcher_id).first()

def get_watchers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Watcher).offset(skip).limit(limit).all()

def update_watcher(db: Session, watcher_id: int, w: schemas.WatcherCreate):
    db_w = get_watcher(db, watcher_id)
    if not db_w:
        return None
    for k, v in w.model_dump().items():
        setattr(db_w, k, v)
    db.commit()
    db.refresh(db_w)
    return db_w

def delete_watcher(db: Session, watcher_id: int):
    db_w = get_watcher(db, watcher_id)
    if not db_w:
        return None
    db.delete(db_w)
    db.commit()
    return db_w

# — TokenEvents CRUD —
def create_event(db: Session, e: schemas.TokenEventCreate):
    db_e = models.TokenEvent(**e.model_dump())
    db.add(db_e)
    db.commit()
    db.refresh(db_e)
    return db_e

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.TokenEvent).offset(skip).limit(limit).all()

def get_events_for_watcher(db: Session, watcher_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.TokenEvent)
        .filter(models.TokenEvent.watcher_id == watcher_id)
        .offset(skip).limit(limit)
        .all()
    )

# — Transports CRUD —
def create_transport(db: Session, t: schemas.TransportCreate):
    db_t = models.Transport(**t.model_dump())
    db.add(db_t)
    db.commit()
    db.refresh(db_t)
    return db_t

def get_transports(db: Session, watcher_id: int = None, skip: int = 0, limit: int = 100):
    q = db.query(models.Transport)
    if watcher_id is not None:
        q = q.filter(models.Transport.watcher_id == watcher_id)
    return q.offset(skip).limit(limit).all()

def delete_transport(db: Session, transport_id: int):
    db_t = db.query(models.Transport).filter(models.Transport.id == transport_id).first()
    if not db_t:
        return None
    db.delete(db_t)
    db.commit()
    return db_t

# — Volumen total de tokens para un contrato —
def get_volume(db: Session, contract_address: str) -> int:
    total = (
        db.query(func.coalesce(func.sum(models.TokenEvent.volume), 0))
        .filter(models.TokenEvent.contract == contract_address)
        .scalar()
    )
    return int(total or 0)
