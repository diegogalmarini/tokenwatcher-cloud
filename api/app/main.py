# api/app/main.py

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import HttpUrl
import json
from datetime import datetime, timezone

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .rate_limiter import limiter 

from fastapi.middleware.cors import CORSMiddleware

from .database import engine, get_db
from . import models, schemas, crud, auth, email_utils, notifier
from .config import settings
from .clients import coingecko_client

try:
    print("ℹ️ [DB_INIT] Intentando crear/verificar todas las tablas definidas en Base...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ [DB_INIT] Tablas verificadas/creadas con éxito.")
except Exception as e:
    print(f"❌ [DB_INIT_ERROR] No se pudieron crear/verificar las tablas: {e}")

app = FastAPI(
    title="TokenWatcher API",
    version="0.9.9",
    description="API para monitorizar transferencias de tokens ERC-20, con seguridad mejorada y notificaciones por email/telegram."
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

app.include_router(auth.router, prefix="/auth")

contact_router = APIRouter()

@contact_router.post("/contact", status_code=status.HTTP_200_OK)
@limiter.limit("10/hour")
def submit_contact_form(request: Request, form_data: schemas.ContactFormRequest):
    success = email_utils.send_contact_form_email(form_data=form_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not send the message. Please try again later.",
        )
    return {"detail": "Message sent successfully"}

app.include_router(contact_router, prefix="/api", tags=["Contact"])


# --- RUTA PÚBLICA PARA OBTENER PLANES ACTIVOS ---
@app.get("/api/plans/", response_model=List[schemas.PlanRead], tags=["Plans"])
def get_public_active_plans(
    db: Session = Depends(get_db)
):
    """
    Public endpoint for any visitor or user to see available, active subscription plans.
    No authentication required.
    """
    return crud.get_active_plans(db=db)


# --- RUTA PARA QUE EL USUARIO CAMBIE SU PROPIO PLAN ---
@app.patch("/users/me/plan", response_model=schemas.UserRead, tags=["User Management"])
def change_current_user_plan(
    plan_update: schemas.PlanChangeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    updated_user = crud.update_user_plan(db, user=current_user, new_plan_id=plan_update.plan_id)
    return updated_user

# --- Router de Administrador Unificado ---
admin_router = APIRouter(prefix="/admin", tags=["Admin"])

# --- Rutas de Planes (PARA ADMIN) ---
@admin_router.post("/plans/", response_model=schemas.PlanRead, status_code=status.HTTP_201_CREATED)
def create_new_plan(
    plan_data: schemas.PlanCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    return crud.create_plan(db=db, plan=plan_data)

@admin_router.get("/plans/", response_model=List[schemas.PlanRead])
def get_all_plans_for_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    return crud.get_plans(db=db, skip=skip, limit=limit)

@admin_router.put("/plans/{plan_id}", response_model=schemas.PlanRead)
def update_existing_plan(
    plan_id: int,
    plan_data: schemas.PlanUpdatePayload,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    updated_plan = crud.update_plan(db, plan_id, plan_data)
    if not updated_plan:
        raise HTTPException(status_code=404, detail=f"Plan with id {plan_id} not found")
    return updated_plan

@admin_router.delete("/plans/{plan_id}", status_code=status.HTTP_200_OK)
def delete_existing_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    deleted_plan = crud.delete_plan(db, plan_id)
    if not deleted_plan:
        raise HTTPException(status_code=404, detail=f"Plan with id {plan_id} not found")
    return {"detail": f"Plan '{deleted_plan.name}' deleted successfully."}


# --- Rutas de Usuarios ---
@admin_router.get("/users", response_model=List[schemas.UserRead])
def read_all_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@admin_router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    deleted_user = crud.delete_user_by_id(db=db, user_id=user_id)
    if not deleted_user:
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
    
    return {"detail": f"User {deleted_user.email} and all associated data deleted successfully."}

@admin_router.patch("/users/{user_id}", response_model=schemas.UserRead)
def update_user_as_admin(
    user_id: int, 
    user_update: schemas.UserUpdateAdmin, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(auth.get_current_admin_user)
):
    updated_user = crud.update_user_admin(db, user_id=user_id, user_update_data=user_update)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404, detail=f"User with id {user_id} not found")
        
    return updated_user

app.include_router(admin_router)


# --- Resto de las rutas de la aplicación (sin cambios) ---

def _populate_watcher_read_from_db_watcher(db_watcher: models.Watcher) -> schemas.WatcherRead:
    return schemas.WatcherRead.from_orm(db_watcher)

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "message": "TokenWatcher API is healthy"}

@app.get("/", tags=["System"], include_in_schema=False)
def api_root_demo():
    return {"message": "🎉 Welcome to TokenWatcher API! Visit /docs for API documentation."}

@app.get("/tokens/info/{contract_address}", response_model=schemas.TokenInfo, tags=["Tokens"])
@limiter.limit("30/minute")
def get_token_info(request: Request, contract_address: str, current_user: models.User = Depends(auth.get_current_user)):
    market_data = coingecko_client.get_token_market_data(contract_address)
    if not market_data:
        raise HTTPException(status_code=404, detail="Could not fetch market data for this token address.")

    suggested_threshold = market_data["total_volume_24h"] * settings.SUGGESTED_THRESHOLD_VOLUME_PERCENT
    min_relative = market_data["total_volume_24h"] * settings.MINIMUM_THRESHOLD_VOLUME_PERCENT
    minimum_threshold = max(settings.MINIMUM_WATCHER_THRESHOLD_USD, min_relative)

    return schemas.TokenInfo(
        price=market_data["price"],
        market_cap=market_data["market_cap"],
        total_volume_24h=market_data["total_volume_24h"],
        suggested_threshold=suggested_threshold,
        minimum_threshold=minimum_threshold
    )

@app.post("/watchers/", response_model=schemas.WatcherRead, status_code=status.HTTP_201_CREATED, tags=["Watchers"])
def create_new_watcher_for_current_user(
    watcher_data: schemas.WatcherCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.is_admin:
        watcher_count = crud.count_watchers_for_owner(db, owner_id=current_user.id)
        if watcher_count >= current_user.watcher_limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Watcher limit reached. You can create a maximum of {current_user.watcher_limit} watchers."
            )
        
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
            if watcher_data.threshold < settings.MINIMUM_WATCHER_THRESHOLD_USD:
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Threshold must be at least ${settings.MINIMUM_WATCHER_THRESHOLD_USD:,.2f} USD."
                )

    db_watcher = crud.create_watcher(db=db, watcher_data=watcher_data, owner_id=current_user.id)
    
    if watcher_data.send_test_notification:
        db.refresh(db_watcher, attribute_names=['transports'])
        test_event = schemas.TokenEventRead.from_orm(
            models.TokenEvent(
                id=0, watcher_id=db_watcher.id, token_address_observed=db_watcher.token_address,
                from_address="0xFROM_ADDRESS_HERE", to_address="0xTO_ADDRESS_HERE",
                amount=12345.67, transaction_hash="0x0000000000000000000000000000000000000000000000000000000000000000",
                block_number=12345678, usd_value=(12345.67 * 1.05), token_name="Test Token", token_symbol="TEST",
                created_at=datetime.now(timezone.utc)
            )
        )
        notifier.send_notifications_for_event_batch(watcher_obj=db_watcher, events_list=[test_event])

    return _populate_watcher_read_from_db_watcher(db_watcher)

@app.get("/watchers/", response_model=List[schemas.WatcherRead], tags=["Watchers"])
def list_watchers_for_current_user(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watchers = crud.get_watchers_for_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return [_populate_watcher_read_from_db_watcher(w) for w in db_watchers]

@app.get("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def get_single_watcher_for_current_user(
    watcher_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
    return _populate_watcher_read_from_db_watcher(db_watcher)

@app.put("/watchers/{watcher_id}", response_model=schemas.WatcherRead, tags=["Watchers"])
def update_existing_watcher_for_current_user(
    watcher_id: int, 
    watcher_update_data: schemas.WatcherUpdatePayload,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.is_admin and watcher_update_data.threshold is not None:
        existing_watcher = crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
        token_address_for_validation = existing_watcher.token_address
        
        market_data = coingecko_client.get_token_market_data(token_address_for_validation)
        if market_data and market_data.get("total_volume_24h", 0) > 0:
            min_relative_threshold = market_data["total_volume_24h"] * settings.MINIMUM_THRESHOLD_VOLUME_PERCENT
            effective_min_threshold = max(settings.MINIMUM_WATCHER_THRESHOLD_USD, min_relative_threshold)
            
            if watcher_update_data.threshold < effective_min_threshold:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Threshold is too low. For this token, the minimum allowed threshold is ${effective_min_threshold:,.2f} USD."
                )
        else:
            if watcher_update_data.threshold < settings.MINIMUM_WATCHER_THRESHOLD_USD:
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Threshold must be at least ${settings.MINIMUM_WATCHER_THRESHOLD_USD:,.2f} USD."
                )

    db_watcher = crud.update_watcher(
        db=db, watcher_id=watcher_id, watcher_update_data=watcher_update_data, owner_id=current_user.id
    )
    
    if watcher_update_data.send_test_notification:
        db.refresh(db_watcher, attribute_names=['transports'])
        test_event = schemas.TokenEventRead.from_orm(
            models.TokenEvent(
                id=0, watcher_id=db_watcher.id, token_address_observed=db_watcher.token_address,
                from_address="0xFROM_ADDRESS_HERE", to_address="0xTO_ADDRESS_HERE",
                amount=12345.67, transaction_hash="0x0000000000000000000000000000000000000000000000000000000000000000",
                block_number=12345678, usd_value=(12345.67 * 1.05), token_name="Test Token", token_symbol="TEST",
                created_at=datetime.now(timezone.utc)
            )
        )
        notifier.send_notifications_for_event_batch(watcher_obj=db_watcher, events_list=[test_event])

    return _populate_watcher_read_from_db_watcher(db_watcher)

@app.delete("/watchers/{watcher_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Watchers"])
def delete_existing_watcher_for_current_user(
    watcher_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.delete_watcher(db=db, watcher_id=watcher_id, owner_id=current_user.id)
    return

@app.get("/events/", response_model=schemas.PaginatedTokenEventResponse, tags=["Events"])
def list_all_events_for_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    watcher_id: Optional[int] = Query(None), token_address: Optional[str] = Query(None),
    token_symbol: Optional[str] = Query(None), start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None), from_address: Optional[str] = Query(None),
    to_address: Optional[str] = Query(None), min_usd_value: Optional[float] = Query(None, ge=0),
    max_usd_value: Optional[float] = Query(None, ge=0), sort_by: Optional[str] = Query("created_at"),
    sort_order: Optional[str] = Query("desc"), active_watchers_only: Optional[bool] = Query(False)
):
    data = crud.get_all_events_for_owner(db=db, owner_id=current_user.id, skip=skip, limit=limit, watcher_id=watcher_id, token_address=token_address, token_symbol=token_symbol, start_date=start_date, end_date=end_date, from_address=from_address, to_address=to_address, min_usd_value=min_usd_value, max_usd_value=max_usd_value, sort_by=sort_by, sort_order=sort_order, active_watchers_only=active_watchers_only)
    return schemas.PaginatedTokenEventResponse(total_events=data["total_events"], events=data["events"])

