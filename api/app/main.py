# api/app/main.py

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import engine, SessionLocal, get_db
from . import models, schemas, crud

# Crea las tablas si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- Watcher Endpoints ---

@app.get("/watchers", response_model=list[schemas.WatcherRead])
def read_watchers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_watchers(db, skip=skip, limit=limit)

@app.post("/watchers", response_model=schemas.WatcherRead)
def create_watcher_endpoint(watcher: schemas.WatcherCreate, db: Session = Depends(get_db)):
    return crud.create_watcher(db, watcher)

@app.get("/watchers/{watcher_id}", response_model=schemas.WatcherRead)
def read_watcher(watcher_id: int, db: Session = Depends(get_db)):
    db_w = crud.get_watcher(db, watcher_id)
    if not db_w:
        raise HTTPException(status_code=404, detail="Watcher not found")
    return db_w

@app.put("/watchers/{watcher_id}", response_model=schemas.WatcherRead)
def update_watcher_endpoint(
    watcher_id: int, watcher: schemas.WatcherUpdate, db: Session = Depends(get_db)
):
    return crud.update_watcher(db, watcher_id, watcher)

@app.delete("/watchers/{watcher_id}", response_model=None)
def delete_watcher_endpoint(watcher_id: int, db: Session = Depends(get_db)):
    crud.delete_watcher(db, watcher_id)
    return

# --- Event Endpoints ---

@app.get("/events", response_model=list[schemas.TokenEventRead])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_events(db, skip=skip, limit=limit)

@app.post("/events", response_model=schemas.TokenEventRead)
def create_event_endpoint(event: schemas.TokenEventCreate, db: Session = Depends(get_db)):
    return crud.create_event(db, event)
