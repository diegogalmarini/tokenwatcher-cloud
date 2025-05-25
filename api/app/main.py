# api/app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import HttpUrl

# Importación de CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, get_db
from . import models, schemas, crud, auth

# Creación de tablas (esto se ejecuta una vez al iniciar la aplicación)
try:
    print("ℹ️ [DB_INIT] Intentando crear/verificar todas las tablas definidas en Base...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ [DB_INIT] Tablas verificadas/creadas con éxito.")
except Exception as e:
    print(f"❌ [DB_INIT_ERROR] No se pudieron crear/verificar las tablas: {e}")

app = FastAPI(
    title="TokenWatcher API",
    version="0.7.1", # Nueva versión con CORS regex
    description="API para monitorizar transferencias de tokens ERC-20. Webhook es obligatorio al crear Watcher. Watchers pueden ser activados/desactivados."
)

# --- Configuración de CORS ---
# Para desarrollo, permitimos localhost en cualquier puerto vía regex.
# Para producción, DEBES reemplazar o añadir la URL específica de tu frontend desplegado.
allow_origin_regex = r"http://localhost:\d+" # Permite http://localhost: seguido de cualquier número de puerto

# Lista de URLs específicas para producción (ejemplos)
origins_for_production = [
    # "https://www.tufrontend.com",
    # "https://app.tufrontend.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_for_production,  # Para producción (actualmente vacía)
    allow_origin_regex=allow_origin_regex, # Para desarrollo local
    allow_credentials=True,
    allow_methods=["*"], # Permite todos los métodos (GET, POST, PUT, etc.)
    allow_headers=["*"], # Permite todas las cabeceras
)
# --- Fin de Configuración de CORS ---

# Incluir el router de autenticación
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# --- Funciones Auxiliares ---
def _populate_watcher_read_from_db_watcher(db_watcher: models.Watcher, db: Session) -> schemas.WatcherRead:
    active_webhook_url: Optional[HttpUrl] = None
    # Asumimos que `db_watcher.transports` está disponible (cargado con selectinload o por acceso lazy)
    # y que tomamos el primer transport como el "principal" para mostrar su URL.
    if db_watcher.transports:
        first_transport = db_watcher.transports[0]
        if first_transport.config and "url" in first_transport.config:
            try:
                active_webhook_url = HttpUrl(first_transport.config["url"])
            except Exception:
                active_webhook_url = None
                print(f"Warning: URL en config de Transport ID={first_transport.id} no es HttpUrl válida: {first_transport.config['url']}")

    return schemas.WatcherRead(
        id=db_watcher.id,
        owner_id=db_watcher.owner_id,
        name=db_watcher.name,
        token_address=db_watcher.token_address,
        threshold=db_watcher.threshold,
        is_active=db_watcher.is_active,
        webhook_url=active_webhook_url,
        created_at=db_watcher.created_at,
        updated_at=db_watcher.updated_at
    )

# --- Health & System Endpoints ---
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "message": "TokenWatcher API is healthy"}

@app.get("/", tags=["System"], include_in_schema=False)
def api_root_demo():
    return {"message": "🎉 Welcome to TokenWatcher API v0.7.1! Visit /docs for API documentation."}