@app.get("/events/distinct-token-symbols/", response_model=List[str], tags=["Events"])
def list_distinct_token_symbols_for_current_user(
    db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)
):
    symbols = crud.get_distinct_token_symbols_for_owner(db=db, owner_id=current_user.id)
    return symbols

@app.get("/events/watcher/{watcher_id}", response_model=schemas.PaginatedTokenEventResponse, tags=["Events"])
def list_events_for_a_specific_watcher_of_current_user(
    watcher_id: int, skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)
):
    data = crud.get_events_for_watcher(db, watcher_id=watcher_id, owner_id=current_user.id, skip=skip, limit=limit)
    return schemas.PaginatedTokenEventResponse(total_events=data["total_events"], events=data["events"])

@app.get("/events/{event_id}", response_model=schemas.TokenEventRead, tags=["Events"])
def get_single_event_for_current_user(
    event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)
):
    db_event = crud.get_event_by_id(db, event_id=event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    crud.get_watcher_db(db, watcher_id=db_event.watcher_id, owner_id=current_user.id)
    return db_event

@app.post("/watchers/{watcher_id}/transports/", response_model=schemas.TransportRead, status_code=status.HTTP_201_CREATED, tags=["Transports"])
def add_new_transport_to_watcher(
    watcher_id: int, transport_payload: schemas.TransportCreate,
    db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)
):
    if transport_payload.watcher_id != watcher_id:
        raise HTTPException(status_code=400, detail="Watcher ID in path does not match watcher ID in transport payload.")
    return crud.create_new_transport_for_watcher(db=db, transport_data=transport_payload, watcher_id=watcher_id, owner_id=current_user.id)

