# api/app/crud.py

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc, asc, func as sql_func, distinct
from fastapi import HTTPException
from pydantic import HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

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
    db_transport = (
        db.query(models.Transport)
        .filter(models.Transport.watcher_id == watcher_model_instance.id)
        .first()
    )
    if webhook_url_from_schema:
        transport_type = get_transport_type_from_url(webhook_url_from_schema)
        webhook_url_str = str(webhook_url_from_schema)
        if not transport_type:
            if db_transport:
                db.delete(db_transport)
            return

        config_data = {"url": webhook_url_str}

        if db_transport:
            db_transport.type = transport_type
            db_transport.config = config_data
        else:
            db_transport = models.Transport(
                watcher_id=watcher_model_instance.id,
                type=transport_type,
                config=config_data,
            )
            db.add(db_transport)
    elif db_transport:
        db.delete(db_transport)


# --- User CRUD ---
def get_user(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).options(selectinload(models.User.watchers)).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """
    Retrieve all users with pagination. The watcher_count is handled by the model property.
    """
    return db.query(models.User).options(selectinload(models.User.watchers)).order_by(models.User.id).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate, is_active: bool = False) -> models.User:
    """
    Crea un usuario en la base de datos con is_active=False por defecto.
    """
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        is_active=is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def set_user_password(db: Session, user: models.User, new_password: str) -> models.User:
    """
    Hashea la nueva contraseña y la guarda en el registro del usuario.
    """
    hashed = auth.get_password_hash(new_password)
    user.hashed_password = hashed
    db.commit()
    db.refresh(user)
    return user

def delete_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    """
    Deletes a user and their associated data (watchers, transports, events)
    by their ID. The cascade is handled by the database relationship settings.
    """
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        return None # El endpoint se encargará de lanzar el error 404
    
    # Si la relación en el modelo User tiene cascade="all, delete-orphan",
    # SQLAlchemy se encargará de borrar los watchers, transports y events asociados.
    db.delete(user_to_delete)
    db.commit()
    return user_to_delete

# --- NUEVA FUNCIÓN PARA ACTUALIZAR USUARIOS COMO ADMIN ---
def update_user_admin(db: Session, user_id: int, user_update_data: schemas.UserUpdateAdmin) -> Optional[models.User]:
    """
    Updates a user's data from the admin panel (e.g. watcher_limit, is_active).
    """
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        return None

    update_data = user_update_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if hasattr(db_user, field):
            setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


# --- Watcher CRUD ---
def count_watchers_for_owner(db: Session, owner_id: int) -> int:
    """
    Counts the number of watchers owned by a specific user.
    """
    return db.query(models.Watcher).filter(models.Watcher.owner_id == owner_id).count()

def get_watcher_db(db: Session, watcher_id: int, owner_id: Optional[int] = None) -> models.Watcher:
    query = db.query(models.Watcher).options(selectinload(models.Watcher.transports))
    query = query.filter(models.Watcher.id == watcher_id)
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
    return (
        db.query(models.Watcher)
        .filter(models.Watcher.is_active == True)
        .order_by(models.Watcher.id)
        .options(selectinload(models.Watcher.transports))
        .offset(skip).limit(limit).all()
    )

def get_watchers_for_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Watcher]:
    return (
        db.query(models.Watcher)
        .filter(models.Watcher.owner_id == owner_id)
        .order_by(models.Watcher.name)
        .options(selectinload(models.Watcher.transports))
        .offset(skip).limit(limit).all()
    )

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

def update_watcher(db: Session, watcher_id: int, watcher_update_data: schemas.WatcherUpdatePayload, owner_id: int) -> models.Watcher:
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    update_data = watcher_update_data.model_dump(exclude_unset=True)
    webhook_url_in_payload = "webhook_url" in update_data
    new_webhook_url_value = watcher_update_data.webhook_url if webhook_url_in_payload else None

    for field, value in update_data.items():
        if field == "webhook_url":
            continue
        if hasattr(db_watcher, field):
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
def create_event(db: Session, event_data: schemas.TokenEventCreate) -> Optional[models.TokenEvent]:
    existing_event = db.query(models.TokenEvent).filter(
        models.TokenEvent.transaction_hash == event_data.transaction_hash,
        models.TokenEvent.watcher_id == event_data.watcher_id
    ).first()
    if existing_event:
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
        token_name=event_data.token_name,
        token_symbol=event_data.token_symbol
    )
    try:
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event
    except Exception:
        db.rollback()
        raise

def get_event_by_id(db: Session, event_id: int) -> models.TokenEvent | None:
    return db.query(models.TokenEvent).filter(models.TokenEvent.id == event_id).first()

