# api/app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import HttpUrl
import json

from fastapi.middleware.cors import CORSMiddleware

from .database import engine, get_db
from . import models, schemas, crud, auth

try:
    print("ℹ️ [DB_INIT] Intentando crear/verificar todas las tablas definidas en Base...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ [DB_INIT] Tablas verificadas/creadas con éxito.")
except Exception as e:
    print(f"❌ [DB_INIT_ERROR] No se pudieron crear/verificar las tablas: {e}")

app = FastAPI(
    title="TokenWatcher API",
    version="0.7.1",
    description="API para monitorizar transferencias de tokens ERC-20. Webhook es obligatorio al crear Watcher. Watchers pueden ser activados/desactivados."
)

allow_origin_regex = r"http://localhost(:\d+)?"
# origins_for_production = [
#     "https://tu-dashboard.onrender.com", # Ejemplo
# ]

app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins_for_production, # Descomenta y usa esto para producción
    allow_origin_regex=allow_origin_regex, # Para desarrollo local flexible
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

def _populate_watcher_read_from_db_watcher(db_watcher: models.Watcher, db: Session) -> schemas.WatcherRead:
    active_webhook_url: Optional[HttpUrl] = None
    if db_watcher.transports:
        first_transport = db_watcher.transports[0]
        config_data = first_transport.config
        if isinstance(config_data, str): # Fallback si config es string JSON
            try: config_data = json.loads(config_data)
            except json.JSONDecodeError: config_data = {}
        
        if isinstance(config_data, dict) and "url" in config_data:
            try: active_webhook_url = HttpUrl(config_data["url"])
            except Exception:
                active_webhook_url = None
                print(f"Warning: URL en config de Transport ID={first_transport.id} no es HttpUrl válida: {config_data.get('url')}")
    return schemas.WatcherRead(
        id=db_watcher.id, owner_id=db_watcher.owner_id, name=db_watcher.name,
        token_address=db_watcher.token_address, threshold=db_watcher.threshold,
        is_active=db_watcher.is_active, webhook_url=active_webhook_url,
        created_at=db_watcher.created_at, updated_at=db_watcher.updated_at
    )

@app.get("/health", tags=["System"])
def health_check(): return {"status": "ok", "message": "TokenWatcher API is healthy"}

@app.get("/", tags=["System"], include_in_schema=False)
def api_root_demo(): return {"message": "🎉 Welcome to TokenWatcher API v0.7.1! Visit /docs for API documentation."}

