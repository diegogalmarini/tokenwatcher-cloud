# api/app/main.py

from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import HttpUrl
import json
from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware

from .database import engine, get_db
from . import models, schemas, crud, auth
from .config import settings
from .clients import coingecko_client # Importamos nuestro nuevo cliente

# --- Inicializa tablas ---
try:
    print("ℹ️ [DB_INIT] Intentando crear/verificar todas las tablas definidas en Base...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ [DB_INIT] Tablas verificadas/creadas con éxito.")
except Exception as e:
    print(f"❌ [DB_INIT_ERROR] No se pudieron crear/verificar las tablas: {e}")

app = FastAPI(
    title="TokenWatcher API",
    version="0.8.0", # Incrementamos versión por nueva funcionalidad
    description="API para monitorizar transferencias de tokens ERC-20, con filtrado y ordenación de eventos."
)

origins = [
    "https://tokenwatcher.app",
    "https://www.tokenwatcher.app",
    "https://tokenwatcher-frontend.onrender.com",
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INCLUIR ROUTER /auth ---
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# --- BLOQUE DE DEPURACIÓN PARA VER RUTAS REGISTRADAS ---
@app.on_event("startup")
def on_startup():
    print("--- Rutas Registradas en la API ---")
    for route in app.routes:
        if hasattr(route, "methods"):
            print(f"Path: {route.path}, Methods: {route.methods}, Name: {route.name}")
    print("------------------------------------")
# --- FIN DEL BLOQUE DE DEPURACIÓN ---

def _populate_watcher_read_from_db_watcher(db_watcher: models.Watcher, db: Session) -> schemas.WatcherRead:
    active_webhook_url: Optional[HttpUrl] = None
    if db_watcher.transports:
        first_transport = db_watcher.transports[0]
        config_data = first_transport.config
        if isinstance(config_data, str):
            try:
                config_data = json.loads(config_data)
            except json.JSONDecodeError:
                config_data = {}
        if isinstance(config_data, dict) and "url" in config_data:
            try:
                active_webhook_url = HttpUrl(config_data["url"])
            except Exception:
                active_webhook_url = None

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


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "message": "TokenWatcher API is healthy"}


@app.get("/", tags=["System"], include_in_schema=False)
def api_root_demo():
    return {"message": "🎉 Welcome to TokenWatcher API! Visit /docs for API documentation."}


# --- Watchers CRUD ---
@app.post("/watchers/", response_model=schemas.WatcherRead, status_code=status.HTTP_201_CREATED, tags=["Watchers"])
def create_new_watcher_for_current_user(
    watcher_data: schemas.WatcherCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # --- VALIDACIÓN DE LÍMITE DE WATCHERS ---
    if not current_user.is_admin:
        watcher_count = crud.count_watchers_for_owner(db, owner_id=current_user.id)
        if watcher_count >= current_user.watcher_limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Watcher limit reached. You can create a maximum of {current_user.watcher_limit} watchers."
            )

    # --- NUEVA VALIDACIÓN DE UMBRAL INTELIGENTE ---
    if not current_user.is_admin:
        market_data = coingecko_client.get_token_market_data(watcher_data.token_address)
        if market_data and market_data.get("total_volume_24h", 0) > 0:
            min_relative_threshold = market_data["total_volume_24h"] * settings.MINIMUM_THRESHOLD_VOLUME_PERCENT
            effective_min_threshold = max(settings.MINIMUM_WATCHER_THRESHOLD_USD, min_relative_threshold)
            
            if watcher_data.threshold < effective_min_threshold:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Threshold is too low. For this token, the minimum allowed threshold is ${effective_min_threshold:,.2f} USD."
                )
        else:
            # Si CoinGecko falla o no hay volumen, aplicamos solo el mínimo absoluto como salvaguarda
            if watcher_data.threshold < settings.MINIMUM_WATCHER_THRESHOLD_USD:
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Threshold must be at least ${settings.MINIMUM_WATCHER_THRESHOLD_USD:,.2f} USD."
                )

    db_watcher = crud.create_watcher(db=db, watcher_data=watcher_data, owner_id=current_user.id)
    db.refresh(db_watcher, attribute_names=['transports'])
    return _populate_watcher_read_from_db_watcher(db_watcher, db)


