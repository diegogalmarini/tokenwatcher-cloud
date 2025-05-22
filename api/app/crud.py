# api/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc, func as sql_func # sql_func para get_volume
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
    return None # O un tipo genérico, o lanzar error

def _create_or_update_primary_transport_for_watcher(
    db: Session,
    watcher_model_instance: models.Watcher,
    webhook_url_from_schema: Optional[HttpUrl] # Es HttpUrl o None
):
    # Busca el primer transport (asumimos que es el "principal" si hay varios)
    # Para una lógica más robusta con múltiples transports, esto necesitaría cambiar.
    db_transport = db.query(models.Transport).filter(models.Transport.watcher_id == watcher_model_instance.id).first()

    if webhook_url_from_schema: # Si se proporciona una URL
        transport_type = get_transport_type_from_url(webhook_url_from_schema)
        webhook_url_str = str(webhook_url_from_schema)

        if not transport_type: # URL no reconocida
            if db_transport: # Si había uno, lo borramos
                db.delete(db_transport)
            print(f"Warning: Webhook URL '{webhook_url_str}' para Watcher ID={watcher_model_instance.id} no es de tipo conocido. Transport no creado/actualizado.")
            return

        if db_transport: # Actualizar existente
            db_transport.type = transport_type
            db_transport.config = {"url": webhook_url_str}
            print(f"ℹ️ [CRUD_TRANSPORT] Transport ID={db_transport.id} actualizado para Watcher ID={watcher_model_instance.id} a tipo '{transport_type}'.")
        else: # Crear nuevo
            db_transport = models.Transport(
                watcher_id=watcher_model_instance.id,
                type=transport_type,
                config={"url": webhook_url_str}
            )
            db.add(db_transport)
            print(f"ℹ️ [CRUD_TRANSPORT] Nuevo Transport tipo '{transport_type}' creado para Watcher ID={watcher_model_instance.id}.")
    elif db_transport: # No se proporcionó URL (es None), y existía un transport, lo eliminamos
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
    """Obtiene un watcher por ID, opcionalmente verifica propietario. Lanza excepción si no se encuentra/autoriza."""
    query = db.query(models.Watcher).filter(models.Watcher.id == watcher_id)
    if owner_id is not None:
        query = query.filter(models.Watcher.owner_id == owner_id)
    db_watcher = query.first()
    
    if not db_watcher:
        detail = "Watcher not found"
        if owner_id is not None: # Si se especificó owner_id, el error es más específico
            detail = "Watcher not found or not owned by user"
        raise HTTPException(status_code=404, detail=detail)
    return db_watcher


def get_active_watchers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Watcher]:
    """Obtiene todos los watchers que están activos (is_active=True), para el poller."""
    return db.query(models.Watcher)\
             .filter(models.Watcher.is_active == True)\
             .order_by(models.Watcher.id)\
             .options(selectinload(models.Watcher.transports)) # Eager load transports
             .offset(skip)\
             .limit(limit)\
             .all()

def get_watchers_for_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Watcher]:
    """Obtiene todos los watchers (activos e inactivos) para un propietario específico."""
    return db.query(models.Watcher)\
             .filter(models.Watcher.owner_id == owner_id)\
             .order_by(models.Watcher.id)\
             .options(selectinload(models.Watcher.transports)) # Eager load transports
             .offset(skip)\
             .limit(limit)\
             .all()

def create_watcher(db: Session, watcher_data: schemas.WatcherCreate, owner_id: int) -> models.Watcher:
    db_watcher = models.Watcher(
        name=watcher_data.name,
        token_address=watcher_data.token_address,
        threshold=watcher_data.threshold,
        is_active=watcher_data.is_active, # Del schema, default True
        owner_id=owner_id
        # El campo webhook_url ya no existe en el modelo Watcher
    )
    db.add(db_watcher)
    db.flush() # Para obtener db_watcher.id para el Transport

    # webhook_url es obligatorio en WatcherCreate, así que siempre creamos un transport.
    _create_or_update_primary_transport_for_watcher(db, db_watcher, watcher_data.webhook_url)
    
    db.commit()
    db.refresh(db_watcher)
    # Para cargar la relación 'transports' si el _populate_watcher_read lo necesita inmediatamente
    # y no se usa selectinload en la query que obtiene el watcher.
    # Por ahora, _populate_watcher_read hará una query separada para el transport.
    return db_watcher

