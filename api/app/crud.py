# api/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc, func as sql_func # sql_func no se usa en este fragmento pero podría estar en tu original
from fastapi import HTTPException
from pydantic import HttpUrl # Importar HttpUrl
from typing import Optional # Asegurarse que Optional está importado

from . import models, schemas, auth # auth.py contendrá utilidades de contraseña

# --- Funciones Auxiliares para Transports ---
def get_transport_type_from_url(webhook_url: str) -> Optional[str]:
    """
    Determina el tipo de transporte basado en la URL del webhook.
    """
    if not webhook_url:
        return None
    if "discord.com/api/webhooks" in webhook_url:
        return "discord"
    elif "hooks.slack.com/services" in webhook_url:
        return "slack"
    # Aquí podrías añadir más tipos o una lógica por defecto
    return None # O podrías retornar "generic_webhook" o lanzar un error

def _create_or_update_transport_for_watcher(
    db: Session,
    watcher_model_instance: models.Watcher,
    webhook_url_from_schema: Optional[HttpUrl | str] # Acepta HttpUrl o str
):
    """
    Crea, actualiza o elimina el transport asociado a un watcher basado en la webhook_url.
    Esta es una implementación simplificada que asume un solo transport de tipo webhook por watcher.
    """
    # Convertir HttpUrl a string si es necesario
    webhook_url_str = str(webhook_url_from_schema) if webhook_url_from_schema else None

    # Buscar si ya existe un transport para este watcher
    # Asumimos que un watcher solo tiene un transport manejado directamente por webhook_url
    # Una lógica más compleja podría manejar múltiples transports de diferentes tipos
    db_transport = db.query(models.Transport).filter(models.Transport.watcher_id == watcher_model_instance.id).first()

    if webhook_url_str:
        transport_type = get_transport_type_from_url(webhook_url_str)
        if not transport_type:
            # Si la URL no es de un tipo conocido, podríamos optar por no crear/actualizar el transport
            # O manejarlo como un error o un tipo genérico.
            # Por ahora, si hay un transport existente y la nueva URL no es reconocida, lo eliminamos.
            if db_transport:
                db.delete(db_transport)
            print(f"Warning: Webhook URL '{webhook_url_str}' para Watcher ID={watcher_model_instance.id} no corresponde a un tipo de transporte conocido. No se creó/actualizó Transport.")
            return # No continuar si el tipo no es reconocido

        if db_transport:
            # Actualizar el transport existente si la URL o el tipo cambiaron
            if db_transport.type != transport_type or db_transport.config.get("url") != webhook_url_str:
                db_transport.type = transport_type
                db_transport.config = {"url": webhook_url_str}
                print(f"ℹ️ [CRUD_TRANSPORT] Transport ID={db_transport.id} actualizado para Watcher ID={watcher_model_instance.id}")
        else:
            # Crear un nuevo transport
            db_transport = models.Transport(
                watcher_id=watcher_model_instance.id,
                type=transport_type,
                config={"url": webhook_url_str}
            )
            db.add(db_transport)
            print(f"ℹ️ [CRUD_TRANSPORT] Nuevo Transport creado para Watcher ID={watcher_model_instance.id}")
    elif db_transport:
        # No se proporcionó webhook_url, pero existe un transport, así que lo eliminamos
        db.delete(db_transport)
        print(f"ℹ️ [CRUD_TRANSPORT] Transport ID={db_transport.id} eliminado para Watcher ID={watcher_model_instance.id} ya que no se proporcionó webhook_url.")


