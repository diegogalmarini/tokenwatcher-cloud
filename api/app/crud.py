# api/app/crud.py
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc, func as sql_func
from fastapi import HTTPException
from pydantic import HttpUrl
from typing import Optional, List

from . import models, schemas, auth

# --- Funciones Auxiliares para Transports ---
def get_transport_type_from_url(webhook_url: HttpUrl | str) -> Optional[str]:
    url_str = str(webhook_url)
    if not url_str:
        return None
    if "discord.com/api/webhooks" in url_str:
        return "discord"
    elif "hooks.slack.com/services" in url_str:
        return "slack"
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
            if db_transport:
                db.delete(db_transport)
            print(f"Warning: Webhook URL '{webhook_url_str}' para Watcher ID={watcher_model_instance.id} no es de tipo conocido. No se creó/actualizó Transport.")
            return

        if db_transport:
            db_transport.type = transport_type
            db_transport.config = {"url": webhook_url_str}
            print(f"ℹ️ [CRUD_TRANSPORT] Transport ID={db_transport.id} actualizado para Watcher ID={watcher_model_instance.id} a tipo '{transport_type}'.")
        else:
            db_transport = models.Transport(
                watcher_id=watcher_model_instance.id,
                type=transport_type,
                config={"url": webhook_url_str}
            )
            db.add(db_transport)
            print(f"ℹ️ [CRUD_TRANSPORT] Nuevo Transport tipo '{transport_type}' creado para Watcher ID={watcher_model_instance.id}.")
    elif db_transport:
        db.delete(db_transport)
        print(f"ℹ️ [CRUD_TRANSPORT] Transport ID={db_transport.id} eliminado para Watcher ID={watcher_model_instance.id} (webhook_url no proporcionada o None).")

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
    query = db.query(models.Watcher).filter(models.Watcher.id == watcher_id)
    if owner_id is not None:
        query = query.filter(models.Watcher.owner_id == owner_id)
    db_watcher = query.first()
    
    if not db_watcher:
        detail = "Watcher not found"
        if owner_id is not None:
            detail = "Watcher not found or not owned by user"
        raise HTTPException(status_code=404, detail=detail)
    return db_watcher

def get_active_watchers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Watcher]:
    return (db.query(models.Watcher)
            .filter(models.Watcher.is_active == True)
            .order_by(models.Watcher.id)
            .options(selectinload(models.Watcher.transports)) 
            .offset(skip)
            .limit(limit)
            .all())

def get_watchers_for_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Watcher]:
    return (db.query(models.Watcher)
            .filter(models.Watcher.owner_id == owner_id)
            .order_by(models.Watcher.id)
            .options(selectinload(models.Watcher.transports)) 
            .offset(skip)
            .limit(limit)
            .all())

def create_watcher(db: Session, watcher_data: schemas.WatcherCreate, owner_id: int) -> models.Watcher:
    db_watcher = models.Watcher(
        name=watcher_data.name,
        token_address=watcher_data.token_address,
        threshold=watcher_data.threshold,
        is_active=watcher_data.is_active,
        owner_id=owner_id
    )
    db.add(db_watcher)
    db.flush() 

    _create_or_update_primary_transport_for_watcher(db, db_watcher, watcher_data.webhook_url)
    
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def update_watcher(db: Session, watcher_id: int, watcher_update_data: schemas.WatcherUpdate, owner_id: int) -> models.Watcher: # Quitamos | None
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)

    update_data = watcher_update_data.dict(exclude_unset=True)
    
    webhook_url_in_payload = "webhook_url" in update_data
    new_webhook_url_value = watcher_update_data.webhook_url
    
    for field, value in update_data.items():
        if field == "webhook_url": 
            continue
        if hasattr(db_watcher, field): # Comprobar si el campo existe en el modelo antes de asignarlo
             setattr(db_watcher, field, value)
    
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
def create_event(db: Session, event_data: schemas.TokenEventCreate) -> models.Event:
    # El schema TokenEventCreate ahora incluye from_address y to_address
    # y usa 'contract' para token_address_observed y 'volume' para amount.
    # El modelo Event usa 'token_address_observed', 'amount', 'from_address', 'to_address'.
    db_event = models.Event(
        watcher_id=event_data.watcher_id,
        token_address_observed=event_data.contract, # Mapeo de schema a modelo
        from_address=event_data.from_address,       # NUEVO CAMPO
        to_address=event_data.to_address,           # NUEVO CAMPO
        amount=event_data.volume,                   # Mapeo de schema a modelo
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
        # Es importante loguear el error específico de la BD si es posible
        print(f"❌ [CRUD_CREATE_EVENT_ERROR] Error al guardar evento (tx_hash: {event_data.tx_hash}): {e_crud_create!r}")
        # Re-lanzar la excepción para que el llamador (watcher.py) pueda manejarla si es necesario,
        # o decidir no crear una notificación.
        raise

def get_event_by_id(db: Session, event_id: int) -> models.Event | None:
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_all_events_for_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Event]:
    return (db.query(models.Event)
            .join(models.Watcher, models.Event.watcher_id == models.Watcher.id)
            .filter(models.Watcher.owner_id == owner_id)
            .order_by(desc(models.Event.created_at))
            .offset(skip)
            .limit(limit)
            .all())

def get_events_for_watcher(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Event]:
    # La propiedad ya se verifica en main.py antes de llamar a esta función
    return (db.query(models.Event)
            .filter(models.Event.watcher_id == watcher_id)
            .order_by(desc(models.Event.created_at))
            .offset(skip)
            .limit(limit)
            .all())

# --- Transport CRUD ---
def get_transport_by_id(db: Session, transport_id: int, owner_id: int) -> models.Transport | None:
    transport = (db.query(models.Transport)
                 .join(models.Watcher, models.Transport.watcher_id == models.Watcher.id)
                 .filter(models.Transport.id == transport_id, models.Watcher.owner_id == owner_id)
                 .first())
    if not transport:
        raise HTTPException(status_code=404, detail="Transport not found or not owned by user")
    return transport

def get_transports_for_watcher_owner_checked(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Transport]:
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id) 
    return (db.query(models.Transport)
            .filter(models.Transport.watcher_id == watcher_id)
            .order_by(models.Transport.id)
            .offset(skip)
            .limit(limit)
            .all())

def create_new_transport_for_watcher(db: Session, transport_data: schemas.TransportCreate, watcher_id: int, owner_id: int) -> models.Transport:
    if transport_data.watcher_id != watcher_id:
        raise HTTPException(status_code=400, detail=f"Watcher ID en payload ({transport_data.watcher_id}) no coincide con Watcher ID en path ({watcher_id}).")
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)

    db_transport = models.Transport(
        watcher_id=watcher_id,
        type=transport_data.type,
        config=transport_data.config
    )
    db.add(db_transport)
    db.commit()
    db.refresh(db_transport)
    return db_transport

def delete_transport_by_id(db: Session, transport_id: int, owner_id: int) -> None:
    db_transport = get_transport_by_id(db, transport_id=transport_id, owner_id=owner_id)
    db.delete(db_transport)
    db.commit()

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