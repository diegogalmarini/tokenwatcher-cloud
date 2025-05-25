# api/app/crud.py
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc, func as sql_func
from fastapi import HTTPException
from pydantic import HttpUrl
from typing import Optional, List

# Importamos models y schemas como los has definido
from . import models, schemas, auth

# --- Funciones Auxiliares para Transports (Mantenemos tu lógica) ---
def get_transport_type_from_url(webhook_url: HttpUrl | str) -> Optional[str]:
    url_str = str(webhook_url)
    if not url_str: return None
    if "discord.com/api/webhooks" in url_str: return "discord"
    elif "hooks.slack.com/services" in url_str: return "slack"
    return None

def _create_or_update_primary_transport_for_watcher(
    db: Session,
    watcher_model_instance: models.Watcher,
    webhook_url_from_schema: Optional[HttpUrl]
):
    # Mantenemos tu lógica existente para _create_or_update_primary_transport_for_watcher
    db_transport = db.query(models.Transport).filter(models.Transport.watcher_id == watcher_model_instance.id).first()
    if webhook_url_from_schema:
        transport_type = get_transport_type_from_url(webhook_url_from_schema)
        webhook_url_str = str(webhook_url_from_schema)
        if not transport_type:
            if db_transport: db.delete(db_transport)
            print(f"Warning: Webhook URL no válida para Watcher ID={watcher_model_instance.id}.")
            return
        if db_transport:
            db_transport.type = transport_type
            db_transport.config = {"url": webhook_url_str}
        else:
            db_transport = models.Transport(watcher_id=watcher_model_instance.id, type=transport_type, config={"url": webhook_url_str})
            db.add(db_transport)
    elif db_transport:
        db.delete(db_transport)

# --- User CRUD (Mantenemos tu lógica) ---
def get_user(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, is_active=True)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Watcher CRUD ---
def get_watcher_db(db: Session, watcher_id: int, owner_id: Optional[int] = None) -> models.Watcher:
    query = db.query(models.Watcher).filter(models.Watcher.id == watcher_id)
    if owner_id is not None:
        query = query.filter(models.Watcher.owner_id == owner_id)
    db_watcher = query.first()
    if not db_watcher:
        raise HTTPException(status_code=404, detail="Watcher not found or not owned")
    return db_watcher

def get_active_watchers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Watcher]:
    return (db.query(models.Watcher)
            .filter(models.Watcher.is_active == True)
            .order_by(models.Watcher.id)
            .options(selectinload(models.Watcher.transports))
            .offset(skip).limit(limit).all())

def get_watchers_for_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Watcher]:
    return (db.query(models.Watcher)
            .filter(models.Watcher.owner_id == owner_id)
            .order_by(models.Watcher.id)
            .options(selectinload(models.Watcher.transports))
            .offset(skip).limit(limit).all())

def create_watcher(db: Session, watcher_data: schemas.WatcherCreate, owner_id: int) -> models.Watcher: # <-- MODIFICADO AQUÍ
    db_watcher = models.Watcher(
        name=watcher_data.name, token_address=watcher_data.token_address,
        threshold=watcher_data.threshold, is_active=watcher_data.is_active, owner_id=owner_id
    )
    db.add(db_watcher)
    db.flush()
    _create_or_update_primary_transport_for_watcher(db, db_watcher, watcher_data.webhook_url)
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def update_watcher(db: Session, watcher_id: int, watcher_update_data: schemas.WatcherUpdatePayload, owner_id: int) -> models.Watcher:
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    update_data = watcher_update_data.model_dump(exclude_unset=True)
    webhook_url_in_payload = "webhook_url" in update_data
    new_webhook_url_value = watcher_update_data.webhook_url
    for field, value in update_data.items():
        if field == "webhook_url": continue
        if hasattr(db_watcher, field): setattr(db_watcher, field, value)
    if webhook_url_in_payload:
        _create_or_update_primary_transport_for_watcher(db, db_watcher, new_webhook_url_value)
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def delete_watcher(db: Session, watcher_id: int, owner_id: int) -> None:
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    db.delete(db_watcher)
    db.commit()

# --- Event (TokenEvent) CRUD ---
def create_event(db: Session, event_data: schemas.TokenEventCreate) -> models.TokenEvent:
    """
    Crea un nuevo evento en la base de datos.
    AHORA incluye usd_value.
    """
    db_event = models.TokenEvent(
        watcher_id=event_data.watcher_id,
        token_address_observed=event_data.token_address_observed,
        from_address=event_data.from_address,
        to_address=event_data.to_address,
        amount=event_data.amount,
        transaction_hash=event_data.transaction_hash,
        block_number=event_data.block_number,
        usd_value=event_data.usd_value
    )
    try:
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event
    except Exception as e_crud_create:
        db.rollback()
        print(f"❌ [CRUD_CREATE_EVENT_ERROR] Error al guardar evento (tx_hash: {event_data.transaction_hash}): {e_crud_create!r}")
        existing = db.query(models.TokenEvent).filter(models.TokenEvent.transaction_hash == event_data.transaction_hash, models.TokenEvent.watcher_id == event_data.watcher_id).first()
        if existing:
             print(f"ℹ️ [CRUD_INFO] El evento {event_data.transaction_hash} ya existía.")
             return existing
        raise

def get_event_by_id(db: Session, event_id: int) -> models.TokenEvent | None:
    return db.query(models.TokenEvent).filter(models.TokenEvent.id == event_id).first()

def get_all_events_for_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.TokenEvent]:
    return (db.query(models.TokenEvent)
            .join(models.Watcher, models.TokenEvent.watcher_id == models.Watcher.id)
            .filter(models.Watcher.owner_id == owner_id)
            .order_by(desc(models.TokenEvent.created_at))
            .offset(skip).limit(limit).all())

def get_events_for_watcher(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.TokenEvent]:
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id) # Verifica propiedad
    return (db.query(models.TokenEvent)
            .filter(models.TokenEvent.watcher_id == watcher_id)
            .order_by(desc(models.TokenEvent.created_at))
            .offset(skip).limit(limit).all())

# --- Transport CRUD ---
# (Aquí va tu lógica de Transport CRUD que me mostraste antes, la mantengo tal cual)
# Si necesitas que la incluya, avísame, pero asumo que no ha cambiado.

# --- TokenVolume & Calculated Volume ---
# (Aquí va tu lógica de TokenVolume CRUD que me mostraste antes, la mantengo tal cual)
# Si necesitas que la incluya, avísame, pero asumo que no ha cambiado.