@app.get("/watchers/{watcher_id}/transports/", response_model=List[schemas.TransportRead], tags=["Transports"])
def list_all_transports_for_specific_watcher(
    watcher_id: int, skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)
):
    crud.get_watcher_db(db, watcher_id=watcher_id, owner_id=current_user.id)
    return crud.get_transports_for_watcher_owner_checked(db, watcher_id=watcher_id, owner_id=current_user.id, skip=skip, limit=limit)

@app.delete("/transports/{transport_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Transports"])
def delete_specific_transport_by_id(
    transport_id: int, db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    crud.delete_transport_by_id(db=db, transport_id=transport_id, owner_id=current_user.id)
    return

@app.post("/transports/test", status_code=status.HTTP_200_OK, tags=["Transports"])
def test_transport_notification(
    transport_test_payload: schemas.TransportTest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_watcher = crud.get_watcher_db(db, watcher_id=transport_test_payload.watcher_id, owner_id=current_user.id)
    
    transport_config = crud.get_transport_config_from_target(
        transport_type=transport_test_payload.transport_type,
        target=transport_test_payload.transport_target
    )

    temp_transport = models.Transport(
        type=transport_test_payload.transport_type,
        config=transport_config
    )

    test_event = schemas.TokenEventRead.from_orm(
        models.TokenEvent(
            id=0, watcher_id=db_watcher.id, token_address_observed=db_watcher.token_address,
            from_address="0xSENDER_ADDRESS_HERE", to_address="0xRECIPIENT_ADDRESS_HERE",
            amount=98765.43, transaction_hash="0x1111111111111111111111111111111111111111111111111111111111111111",
            block_number=87654321, usd_value=(98765.43 * 1.05), token_name="Test Token", token_symbol="TEST",
            created_at=datetime.now(timezone.utc)
        )
    )
    
    class TempWatcher:
        def __init__(self, watcher, transport):
            self.id = watcher.id
            self.name = f"[TEST] {watcher.name}"
            self.token_address = watcher.token_address
            self.transports = [transport]

    temp_watcher_obj = TempWatcher(db_watcher, temp_transport)
    
    notifier.send_notifications_for_event_batch(watcher_obj=temp_watcher_obj, events_list=[test_event])

    return {"detail": "Test notification sent successfully."}

@app.get("/tokens/{contract_address}/volume", response_model=schemas.TokenRead, tags=["Tokens"])
@limiter.limit("60/minute")
def read_token_total_volume(request: Request, contract_address: str, db: Session = Depends(get_db)):
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
