# api/app/main.py
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

# CAMBIO: Importar engine, SessionLocal, get_db desde .database
from .database import engine, SessionLocal, get_db
from . import models, schemas, crud, auth, watcher # watcher añadido para la tarea periódica si se usa
from .config import settings # settings sigue viniendo de config.py

# Crea las tablas si no existen
try:
    models.Base.metadata.create_all(bind=engine) # models.Base ahora viene indirectamente de database.Base
    print("✅ [DB_INIT] Tables (including TokenVolume if new) checked/created successfully.")
except Exception as e:
    print(f"❌ [DB_INIT_ERROR] Could not create/check tables: {e}")

app = FastAPI(
    title="TokenWatcher API",
    version="0.4.2", # Incrementar versión
    description="API para monitorizar transferencias de tokens ERC-20 y enviar notificaciones."
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])

# --- Health & System Endpoints ---
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "message": "TokenWatcher API is healthy"}

@app.get("/", tags=["System"], include_in_schema=False)
def api_root_demo():
    return {"message": "🎉 Welcome to TokenWatcher API! Visit /docs for API documentation."}

# --- Watchers CRUD ---
@app.post("/watchers/", response_model=schemas.WatcherRead, status_code=201, tags=["Watchers"])
def create_new_watcher(watcher_data: schemas.WatcherCreate, db: Session = Depends(get_db)):
    return crud.create_watcher(db=db, watcher=watcher_data)

@app.get("/watchers/", response_model=List[schemas.WatcherRead], tags=["Watchers"])
def list_all_watchers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_watchers(db, skip=skip, limit=limit)

@app.get("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def get_single_watcher(watcher_id: int, db: Session = Depends(get_db)):
    db_watcher = crud.get_watcher(db, watcher_id=watcher_id)
    if db_watcher is None:
        raise HTTPException(status_code=404, detail="Watcher not found")
    return db_watcher

@app.put("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def update_existing_watcher(watcher_id: int, watcher_update_data: schemas.WatcherUpdate, db: Session = Depends(get_db)):
    updated_watcher = crud.update_watcher(db=db, watcher_id=watcher_id, watcher_update=watcher_update_data)
    if updated_watcher is None:
        raise HTTPException(status_code=404, detail="Watcher not found for update")
    return updated_watcher

@app.delete("/watchers/{watcher_id}", status_code=204, tags=["Watchers"])
def delete_existing_watcher(watcher_id: int, db: Session = Depends(get_db)):
    deleted_watcher = crud.delete_watcher(db=db, watcher_id=watcher_id)
    if deleted_watcher is None:
        raise HTTPException(status_code=404, detail="Watcher not found for deletion")
    return

# --- Events CRUD ---
@app.post("/events/", response_model=schemas.TokenEventRead, status_code=201, tags=["Events"], include_in_schema=False)
def create_new_event(event_data: schemas.TokenEventCreate, db: Session = Depends(get_db)):
    db_watcher = crud.get_watcher(db, watcher_id=event_data.watcher_id)
    if db_watcher is None:
        raise HTTPException(status_code=404, detail=f"Watcher with id {event_data.watcher_id} not found, cannot create event.")
    return crud.create_event(db=db, event_data=event_data)

@app.get("/events/", response_model=List[schemas.TokenEventRead], tags=["Events"])
def list_all_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_events(db, skip=skip, limit=limit)

@app.get("/events/watcher/{watcher_id}", response_model=List[schemas.TokenEventRead], tags=["Events"])
def list_events_for_a_watcher(watcher_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_watcher = crud.get_watcher(db, watcher_id=watcher_id)
    if db_watcher is None:
        raise HTTPException(status_code=404, detail="Watcher not found, cannot retrieve events.")
    return crud.get_events_for_watcher(db, watcher_id=watcher_id, skip=skip, limit=limit)

# --- Transports CRUD ---
@app.post("/transports/", response_model=schemas.TransportRead, status_code=201, tags=["Transports"])
def create_new_transport(transport_data: schemas.TransportCreate, db: Session = Depends(get_db)):
    return crud.create_transport(db=db, transport=transport_data)

@app.get("/transports/", response_model=List[schemas.TransportRead], tags=["Transports"])
def list_all_transports(watcher_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_transports(db, watcher_id=watcher_id, skip=skip, limit=limit)

@app.delete("/transports/{transport_id}", status_code=204, tags=["Transports"])
def delete_existing_transport(transport_id: int, db: Session = Depends(get_db)):
    deleted_transport = crud.delete_transport(db=db, transport_id=transport_id)
    if deleted_transport is None:
        raise HTTPException(status_code=404, detail="Transport not found for deletion")
    return

# --- Token Volume Endpoint ---
# Ajustado para la nueva funcionalidad de TokenVolume si la mantienes.
# Si get_volume en crud.py no usa TokenVolume, esto puede cambiar.
@app.get("/tokens/{contract_address}/volume", response_model=schemas.TokenRead, tags=["Tokens"])
def read_token_total_volume(contract_address: str, db: Session = Depends(get_db)):
    if not contract_address.startswith("0x") or len(contract_address) != 42:
        raise HTTPException(status_code=400, detail="Invalid contract address format.")
    
    # Si quieres usar la tabla TokenVolume:
    # token_volume_entry = db.query(models.TokenVolume).filter(models.TokenVolume.contract == contract_address).first()
    # volume = token_volume_entry.volume if token_volume_entry else 0.0
    # Si quieres usar la función de agregación get_volume:
    volume = crud.get_volume(db, contract_address=contract_address) # crud.get_volume calcula, no lee de TokenVolume
    return schemas.TokenRead(contract=contract_address, volume=volume)


# Considera si necesitas el polling en segundo plano aquí si ya tienes el cron job `PollWatchers`.
# from fastapi_utils.tasks import repeat_every

# @app.on_event("startup")
# @repeat_every(seconds=settings.POLL_INTERVAL, wait_first=True, logger=None)
# def periodic_background_poll() -> None:
#     print(f"⏰ [BG_TASK] Starting periodic_background_poll (every {settings.POLL_INTERVAL}s)")
#     db = SessionLocal() # Usa la SessionLocal de database.py
#     try:
#         get_watchers_with_session = lambda: crud.get_watchers(db)
#         create_event_with_session = lambda data_dict: crud.create_event(db, schemas.TokenEventCreate(**data_dict))
#         watcher.poll_and_notify(
#             db=db,
#             get_watchers_func=get_watchers_with_session,
#             create_event_func=create_event_with_session
#         )
#     except Exception as e:
#         print(f"❌ [BG_TASK_ERROR] Error in periodic_background_poll: {e!r}")
#     finally:
#         db.close()
#         print(f"⏰ [BG_TASK] Finished periodic_background_poll cycle. DB session closed.")