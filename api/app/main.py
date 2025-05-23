# api/app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import HttpUrl 

from .database import engine, get_db # SessionLocal no se usa directamente aquí
from . import models, schemas, crud, auth
# from .config import settings # No se usa settings directamente en este archivo

# Crea las tablas si no existen
try:
    print("ℹ️ [DB_INIT] Intentando crear/verificar todas las tablas definidas en Base...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ [DB_INIT] Tablas verificadas/creadas con éxito.")
except Exception as e:
    print(f"❌ [DB_INIT_ERROR] No se pudieron crear/verificar las tablas: {e}")

app = FastAPI(
    title="TokenWatcher API",
    version="0.7.0", # Versión con CRUD completo y lógica de Transport/is_active
    description="API para monitorizar transferencias de tokens ERC-20. Webhook es obligatorio al crear Watcher. Watchers pueden ser activados/desactivados."
)

# --- Configuración de CORS ---
# Esto DEBERÍA estar aquí, como lo discutimos para el error "Failed to fetch".
# Si lo eliminaste, por favor, vuelve a añadirlo.
from fastapi.middleware.cors import CORSMiddleware
origins = [
    "http://localhost:3000", # Frontend Next.js en desarrollo
    # "https://tu-frontend-desplegado.com", # URL de producción de tu frontend
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- Fin de Configuración de CORS ---

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# --- Funciones Auxiliares ---
def _populate_watcher_read_from_db_watcher(db_watcher: models.Watcher, db: Session) -> schemas.WatcherRead:
    active_webhook_url: Optional[HttpUrl] = None
    # Obtener el primer transport "principal".
    # El crud.get_active_watchers y get_watchers_for_owner ya hacen selectinload de transports.
    if db_watcher.transports: # Accede a la relación ya cargada
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
    return {"message": "🎉 Welcome to TokenWatcher API v0.7.0! Visit /docs for API documentation."}

# --- Watchers CRUD ---
@app.post("/watchers/", response_model=schemas.WatcherRead, status_code=status.HTTP_201_CREATED, tags=["Watchers"])
def create_new_watcher_for_current_user(
    watcher_data: schemas.WatcherCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.create_watcher(db=db, watcher_data=watcher_data, owner_id=current_user.id)
    # Refrescar para obtener la relación 'transports' si no se cargó o para asegurar datos post-commit.
    # O confiar en que _populate_watcher_read_from_db_watcher la cargue si es lazy.
    # La función _populate_watcher_read_from_db_watcher ahora accede a db_watcher.transports directamente.
    # Es crucial que la sesión de SQLAlchemy pueda cargar esta relación.
    # Si `create_watcher` no refresca la relación `transports`, puede que necesitemos hacerlo aquí
    # o asegurar que `selectinload` se use al re-obtener el `db_watcher` si es necesario.
    # Por ahora, asumimos que `db.refresh(db_watcher)` en crud es suficiente para el objeto en sí
    # y la relación `transports` se accederá (y cargará si es lazy) en `_populate_watcher_read_from_db_watcher`.
    # Para estar seguros, y dado que `crud.create_watcher` hace commit y refresh solo sobre db_watcher,
    # vamos a recargar el watcher con sus transports para la respuesta.
    db.refresh(db_watcher, attribute_names=['transports']) # Específicamente refrescar/cargar transports
    return _populate_watcher_read_from_db_watcher(db_watcher, db)

@app.get("/watchers/", response_model=List[schemas.WatcherRead], tags=["Watchers"])
def list_watchers_for_current_user(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # crud.get_watchers_for_owner ya usa selectinload para transports
    db_watchers = crud.get_watchers_for_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return [_populate_watcher_read_from_db_watcher(w, db) for w in db_watchers]

@app.get("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def get_single_watcher_for_current_user(
    watcher_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # get_watcher_db no usa selectinload por defecto, pero _populate lo manejará.
    # Si queremos optimizar, get_watcher_db podría aceptar una opción para eager load.
    db_watcher = crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
    db.refresh(db_watcher, attribute_names=['transports']) # Asegurar que transports está cargado
    return _populate_watcher_read_from_db_watcher(db_watcher, db)

@app.put("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def update_existing_watcher_for_current_user(
    watcher_id: int, 
    watcher_update_data: schemas.WatcherUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.update_watcher(db=db, watcher_id=watcher_id, watcher_update_data=watcher_update_data, owner_id=current_user.id)
    db.refresh(db_watcher, attribute_names=['transports']) # Asegurar que transports está cargado/refrescado
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
    if transport_payload.watcher_id != watcher_id:
        raise HTTPException(status_code=400, detail="Watcher ID in path does not match watcher ID in payload.")
    return crud.create_new_transport_for_watcher(db=db, transport_data=transport_payload, watcher_id=watcher_id, owner_id=current_user.id)

@app.get("/watchers/{watcher_id}/transports/", response_model=List[schemas.TransportRead], tags=["Transports (Watcher-Specific)"])
def list_all_transports_for_specific_watcher(
    watcher_id: int,
    skip: int = 0, # Añadido skip y limit
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
    # Asumimos que crud.get_transports_for_watcher_owner_checked puede tomar skip/limit
    # Si no, crud.get_transports_for_watcher lo haría. La última versión de crud.py tiene
    # get_transports_for_watcher_owner_checked(..., skip, limit)
    return crud.get_transports_for_watcher_owner_checked(db, watcher_id=watcher_id, owner_id=current_user.id, skip=skip, limit=limit)

@app.delete("/transports/{transport_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Transports (Global ID)"])
def delete_specific_transport_by_id(
    transport_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.delete_transport_by_id(db=db, transport_id=transport_id, owner_id=current_user.id)
    return

# --- Token Volume Endpoint ---
@app.get("/tokens/{contract_address}/volume", response_model=schemas.TokenRead, tags=["Tokens"])
def read_token_total_volume(contract_address: str, db: Session = Depends(get_db)):
    if not contract_address.startswith("0x") or len(contract_address) != 42:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract address format.")
    volume = crud.get_volume(db, contract_address=contract_address)
    return schemas.TokenRead(contract=contract_address, volume=volume)