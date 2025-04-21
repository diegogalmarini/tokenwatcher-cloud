# api/app/main.py

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from fastapi_utils.tasks import repeat_every

from . import crud, models, schemas, watcher
from .config import SessionLocal, engine, settings

# crea tablas si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TokenWatcher API",
    version="0.4.0",
    description="CRUD Watchers, Events, Transports + polling y notificaciones"
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# — Health & Demo —
@app.get("/health", tags=["Demo"])
def health():
    return {"status": "ok"}

@app.get("/demo", tags=["Demo"])
def demo():
    return {"message": "🎉 TokenWatcher API funcionando"}

# — Watchers CRUD —
@app.post("/watchers/", response_model=schemas.WatcherRead, tags=["Watchers"])
def create_watcher(w: schemas.WatcherCreate, db: Session = Depends(get_db)):
    return crud.create_watcher(db, w)

@app.get("/watchers/", response_model=List[schemas.WatcherRead], tags=["Watchers"])
def list_watchers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_watchers(db, skip=skip, limit=limit)

@app.get("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def get_watcher(watcher_id: int, db: Session = Depends(get_db)):
    w = crud.get_watcher(db, watcher_id)
    if not w:
        raise HTTPException(404, "Watcher no encontrado")
    return w

@app.put("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def update_watcher(watcher_id: int, data: schemas.WatcherCreate, db: Session = Depends(get_db)):
    w = crud.update_watcher(db, watcher_id, data)
    if not w:
        raise HTTPException(404, "Watcher no encontrado")
    return w

@app.delete("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def delete_watcher(watcher_id: int, db: Session = Depends(get_db)):
    w = crud.delete_watcher(db, watcher_id)
    if not w:
        raise HTTPException(404, "Watcher no encontrado")
    return w

# — Events CRUD —
@app.post("/events/", response_model=schemas.TokenEventRead, tags=["Events"])
def create_event(e: schemas.TokenEventCreate, db: Session = Depends(get_db)):
    if not crud.get_watcher(db, e.watcher_id):
        raise HTTPException(404, "Watcher no encontrado")
    return crud.create_event(db, e)

@app.get("/events/", response_model=List[schemas.TokenEventRead], tags=["Events"])
def list_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_events(db, skip=skip, limit=limit)

@app.get("/events/{watcher_id}", response_model=List[schemas.TokenEventRead], tags=["Events"])
def list_events_for_watcher(watcher_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    if not crud.get_watcher(db, watcher_id):
        raise HTTPException(404, "Watcher no encontrado")
    return crud.get_events_for_watcher(db, watcher_id, skip=skip, limit=limit)

# — Transports CRUD —
@app.post("/transports/", response_model=schemas.TransportRead, tags=["Transports"])
def create_transport(t: schemas.TransportCreate, db: Session = Depends(get_db)):
    if not crud.get_watcher(db, t.watcher_id):
        raise HTTPException(404, "Watcher no encontrado")
    return crud.create_transport(db, t)

@app.get("/transports/", response_model=List[schemas.TransportRead], tags=["Transports"])
def list_transports(watcher_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_transports(db, watcher_id, skip, limit)

@app.delete("/transports/{transport_id}", response_model=schemas.TransportRead, tags=["Transports"])
def delete_transport(transport_id: int, db: Session = Depends(get_db)):
    t = crud.delete_transport(db, transport_id)
    if not t:
        raise HTTPException(404, "Transport no encontrado")
    return t

# — Volumen total de tokens para un contrato (nuevo) —
@app.get("/tokens/{contract_address}", response_model=schemas.TokenRead, tags=["Tokens"])
def read_token_volume(contract_address: str, db: Session = Depends(get_db)):
    volume = crud.get_volume(db, contract_address)
    return {"contract": contract_address, "volume": volume}

# — Polling + notificaciones —
@app.on_event("startup")
@repeat_every(seconds=settings.POLL_INTERVAL, wait_first=True)
def periodic_poll():
    db = SessionLocal()
    try:
        watcher.poll_and_notify(
            db=db,
            create_event=lambda data: crud.create_event(db, schemas.TokenEventCreate(**data)),
            get_watchers=lambda: crud.get_watchers(db)
        )
    finally:
        db.close()