# --- Watchers CRUD ---
@app.post("/watchers/", response_model=schemas.WatcherRead, status_code=status.HTTP_201_CREATED, tags=["Watchers"])
def create_new_watcher_for_current_user(
    watcher_data: schemas.WatcherCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.create_watcher(db=db, watcher_data=watcher_data, owner_id=current_user.id)
    db.refresh(db_watcher, attribute_names=['transports']) # Eager load transports after creation
    return _populate_watcher_read_from_db_watcher(db_watcher, db)

@app.get("/watchers/", response_model=List[schemas.WatcherRead], tags=["Watchers"])
def list_watchers_for_current_user(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watchers = crud.get_watchers_for_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return [_populate_watcher_read_from_db_watcher(w, db) for w in db_watchers]

@app.get("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def get_single_watcher_for_current_user(
    watcher_id: int, db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
    # db.refresh(db_watcher, attribute_names=['transports']) # Ya se hace con selectinload en get_watcher_db
    return _populate_watcher_read_from_db_watcher(db_watcher, db)

@app.put("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def update_existing_watcher_for_current_user(
    watcher_id: int, watcher_update_data: schemas.WatcherUpdatePayload,
    db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.update_watcher(db=db, watcher_id=watcher_id, watcher_update_data=watcher_update_data, owner_id=current_user.id)
    db.refresh(db_watcher, attribute_names=['transports'])
    return _populate_watcher_read_from_db_watcher(db_watcher, db)

@app.delete("/watchers/{watcher_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Watchers"])
def delete_existing_watcher_for_current_user(
    watcher_id: int, db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.delete_watcher(db=db, watcher_id=watcher_id, owner_id=current_user.id)
    return

# --- Events CRUD ---
@app.post("/events/", response_model=schemas.TokenEventRead, status_code=status.HTTP_201_CREATED, tags=["Events"], include_in_schema=False)
def create_new_event_for_authed_user_testing(
    event_data: schemas.TokenEventCreate, db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.get_watcher_db(db, watcher_id=event_data.watcher_id, owner_id=current_user.id)
    created_event = crud.create_event(db=db, event_data=event_data)
    if not created_event: # Si crud.create_event devuelve el existente (y no es None)
        # Esta lógica es por si create_event se cambia para devolver None en algún caso de "no creación".
        # Con la lógica actual de crud.py (devuelve existente o el nuevo), esto no se activaría.
        # No obstante, si create_event lanzara una excepción que no queremos que llegue al cliente como 500, se manejaría aquí.
        # Por ahora, si devuelve el existente, el schema TokenEventRead debería poder manejarlo.
        # Si `create_event` puede devolver None y eso significa "no creado, no existente", se necesita otra respuesta.
        # Asumimos que `crud.create_event` o devuelve un evento (nuevo o existente) o lanza una excepción.
        pass # El evento fue un duplicado y ya se manejó en crud.create_event, devolviendo el existente.
             # O, si hubo un error no por duplicado, crud.create_event lanzó una excepción.
    return created_event


@app.get("/events/", response_model=schemas.PaginatedTokenEventResponse, tags=["Events"]) # <-- MODIFICADO response_model
def list_all_events_for_current_user(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    data = crud.get_all_events_for_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return schemas.PaginatedTokenEventResponse(total_events=data["total_events"], events=data["events"])

@app.get("/events/watcher/{watcher_id}", response_model=schemas.PaginatedTokenEventResponse, tags=["Events"]) # <-- MODIFICADO response_model
def list_events_for_a_specific_watcher_of_current_user(
    watcher_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    data = crud.get_events_for_watcher(db, watcher_id=watcher_id, owner_id=current_user.id, skip=skip, limit=limit)
    return schemas.PaginatedTokenEventResponse(total_events=data["total_events"], events=data["events"])

@app.get("/events/{event_id}", response_model=schemas.TokenEventRead, tags=["Events"])
def get_single_event_for_current_user(
    event_id: int, db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_event = crud.get_event_by_id(db, event_id=event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    crud.get_watcher_db(db, watcher_id=db_event.watcher_id, owner_id=current_user.id) # Verifica propiedad
    return db_event

# --- Transports CRUD ---
@app.post("/watchers/{watcher_id}/transports/", response_model=schemas.TransportRead, status_code=status.HTTP_201_CREATED, tags=["Transports (Watcher-Specific)"])
def add_new_transport_to_watcher(
    watcher_id: int, transport_payload: schemas.TransportCreate,
    db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)
):
    # La validación de que transport_payload.watcher_id == watcher_id se puede añadir aquí si se desea,
    # aunque crud.create_new_transport_for_watcher ya usa el watcher_id del path.
    if transport_payload.watcher_id != watcher_id:
         raise HTTPException(status_code=400, detail="Watcher ID in path does not match watcher ID in transport payload.")
    return crud.create_new_transport_for_watcher(db=db, transport_data=transport_payload, watcher_id=watcher_id, owner_id=current_user.id)

@app.get("/watchers/{watcher_id}/transports/", response_model=List[schemas.TransportRead], tags=["Transports (Watcher-Specific)"])
def list_all_transports_for_specific_watcher(
    watcher_id: int, skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)
):
    crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id) # Verifica propiedad
    return crud.get_transports_for_watcher_owner_checked(db, watcher_id=watcher_id, owner_id=current_user.id, skip=skip, limit=limit)

@app.delete("/transports/{transport_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Transports (Global ID)"])
def delete_specific_transport_by_id(
    transport_id: int, db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.delete_transport_by_id(db=db, transport_id=transport_id, owner_id=current_user.id)
    return

# --- Token Volume Endpoint ---
@app.get("/tokens/{contract_address}/volume", response_model=schemas.TokenRead, tags=["Tokens"])
def read_token_total_volume(contract_address: str, db: Session = Depends(get_db)):
    if not contract_address.startswith("0x") or len(contract_address) != 42:
        try:
            from web3 import Web3
            contract_address = Web3.to_checksum_address(contract_address)
        except ImportError:
            print("WARN: web3 no instalado, no se pudo convertir a checksum address para /tokens/{contract_address}/volume")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract address format and web3 not available for checksum.")
        except Exception:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract address format.")
    volume = crud.get_volume(db, contract_address=contract_address)
    return schemas.TokenRead(contract=contract_address, volume=volume)