# --- Watchers CRUD ---
@app.post("/watchers/", response_model=schemas.WatcherRead, status_code=status.HTTP_201_CREATED, tags=["Watchers"])
def create_new_watcher_for_current_user(
    watcher_data: schemas.WatcherCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.create_watcher(db=db, watcher_data=watcher_data, owner_id=current_user.id)
    # Refrescar para cargar la relación transports si no se hizo en el CRUD o con selectinload
    db.refresh(db_watcher, attribute_names=['transports'])
    return _populate_watcher_read_from_db_watcher(db_watcher, db)

@app.get("/watchers/", response_model=List[schemas.WatcherRead], tags=["Watchers"])
def list_watchers_for_current_user(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # crud.get_watchers_for_owner ya usa selectinload para transports, así que están precargados.
    db_watchers = crud.get_watchers_for_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return [_populate_watcher_read_from_db_watcher(w, db) for w in db_watchers]

@app.get("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def get_single_watcher_for_current_user(
    watcher_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
    # Asegurar que transports esté cargado para _populate_watcher_read_from_db_watcher
    # get_watcher_db no hace selectinload por defecto.
    db.refresh(db_watcher, attribute_names=['transports'])
    return _populate_watcher_read_from_db_watcher(db_watcher, db)

@app.put("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def update_existing_watcher_for_current_user(
    watcher_id: int,
    watcher_update_data: schemas.WatcherUpdatePayload, # <-- ÚNICO CAMBIO AQUÍ
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.update_watcher(db=db, watcher_id=watcher_id, watcher_update_data=watcher_update_data, owner_id=current_user.id)
    db.refresh(db_watcher, attribute_names=['transports']) # Refrescar para la relación transports
    return _populate_watcher_read_from_db_watcher(db_watcher, db)

@app.delete("/watchers/{watcher_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Watchers"])
def delete_existing_watcher_for_current_user(
    watcher_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.delete_watcher(db=db, watcher_id=watcher_id, owner_id=current_user.id)
    return

# --- Events CRUD ---
@app.post("/events/", response_model=schemas.TokenEventRead, status_code=status.HTTP_201_CREATED, tags=["Events"], include_in_schema=False)
def create_new_event_for_authed_user_testing(
    event_data: schemas.TokenEventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verificar que el watcher asociado al evento pertenece al usuario actual
    crud.get_watcher_db(db, watcher_id=event_data.watcher_id, owner_id=current_user.id)
    return crud.create_event(db=db, event_data=event_data)

@app.get("/events/", response_model=List[schemas.TokenEventRead], tags=["Events"])
def list_all_events_for_current_user(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_all_events_for_owner(db, owner_id=current_user.id, skip=skip, limit=limit)

@app.get("/events/watcher/{watcher_id}", response_model=List[schemas.TokenEventRead], tags=["Events"])
def list_events_for_a_specific_watcher_of_current_user(
    watcher_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # crud.get_watcher_db verifica la propiedad y existencia del watcher
    crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
    return crud.get_events_for_watcher(db, watcher_id=watcher_id, owner_id=current_user.id, skip=skip, limit=limit)

@app.get("/events/{event_id}", response_model=schemas.TokenEventRead, tags=["Events"])
def get_single_event_for_current_user(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_event = crud.get_event_by_id(db, event_id=event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    # Verificar propiedad del watcher asociado al evento
    crud.get_watcher_db(db, watcher_id=db_event.watcher_id, owner_id=current_user.id)
    return db_event

# --- Transports CRUD (para gestión avanzada de múltiples transports por watcher) ---
@app.post("/watchers/{watcher_id}/transports/", response_model=schemas.TransportRead, status_code=status.HTTP_201_CREATED, tags=["Transports (Watcher-Specific)"])
def add_new_transport_to_watcher(
    watcher_id: int,
    transport_payload: schemas.TransportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Asegurarse que el watcher_id en el payload del transport coincida con el watcher_id del path
    # En tu crud.py, create_new_transport_for_watcher no usa transport_data.watcher_id,
    # sino que usa el watcher_id del path, lo cual está bien.
    # Esta validación aquí es una capa extra si quieres.
    # if transport_payload.watcher_id != watcher_id:
    #     raise HTTPException(status_code=400, detail="Watcher ID in path does not match watcher ID in transport payload.")
    return crud.create_new_transport_for_watcher(db=db, transport_data=transport_payload, watcher_id=watcher_id, owner_id=current_user.id)

@app.get("/watchers/{watcher_id}/transports/", response_model=List[schemas.TransportRead], tags=["Transports (Watcher-Specific)"])
def list_all_transports_for_specific_watcher(
    watcher_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # crud.get_watcher_db verifica la propiedad del watcher
    crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
    return crud.get_transports_for_watcher_owner_checked(db, watcher_id=watcher_id, owner_id=current_user.id, skip=skip, limit=limit)

@app.delete("/transports/{transport_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Transports (Global ID)"])
def delete_specific_transport_by_id(
    transport_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # crud.delete_transport_by_id verifica la propiedad del owner a través del watcher asociado
    crud.delete_transport_by_id(db=db, transport_id=transport_id, owner_id=current_user.id)
    return

# --- Token Volume Endpoint ---
@app.get("/tokens/{contract_address}/volume", response_model=schemas.TokenRead, tags=["Tokens"])
def read_token_total_volume(contract_address: str, db: Session = Depends(get_db)):
    # Validar formato de contract_address
    if not contract_address.startswith("0x") or len(contract_address) != 42:
        try: # Intentar convertir a checksum address si no lo es
            from web3 import Web3 # Importación local para evitar dependencia si no se usa
            contract_address = Web3.to_checksum_address(contract_address)
        except ImportError:
            print("WARN: web3 no instalado, no se pudo convertir a checksum address para /tokens/{contract_address}/volume")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract address format and web3 not available for checksum.")
        except Exception:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract address format.")

    volume = crud.get_volume(db, contract_address=contract_address)
    return schemas.TokenRead(contract=contract_address, volume=volume)