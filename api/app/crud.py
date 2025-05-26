# api/app/crud.py
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc, func as sql_func, inspect as sql_inspect # sql_inspect para verificar columnas
from fastapi import HTTPException
from pydantic import HttpUrl
from typing import Optional, List, Dict, Any # <-- AÑADIDO Dict, Any
import json # <-- AÑADIDO para el manejo de config en _create_or_update_primary_transport_for_watcher

from . import models, schemas, auth

# --- Funciones Auxiliares para Transports ---
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
    db_transport = db.query(models.Transport).filter(models.Transport.watcher_id == watcher_model_instance.id).first()
    if webhook_url_from_schema:
        transport_type = get_transport_type_from_url(webhook_url_from_schema)
        webhook_url_str = str(webhook_url_from_schema)
        if not transport_type:
            if db_transport: db.delete(db_transport)
            print(f"Warning: Webhook URL no válida para Watcher ID={watcher_model_instance.id}.")
            return

        config_data = {"url": webhook_url_str} # Esto es un dict

        if db_transport:
            db_transport.type = transport_type
            db_transport.config = config_data # SQLAlchemy con JSONB debería manejar el dict
        else:
            db_transport = models.Transport(
                watcher_id=watcher_model_instance.id,
                type=transport_type,
                config=config_data # SQLAlchemy con JSONB debería manejar el dict
            )
            db.add(db_transport)
    elif db_transport:
        db.delete(db_transport)

# --- User CRUD ---
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
    query = db.query(models.Watcher).options(selectinload(models.Watcher.transports)) # Eager load transports
    query = query.filter(models.Watcher.id == watcher_id)
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

def create_watcher(db: Session, watcher_data: schemas.WatcherCreate, owner_id: int) -> models.Watcher:
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
    new_webhook_url_value = watcher_update_data.webhook_url if webhook_url_in_payload else db_watcher.transports[0].config.get("url") if db_watcher.transports else None


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
def create_event(db: Session, event_data: schemas.TokenEventCreate) -> Optional[models.TokenEvent]:
    existing_event = db.query(models.TokenEvent).filter(
        models.TokenEvent.transaction_hash == event_data.transaction_hash,
        models.TokenEvent.watcher_id == event_data.watcher_id
        # Podrías añadir más campos aquí si tu UniqueConstraint es más complejo
    ).first()

    if existing_event:
        print(f"ℹ️ [CRUD_INFO] El evento con tx_hash {event_data.transaction_hash} para watcher_id {event_data.watcher_id} ya existía. Se omite la creación.")
        return existing_event

    db_event = models.TokenEvent(
        watcher_id=event_data.watcher_id,
        token_address_observed=event_data.token_address_observed,
        from_address=event_data.from_address,
        to_address=event_data.to_address,
        amount=event_data.amount,
        transaction_hash=event_data.transaction_hash,
        block_number=event_data.block_number,
        usd_value=event_data.usd_value,
        token_name=event_data.token_name,     # <-- AÑADIDO
        token_symbol=event_data.token_symbol  # <-- AÑADIDO
    )
    try:
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event
    except Exception as e_crud_create:
        db.rollback()
        print(f"❌ [CRUD_CREATE_EVENT_ERROR] Error al guardar NUEVO evento (tx_hash: {event_data.transaction_hash}): {e_crud_create!r}")
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
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    return (db.query(models.TokenEvent)
            .filter(models.TokenEvent.watcher_id == watcher_id)
            .order_by(desc(models.TokenEvent.created_at))
            .offset(skip).limit(limit).all())

# --- Transport CRUD ---
# (Tu lógica existente de Transport CRUD - la he mantenido igual que me pasaste)
def create_new_transport_for_watcher(db: Session, transport_data: schemas.TransportCreate, watcher_id: int, owner_id: int) -> models.Transport:
    # Asegurarse que el watcher existe y pertenece al owner
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)

    # Validar tipo de transport y config (simplificado, puedes expandir)
    if not get_transport_type_from_url(str(transport_data.config.get("url"))): # Asumiendo que config siempre tiene 'url'
        raise HTTPException(status_code=400, detail="Invalid webhook URL or unsupported transport type based on URL.")

    db_transport = models.Transport(
        watcher_id=watcher_id,
        type=transport_data.type, # El tipo debería validarse o derivarse de la config de forma más robusta
        config=transport_data.config # Como el modelo usa JSONB, podemos pasar el dict
    )
    db.add(db_transport)
    db.commit()
    db.refresh(db_transport)
    return db_transport

def get_transports_for_watcher_owner_checked(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Transport]:
    # get_watcher_db ya verifica la propiedad del watcher
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    return (db.query(models.Transport)
            .filter(models.Transport.watcher_id == watcher_id)
            .order_by(models.Transport.id) # O como prefieras ordenar
            .offset(skip)
            .limit(limit)
            .all())

def delete_transport_by_id(db: Session, transport_id: int, owner_id: int) -> None:
    # Para verificar propiedad, primero obtenemos el transport y su watcher asociado
    db_transport = db.query(models.Transport).options(selectinload(models.Transport.watcher))\
                     .filter(models.Transport.id == transport_id).first()

    if not db_transport:
        raise HTTPException(status_code=404, detail="Transport not found")
    
    if db_transport.watcher.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="User does not own this transport")
        
    db.delete(db_transport)
    db.commit()

# --- TokenVolume & Calculated Volume (Tu lógica existente) ---
def get_volume(db: Session, contract_address: str) -> float:
    total_volume = (
        db.query(sql_func.sum(models.TokenEvent.amount)) # Asegúrate que TokenEvent es el modelo correcto aquí
        .filter(models.TokenEvent.token_address_observed == contract_address)
        .scalar()
    )
    return total_volume if total_volume is not None else 0.0

# Tu TokenVolume parece ser un modelo que no me has pasado. Asumo que existe.
# Si no existe o no lo usas, puedes eliminar estas funciones o adaptarlas.
# def get_token_volume_entry(db: Session, contract_address: str) -> models.TokenVolume | None:
#     # return db.query(models.TokenVolume).filter(models.TokenVolume.contract == contract_address).first()
#     pass # Implementa si es necesario

# def get_all_token_volumes(db: Session, skip: int = 0, limit: int = 100) -> list[models.TokenVolume]:
#     # return (
#     #     db.query(models.TokenVolume)
#     #     .order_by(models.TokenVolume.contract)
#     #     .offset(skip)
#     #     .limit(limit)
#     #     .all()
#     # )
#     return [] # Implementa si es necesario

# def create_or_update_token_volume(db: Session, volume_data: schemas.TokenRead) -> models.TokenVolume:
#     # db_vol = get_token_volume_entry(db, volume_data.contract)
#     # if db_vol:
#     #     db_vol.volume = volume_data.volume
#     # else:
#     #     db_vol = models.TokenVolume(
#     #         contract=volume_data.contract,
#     #         volume=volume_data.volume
#     #     )
#     #     db.add(db_vol)
#     # try:
#     #     db.commit()
#     #     db.refresh(db_vol)
#     #     return db_vol
#     # except Exception as e:
#     #     db.rollback()
#     #     print(f"❌ [CRUD_TOKEN_VOLUME_ERROR] Error al guardar TokenVolume para {volume_data.contract}: {e!r}")
#     #     raise
#     pass # Implementa si es necesario