# --- User CRUD ---
def get_user(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
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
    # Crear el objeto Watcher
    # Nota: El campo 'webhook_url' del modelo Watcher podría volverse redundante si toda la lógica de notificación
    # se basa en la tabla 'transports'. Por ahora, lo mantenemos para no romper el esquema actual del modelo Watcher,
    # pero la URL real para notificaciones debería provenir del 'Transport' creado.
    db_watcher = models.Watcher(
        name=watcher.name,
        token_address=watcher.token_address,
        threshold=watcher.threshold,
        webhook_url=str(watcher.webhook_url) if watcher.webhook_url else "", # Guardar algo o hacerlo nullable
        owner_id=owner_id
    )
    db.add(db_watcher)
    db.flush() # Obtener el watcher.id antes de crear el transport

    # Crear/Actualizar el transport asociado
    _create_or_update_transport_for_watcher(db, db_watcher, watcher.webhook_url)
    
    db.commit()
    db.refresh(db_watcher)
    # Para acceder a db_watcher.transports (si la relación está configurada con lazy='joined' o se refresca explícitamente)
    # podrías necesitar un db.refresh(db_watcher, attribute_names=['transports']) o similar,
    # o simplemente confiar en que la carga lazy funcionará si se accede más tarde.
    return db_watcher

def update_watcher(db: Session, watcher_id: int, watcher_update: schemas.WatcherUpdate, owner_id: int) -> models.Watcher | None:
    db_watcher = db.query(models.Watcher).filter(models.Watcher.id == watcher_id, models.Watcher.owner_id == owner_id).first()
    if not db_watcher:
        # No es necesario lanzar excepción aquí si get_watcher_for_update ya lo hace o si el endpoint lo maneja.
        # Sin embargo, para proteger la función crud, es bueno:
        raise HTTPException(status_code=404, detail="Watcher not found or not owned by user")

    update_data = watcher_update.dict(exclude_unset=True)
    
    webhook_url_updated_in_payload = "webhook_url" in update_data
    new_webhook_url = None

    for field, value in update_data.items():
        if field == "webhook_url":
            new_webhook_url = value # Puede ser HttpUrl o None
            # Actualizamos el campo webhook_url en el modelo Watcher por consistencia o referencia,
            # aunque el Transport será la fuente de verdad para las notificaciones.
            setattr(db_watcher, field, str(value) if value else "")
        else:
            setattr(db_watcher, field, value)
    
    # Si webhook_url fue parte de la data de actualización (incluso si es None para eliminarlo)
    # o si simplemente queremos asegurar que el transport refleje el estado del watcher (podría ser más simple)
    # En este caso, si "webhook_url" está en update_data, intentamos actualizar el transport.
    if webhook_url_updated_in_payload:
         _create_or_update_transport_for_watcher(db, db_watcher, new_webhook_url)
    
    db.commit()
    db.refresh(db_watcher)
    return db_watcher

def delete_watcher(db: Session, watcher_id: int, owner_id: int) -> models.Watcher | None:
    db_watcher = db.query(models.Watcher).filter(models.Watcher.id == watcher_id, models.Watcher.owner_id == owner_id).first()
    if not db_watcher:
        # El endpoint ya no espera un retorno, así que esta excepción es el principal feedback de error.
        raise HTTPException(status_code=404, detail="Watcher not found or not owned by user")
    
    # La relación Watcher.transports y Watcher.events tiene cascade="all, delete-orphan" o similar,
    # o ondelete="CASCADE" en ForeignKey, por lo que SQLAlchemy/DB debería manejar la eliminación de dependientes.
    # Si no, tendríamos que eliminar transports y events manualmente aquí antes.
    # Con `cascade="all, delete-orphan"` en el modelo Watcher para la relación `transports`,
    # SQLAlchemy debería eliminar los transports asociados.
    # Con `ondelete="CASCADE"` en el ForeignKey de `Transport.watcher_id`, la BD lo haría.
    # Tu modelo Transport tiene `ondelete="CASCADE"`, así que la BD debería eliminar los transports.
    # Tu modelo Event también tiene `ondelete="CASCADE"`.

    db.delete(db_watcher)
    db.commit()
    # Como el endpoint devuelve 204 No Content, no necesitamos retornar db_watcher.
    # Pero la función crud puede retornarlo para consistencia interna si se llama desde otro lugar.
    return db_watcher # O None, ya que fue eliminado. El endpoint HTTP no lo usa.

# --- Event (TokenEvent) CRUD ---
def create_event(db: Session, event_data: schemas.TokenEventCreate) -> models.Event:
    db_event = models.Event(
        watcher_id=event_data.watcher_id,
        token_address_observed=event_data.contract, # En schema es 'contract', en model 'token_address_observed'
        amount=event_data.volume,                 # En schema es 'volume', en model 'amount'
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
        raise # Re-lanzar para que el llamador maneje la excepción si es necesario

def get_event(db: Session, event_id: int) -> models.Event | None:
    # Asumiendo que Event tiene una PK simple 'id' para este GET, aunque la PK real es compuesta.
    # Esto necesitaría ajustarse si 'id' no es único o si se busca por la PK compuesta.
    # Tu modelo Event tiene 'id' como parte de la PK compuesta, pero también un Sequence,
    # lo que implica que 'id' DEBERÍA ser único por sí mismo.
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_events(db: Session, skip: int = 0, limit: int = 100) -> list[models.Event]:
    return (
        db.query(models.Event)
        .order_by(desc(models.Event.created_at)) # Usar created_at para ordenar consistentemente
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_events_for_watcher(db: Session, watcher_id: int, owner_id: int | None = None, skip: int = 0, limit: int = 100) -> list[models.Event]:
    # Primero, verificar que el watcher pertenece al owner_id si se proporciona owner_id
    if owner_id is not None:
        # Esto asegura que solo se puedan obtener eventos de watchers propios
        watcher_owner_check = db.query(models.Watcher.id)\
            .filter(models.Watcher.id == watcher_id, models.Watcher.owner_id == owner_id)\
            .first()
        if not watcher_owner_check:
            # Si el watcher no existe o no pertenece al usuario, devolver lista vacía o lanzar 403/404
            # El endpoint en main.py ya maneja el 403/404 basado en el resultado de get_watcher,
            # pero aquí devolvemos una lista vacía para que el endpoint de main.py no necesite cambiar.
            # Aunque el endpoint en main.py YA verifica la propiedad del watcher antes de llamar a esto,
            # esta es una doble verificación.
            # Una forma más limpia: el endpoint obtiene el watcher, verifica propiedad, luego pasa el watcher_id.
            # La función get_events_for_watcher(db, watcher_id=watcher.id) ya no necesitaría owner_id.
            # PERO, tu endpoint de main.py NO obtiene el watcher primero, así que esta verificación es útil.
            return [] 

    query = db.query(models.Event).filter(models.Event.watcher_id == watcher_id)
    return (
        query
        .order_by(desc(models.Event.created_at)) # Usar created_at consistentemente
        .offset(skip)
        .limit(limit)
        .all()
    )

# --- Transport CRUD ---
# (Manteniendo tus funciones de Transport CRUD existentes, ya que podrían ser usadas por otros endpoints)
def get_transport(db: Session, transport_id: int) -> models.Transport | None:
    return db.query(models.Transport).filter(models.Transport.id == transport_id).first()

def get_transports(db: Session, watcher_id: int | None = None, owner_id: int | None = None, skip: int = 0, limit: int = 100) -> list[models.Transport]:
    query = db.query(models.Transport)
    if watcher_id is not None:
        # Si se proporciona owner_id, asegurar que el watcher pertenezca a ese owner
        if owner_id is not None:
            # Esta verificación ya está en el endpoint de main.py, pero es bueno tenerla aquí también
            # para la integridad de la función CRUD si se llama directamente.
            watcher = db.query(models.Watcher).filter(models.Watcher.id == watcher_id).first()
            if not watcher or watcher.owner_id != owner_id:
                return [] # O lanzar una excepción de no autorizado/no encontrado
        query = query.filter(models.Transport.watcher_id == watcher_id)
    elif owner_id is not None:
        # Si solo se proporciona owner_id, listar todos los transports de todos los watchers de ese owner
        query = query.join(models.Watcher, models.Transport.watcher_id == models.Watcher.id)\
                     .filter(models.Watcher.owner_id == owner_id)
    
    return query.order_by(models.Transport.id).offset(skip).limit(limit).all()

def create_transport(db: Session, transport: schemas.TransportCreate, watcher_id_from_path: int, owner_id: int) -> models.Transport:
    # Verificar que el watcher_id en el payload (si existe) coincida con el del path
    # y que el watcher pertenezca al usuario.
    # El schema TransportCreate tiene watcher_id. Asegurémonos que coincida y pertenezca al owner.
    
    if transport.watcher_id != watcher_id_from_path:
        raise HTTPException(status_code=400, detail=f"Watcher ID en payload ({transport.watcher_id}) no coincide con Watcher ID en path ({watcher_id_from_path}).")

    db_watcher = db.query(models.Watcher).filter(models.Watcher.id == watcher_id_from_path, models.Watcher.owner_id == owner_id).first()
    if not db_watcher:
        raise HTTPException(status_code=403, detail=f"No autorizado o Watcher ID {watcher_id_from_path} no encontrado.")

    # Verificar si ya existe un transport de este tipo para este watcher
    # (Opcional, depende de si permites múltiples transports del mismo tipo por watcher)
    # existing_transport = db.query(models.Transport).filter(
    #     models.Transport.watcher_id == watcher_id_from_path,
    #     models.Transport.type == transport.type
    # ).first()
    # if existing_transport:
    #     raise HTTPException(status_code=400, detail=f"Transport de tipo '{transport.type}' ya existe para este watcher.")

    db_transport = models.Transport(
        watcher_id=watcher_id_from_path, # Usar el del path que fue validado
        type=transport.type,
        config=transport.config
    )
    db.add(db_transport)
    db.commit()
    db.refresh(db_transport)
    return db_transport

def delete_transport(db: Session, transport_id: int, owner_id: int) -> models.Transport | None:
    # Asegurar que el transport a eliminar pertenezca a un watcher del owner_id
    db_transport = db.query(models.Transport)\
        .join(models.Watcher, models.Transport.watcher_id == models.Watcher.id)\
        .filter(models.Transport.id == transport_id, models.Watcher.owner_id == owner_id)\
        .first() # Obtener el objeto para retornarlo (aunque el endpoint no lo use)
        
    if not db_transport:
        # El endpoint ya no espera un retorno, así que esta excepción es el principal feedback de error.
        raise HTTPException(status_code=404, detail="Transport not found or user not authorized to delete this transport")
    
    db.delete(db_transport)
    db.commit()
    return db_transport # O None. El endpoint HTTP no lo usa.

# --- TokenVolume & Calculated Volume ---
def get_volume(db: Session, contract_address: str) -> float:
    total_volume = (
        db.query(sql_func.sum(models.Event.amount)) # Usar el nombre de columna correcto del modelo Event
        .filter(models.Event.token_address_observed == contract_address) # Usar el nombre de columna correcto
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
        db_vol.volume = volume_data.volume # Actualizar volumen
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