def update_watcher(db: Session, watcher_id: int, watcher_update_data: schemas.WatcherUpdate, owner_id: int) -> models.Watcher:
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id) # Ya lanza 404 si no es del owner

    update_data = watcher_update_data.dict(exclude_unset=True)
    
    webhook_url_in_payload = "webhook_url" in update_data # True si 'webhook_url' fue explícitamente enviado
    
    for field, value in update_data.items():
        if field == "webhook_url": 
            continue # webhook_url se maneja con _create_or_update_primary_transport_for_watcher
        if hasattr(db_watcher, field):
             setattr(db_watcher, field, value)
    
    if webhook_url_in_payload:
        # new_webhook_url_value será HttpUrl o None (si el usuario envió null)
        new_webhook_url_value = watcher_update_data.webhook_url 
        _create_or_update_primary_transport_for_watcher(db, db_watcher, new_webhook_url_value)
    
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def delete_watcher(db: Session, watcher_id: int, owner_id: int) -> None:
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id) # Ya lanza 404
    # Los transports y events asociados se eliminarán por cascade="all, delete-orphan"
    # y/o por ondelete="CASCADE" en la BD.
    db.delete(db_watcher)
    db.commit()

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

def get_event_by_id(db: Session, event_id: int) -> models.Event | None:
    """Obtiene un evento por su ID de secuencia (asumiendo que es único para búsquedas simples)."""
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_all_events_for_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Event]:
    """Obtiene todos los eventos de todos los watchers que pertenecen al owner_id."""
    return db.query(models.Event)\
             .join(models.Watcher, models.Event.watcher_id == models.Watcher.id)\
             .filter(models.Watcher.owner_id == owner_id)\
             .order_by(desc(models.Event.created_at))\
             .offset(skip)\
             .limit(limit)\
             .all()

def get_events_for_watcher(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Event]:
    # La propiedad del watcher ya se verifica en el endpoint de main.py antes de llamar aquí.
    # Si no, necesitaríamos pasar owner_id y verificarlo aquí también.
    # La versión que tenías en main.py llamaba a get_watcher_db primero.
    return db.query(models.Event)\
             .filter(models.Event.watcher_id == watcher_id)\
             .order_by(desc(models.Event.created_at))\
             .offset(skip)\
             .limit(limit)\
             .all()


# --- Transport CRUD (para gestión avanzada y directa de transports) ---
def get_transport_by_id(db: Session, transport_id: int, owner_id: int) -> models.Transport | None:
    """Obtiene un transport específico, verificando que pertenezca a un watcher del owner."""
    transport = db.query(models.Transport)\
                  .join(models.Watcher, models.Transport.watcher_id == models.Watcher.id)\
                  .filter(models.Transport.id == transport_id, models.Watcher.owner_id == owner_id)\
                  .first()
    if not transport:
        raise HTTPException(status_code=404, detail="Transport not found or not owned by user")
    return transport

def get_transports_for_watcher_owner_checked(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Transport]:
    """Obtiene transports para un watcher específico, verificando propiedad del watcher."""
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id) # Verifica propiedad y existencia del watcher
    return db.query(models.Transport)\
             .filter(models.Transport.watcher_id == watcher_id)\
             .order_by(models.Transport.id)\
             .offset(skip)\
             .limit(limit)\
             .all()

def create_new_transport_for_watcher(db: Session, transport_data: schemas.TransportCreate, watcher_id: int, owner_id: int) -> models.Transport:
    """Crea un transport adicional para un watcher existente, verificando propiedad."""
    # transport_data.watcher_id debe coincidir con watcher_id del path
    if transport_data.watcher_id != watcher_id:
        raise HTTPException(status_code=400, detail=f"Watcher ID en payload ({transport_data.watcher_id}) no coincide con Watcher ID en path ({watcher_id}).")
    
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id) # Verifica que el watcher exista y pertenezca al usuario

    db_transport = models.Transport(
        watcher_id=watcher_id, # Usar el del path/validado
        type=transport_data.type,
        config=transport_data.config
    )
    db.add(db_transport)
    db.commit()
    db.refresh(db_transport)
    return db_transport

def delete_transport_by_id(db: Session, transport_id: int, owner_id: int) -> None:
    """Elimina un transport específico, verificando propiedad a través del watcher."""
    db_transport = get_transport_by_id(db, transport_id=transport_id, owner_id=owner_id) # Ya lanza 404
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