def get_all_events_for_owner(
    db: Session,
    owner_id: int,
    skip: int = 0,
    limit: int = 100,
    watcher_id: Optional[int] = None,
    token_address: Optional[str] = None,
    token_symbol: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    from_address: Optional[str] = None,
    to_address: Optional[str] = None,
    min_usd_value: Optional[float] = None,
    max_usd_value: Optional[float] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    active_watchers_only: Optional[bool] = False
) -> Dict[str, Any]:
    base_query = db.query(models.TokenEvent)\
                   .join(models.Watcher, models.TokenEvent.watcher_id == models.Watcher.id)\
                   .filter(models.Watcher.owner_id == owner_id)

    if active_watchers_only:
        base_query = base_query.filter(models.Watcher.is_active == True)

    if watcher_id is not None:
        base_query = base_query.filter(models.TokenEvent.watcher_id == watcher_id)
    if token_address:
        base_query = base_query.filter(models.TokenEvent.token_address_observed.ilike(f"%{token_address}%"))
    if token_symbol:
        base_query = base_query.filter(models.TokenEvent.token_symbol.ilike(f"%{token_symbol}%"))

    if start_date:
        start_date_utc = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
        base_query = base_query.filter(models.TokenEvent.created_at >= start_date_utc)
    if end_date:
        end_date_utc_exclusive = datetime(end_date.year, end_date.month, end_date.day) + timedelta(days=1)
        base_query = base_query.filter(models.TokenEvent.created_at < end_date_utc_exclusive)

    if from_address:
        base_query = base_query.filter(models.TokenEvent.from_address.ilike(from_address))
    if to_address:
        base_query = base_query.filter(models.TokenEvent.to_address.ilike(to_address))
    if min_usd_value is not None:
        base_query = base_query.filter(models.TokenEvent.usd_value >= min_usd_value)
    if max_usd_value is not None:
        base_query = base_query.filter(models.TokenEvent.usd_value <= max_usd_value)

    total_events = base_query.with_entities(sql_func.count(models.TokenEvent.id)).scalar() or 0

    sort_map = {
        "created_at": models.TokenEvent.created_at,
        "amount": models.TokenEvent.amount,
        "usd_value": models.TokenEvent.usd_value,
        "block_number": models.TokenEvent.block_number,
    }
    sort_column = sort_map.get(sort_by, models.TokenEvent.created_at)

    if sort_order.lower() == "asc":
        ordered_query = base_query.order_by(asc(sort_column))
    else:
        ordered_query = base_query.order_by(desc(sort_column))

    events = ordered_query.offset(skip).limit(limit).all()
    return {"total_events": total_events, "events": events}

def get_events_for_watcher(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    base_query = db.query(models.TokenEvent).filter(models.TokenEvent.watcher_id == watcher_id)
    total_events = base_query.with_entities(sql_func.count(models.TokenEvent.id)).scalar() or 0
    events = base_query.order_by(desc(models.TokenEvent.created_at)).offset(skip).limit(limit).all()
    return {"total_events": total_events, "events": events}

def get_distinct_token_symbols_for_owner(db: Session, owner_id: int) -> List[str]:
    query = (
        db.query(distinct(models.TokenEvent.token_symbol))
          .join(models.Watcher, models.TokenEvent.watcher_id == models.Watcher.id)
          .filter(models.Watcher.owner_id == owner_id)
          .filter(models.TokenEvent.token_symbol.isnot(None))
          .filter(models.TokenEvent.token_symbol != '')
          .order_by(models.TokenEvent.token_symbol)
    )
    symbols = [item[0] for item in query.all()]
    return symbols

# --- Transport CRUD ---
def get_transport_by_id(db: Session, transport_id: int, owner_id: int) -> models.Transport | None:
    transport = (
        db.query(models.Transport)
          .join(models.Watcher, models.Transport.watcher_id == models.Watcher.id)
          .filter(models.Transport.id == transport_id, models.Watcher.owner_id == owner_id)
          .first()
    )
    if not transport:
        raise HTTPException(status_code=404, detail="Transport not found or not owned by user")
    return transport

def get_transports_for_watcher_owner_checked(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Transport]:
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    return (
        db.query(models.Transport)
          .filter(models.Transport.watcher_id == watcher_id)
          .order_by(models.Transport.id)
          .offset(skip)
          .limit(limit)
          .all()
    )

def create_new_transport_for_watcher(db: Session, transport_data: schemas.TransportCreate, watcher_id: int, owner_id: int) -> models.Transport:
    if transport_data.watcher_id != watcher_id:
        raise HTTPException(
            status_code=400,
            detail=f"Watcher ID en payload ({transport_data.watcher_id}) no coincide con Watcher ID en path ({watcher_id})."
        )
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

def get_volume(db: Session, contract_address: str) -> float:
    total_volume = (
        db.query(sql_func.sum(models.TokenEvent.amount))
          .filter(models.TokenEvent.token_address_observed == contract_address)
          .scalar()
    )
    return total_volume if total_volume is not None else 0.0