@app.get("/watchers/", response_model=List[schemas.WatcherRead], tags=["Watchers"])
def list_watchers_for_current_user(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watchers = crud.get_watchers_for_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return [_populate_watcher_read_from_db_watcher(w, db) for w in db_watchers]


@app.get("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def get_single_watcher_for_current_user(
    watcher_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
    return _populate_watcher_read_from_db_watcher(db_watcher, db)


@app.put("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def update_existing_watcher_for_current_user(
    watcher_id: int, 
    watcher_update_data: schemas.WatcherUpdatePayload,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.update_watcher(
        db=db, watcher_id=watcher_id, watcher_update_data=watcher_update_data, owner_id=current_user.id
    )
    db.refresh(db_watcher, attribute_names=['transports'])
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
    created_event = crud.create_event(db=db, event_data=event_data)
    return created_event


@app.get("/events/", response_model=schemas.PaginatedTokenEventResponse, tags=["Events"])
def list_all_events_for_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    skip: int = Query(0, ge=0, description="Número de eventos a saltar"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de eventos a devolver"),
    watcher_id: Optional[int] = Query(None, description="Filter events by a specific watcher ID"),
    token_address: Optional[str] = Query(None, description="Filter by token contract address (partial match)"),
    token_symbol: Optional[str] = Query(None, description="Filter by token symbol (partial match, case-insensitive)"),
    start_date: Optional[datetime] = Query(None, description="Fecha de inicio (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="Fecha de fin (ISO format)"),
    from_address: Optional[str] = Query(None, description="Filtrar por dirección de origen (exacta, case-insensitive)"),
    to_address: Optional[str] = Query(None, description="Filtrar por dirección de destino (exacta, case-insensitive)"),
    min_usd_value: Optional[float] = Query(None, ge=0, description="Filtrar por valor USD mínimo"),
    max_usd_value: Optional[float] = Query(None, ge=0, description="Filter by maximum USD value"),
    sort_by: Optional[str] = Query("created_at", description="Ordenar por: created_at, amount, usd_value, block_number"),
    sort_order: Optional[str] = Query("desc", description="Orden: asc o desc"),
    active_watchers_only: Optional[bool] = Query(False, description="Filter events by currently active watchers only")
):
    allowed_sort_by = ["created_at", "amount", "usd_value", "block_number"]
    if sort_by is not None and sort_by not in allowed_sort_by:
        raise HTTPException(status_code=400, detail=f"Invalid 'sort_by' value. Use one of: {', '.join(allowed_sort_by)}")
    if sort_order is not None and sort_order.lower() not in ["asc", "desc"]:
        raise HTTPException(status_code=400, detail="Invalid 'sort_order' value. Use 'asc' o 'desc'.")

    data = crud.get_all_events_for_owner(
        db=db,
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
        watcher_id=watcher_id,
        token_address=token_address,
        token_symbol=token_symbol,
        start_date=start_date,
        end_date=end_date,
        from_address=from_address,
        to_address=to_address,
        min_usd_value=min_usd_value,
        max_usd_value=max_usd_value,
        sort_by=sort_by,
        sort_order=sort_order,
        active_watchers_only=active_watchers_only
    )
    return schemas.PaginatedTokenEventResponse(total_events=data["total_events"], events=data["events"])


@app.get("/events/distinct-token-symbols/", response_model=List[str], tags=["Events"])
def list_distinct_token_symbols_for_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    symbols = crud.get_distinct_token_symbols_for_owner(db=db, owner_id=current_user.id)
    return symbols


@app.get("/events/watcher/{watcher_id}", response_model=schemas.PaginatedTokenEventResponse, tags=["Events"])
def list_events_for_a_specific_watcher_of_current_user(
    watcher_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    data = crud.get_events_for_watcher(db, watcher_id=watcher_id, owner_id=current_user.id, skip=skip, limit=limit)
    return schemas.PaginatedTokenEventResponse(total_events=data["total_events"], events=data["events"])


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


# --- Transports CRUD ---
@app.post("/watchers/{watcher_id}/transports/", response_model=schemas.TransportRead, status_code=status.HTTP_201_CREATED, tags=["Transports (Watcher-Specific)"])
def add_new_transport_to_watcher(
    watcher_id: int, 
    transport_payload: schemas.TransportCreate,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if transport_payload.watcher_id != watcher_id:
        raise HTTPException(status_code=400, detail="Watcher ID in path does not match watcher ID in transport payload.")
    return crud.create_new_transport_for_watcher(db=db, transport_data=transport_payload, watcher_id=watcher_id, owner_id=current_user.id)

@app.get("/watchers/{watcher_id}/transports/", response_model=List[schemas.TransportRead], tags=["Transports (Watcher-Specific)"])
def list_all_transports_for_specific_watcher(
    watcher_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
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
        try:
            from web3 import Web3
            contract_address = Web3.to_checksum_address(contract_address)
        except ImportError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract address format and web3 not available for checksum.")
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract address format.")
    volume = crud.get_volume(db, contract_address=contract_address)
    return schemas.TokenRead(contract=contract_address, volume=volume)