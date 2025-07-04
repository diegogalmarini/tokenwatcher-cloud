# api/app/crud.py

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc, asc, func as sql_func, distinct
from fastapi import HTTPException, status
from pydantic import HttpUrl, EmailStr, ValidationError, parse_obj_as
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from web3 import Web3
from web3.exceptions import InvalidAddress

from . import models, schemas, auth, email_utils

# --- User CRUD ---
def get_user(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).options(selectinload(models.User.watchers), selectinload(models.User.subscription).selectinload(models.Subscription.plan)).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).options(selectinload(models.User.watchers), selectinload(models.User.subscription).selectinload(models.Subscription.plan)).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).options(selectinload(models.User.watchers), selectinload(models.User.subscription).selectinload(models.Subscription.plan)).order_by(models.User.id).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate, is_active: bool = False) -> models.User:
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        is_active=is_active
    )
    db.add(db_user)
    db.flush() 

    free_plan = db.query(models.Plan).filter(models.Plan.name == "Free").first()
    if free_plan:
        db_subscription = models.Subscription(
            user_id=db_user.id,
            plan_id=free_plan.id,
            status="active"
        )
        db.add(db_subscription)
    
    db.commit()
    db.refresh(db_user, attribute_names=['watchers', 'subscription'])
    return db_user

def set_user_password(db: Session, user: models.User, new_password: str) -> models.User:
    hashed = auth.get_password_hash(new_password)
    user.hashed_password = hashed
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def delete_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    user_to_delete = get_user(db, user_id=user_id)
    if not user_to_delete:
        return None
    db.delete(user_to_delete)
    db.commit()
    return user_to_delete

def update_user_admin(db: Session, user_id: int, user_update_data: schemas.UserUpdateAdmin) -> Optional[models.User]:
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        return None

    update_data = user_update_data.model_dump(exclude_unset=True)
    
    plan_changed = False
    limit_manually_changed = False
    new_plan_name_for_email = None

    if 'plan' in update_data and update_data['plan'] is not None:
        if not db_user.subscription or db_user.subscription.plan.name != update_data['plan']:
            plan_changed = True

    if plan_changed:
        new_plan = get_plan_by_name(db, name=update_data['plan'])
        if not new_plan:
            raise HTTPException(status_code=404, detail=f"Plan '{update_data['plan']}' not found.")
        
        new_plan_name_for_email = new_plan.name
        if db_user.subscription:
            db_user.subscription.plan_id = new_plan.id
            db_user.subscription.watcher_limit_override = None 
        else:
            new_subscription = models.Subscription(user_id=db_user.id, plan_id=new_plan.id, status="active")
            db.add(new_subscription)
    
    elif 'watcher_limit' in update_data:
        if db_user.subscription:
            db_user.subscription.watcher_limit_override = update_data['watcher_limit']
            limit_manually_changed = True
    
    if 'is_active' in update_data and update_data['is_active'] is not None:
        db_user.is_active = update_data['is_active']

    db.commit()
    
    db.refresh(db_user)
    if db_user.subscription:
      db.refresh(db_user.subscription)
      db.refresh(db_user.subscription.plan)

    if plan_changed and new_plan_name_for_email:
        email_utils.send_plan_change_email(db_user.email, new_plan_name_for_email)
    
    if limit_manually_changed:
        email_utils.send_watcher_limit_update_email(db_user.email, db_user.watcher_limit)
        
    return db_user

def update_user_plan(db: Session, user: models.User, new_plan_id: int) -> models.User:
    new_plan = get_plan(db, plan_id=new_plan_id)
    if not new_plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    if not new_plan.is_active:
        raise HTTPException(status_code=400, detail="Cannot switch to an inactive plan.")

    if user.subscription:
        if user.subscription.plan_id != new_plan.id:
            user.subscription.plan_id = new_plan.id
            user.subscription.watcher_limit_override = None # Reset override on any plan change
            email_utils.send_plan_change_email(user.email, new_plan.name)
    else:
        new_subscription = models.Subscription(user_id=user.id, plan_id=new_plan.id, status="active")
        db.add(new_subscription)
        email_utils.send_plan_change_email(user.email, new_plan.name)
    
    db.commit()
    db.refresh(user)
    if user.subscription:
        db.refresh(user.subscription)
        db.refresh(user.subscription.plan)
        
    return user


# --- Watcher CRUD ---
def count_watchers_for_owner(db: Session, owner_id: int) -> int:
    return db.query(models.Watcher).filter(models.Watcher.owner_id == owner_id).count()

def get_watcher_db(db: Session, watcher_id: int, owner_id: Optional[int] = None) -> models.Watcher:
    query = db.query(models.Watcher).options(selectinload(models.Watcher.transports))
    query = query.filter(models.Watcher.id == watcher_id)
    if owner_id is not None:
        query = query.filter(models.Watcher.owner_id == owner_id)
    db_watcher = query.first()
    if not db_watcher:
        detail = "Watcher not found"
        if owner_id is not None:
            detail = "Watcher not found or not owned by user"
        raise HTTPException(status_code=404, detail=detail)
    return db_watcher

def get_active_watchers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Watcher]:
    return (
        db.query(models.Watcher)
        .filter(models.Watcher.is_active == True)
        .order_by(models.Watcher.id)
        .options(selectinload(models.Watcher.transports))
        .offset(skip).limit(limit).all()
    )

def get_watchers_for_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Watcher]:
    return (
        db.query(models.Watcher)
        .filter(models.Watcher.owner_id == owner_id)
        .order_by(models.Watcher.name)
        .options(selectinload(models.Watcher.transports))
        .offset(skip).limit(limit).all()
    )

def get_transport_config_from_target(transport_type: str, target: str) -> Dict[str, Any]:
    transport_config = {}
    transport_type_lower = transport_type.lower()
    if transport_type_lower in ["slack", "discord"]:
        try:
            parse_obj_as(HttpUrl, target)
            transport_config = {"url": target}
        except ValidationError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Webhook URL format.")
    elif transport_type_lower == "email":
        try:
            validated_email = parse_obj_as(EmailStr, target)
            transport_config = {"email": str(validated_email)}
        except ValidationError:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Email address format.")
    elif transport_type_lower == "telegram":
        try:
            config_data = json.loads(target)
            if not isinstance(config_data, dict) or "bot_token" not in config_data or "chat_id" not in config_data:
                raise ValueError("JSON must contain 'bot_token' and 'chat_id' keys.")
            transport_config = {"bot_token": str(config_data["bot_token"]), "chat_id": str(config_data["chat_id"])}
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Telegram config format. Expected a JSON string with 'bot_token' and 'chat_id'.")
    if not transport_config:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported transport_type: {transport_type}")
    return transport_config

def create_watcher(db: Session, watcher_data: schemas.WatcherCreate, owner_id: int) -> models.Watcher:
    try:
        checksum_address = Web3.to_checksum_address(watcher_data.token_address)
    except InvalidAddress:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Ethereum address format.")
    
    db_watcher = models.Watcher(
        name=watcher_data.name,
        token_address=checksum_address,
        threshold=watcher_data.threshold,
        is_active=watcher_data.is_active,
        owner_id=owner_id
    )
    db.add(db_watcher)
    db.flush()

    transport_config = get_transport_config_from_target(
        watcher_data.transport_type,
        watcher_data.transport_target
    )

    db_transport = models.Transport(
        watcher_id=db_watcher.id,
        type=watcher_data.transport_type.lower(),
        config=transport_config
    )
    db.add(db_transport)

    db.commit()
    db.refresh(db_watcher, attribute_names=['transports'])
    return db_watcher

def update_watcher(db: Session, watcher_id: int, watcher_update_data: schemas.WatcherUpdatePayload, owner_id: int) -> models.Watcher:
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    update_data = watcher_update_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field in ["transport_type", "transport_target", "send_test_notification", "token_address"]:
            continue
        if hasattr(db_watcher, field) and value is not None:
            setattr(db_watcher, field, value)

    if watcher_update_data.transport_type and watcher_update_data.transport_target:
        for transport in db_watcher.transports:
            db.delete(transport)
        
        transport_config = get_transport_config_from_target(
            watcher_update_data.transport_type,
            watcher_update_data.transport_target
        )
        
        new_transport = models.Transport(
            watcher_id=db_watcher.id,
            type=watcher_update_data.transport_type.lower(),
            config=transport_config
        )
        db.add(new_transport)

    db.commit()
    db.refresh(db_watcher, attribute_names=['transports'])
    return db_watcher

def delete_watcher(db: Session, watcher_id: int, owner_id: int) -> None:
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    db.delete(db_watcher)
    db.commit()

# --- Event (TokenEvent) CRUD ---
def create_event(db: Session, event_data: schemas.TokenEventCreate) -> Optional[models.TokenEvent]:
    existing_event = db.query(models.TokenEvent).filter(
        models.TokenEvent.transaction_hash == event_data.transaction_hash,
        models.TokenEvent.watcher_id == event_data.watcher_id
    ).first()
    if existing_event:
        return existing_event
    db_event = models.TokenEvent(**event_data.model_dump())
    try:
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event
    except Exception:
        db.rollback()
        raise

def get_event_by_id(db: Session, event_id: int) -> models.TokenEvent | None:
    return db.query(models.TokenEvent).filter(models.TokenEvent.id == event_id).first()

def get_all_events_for_owner(
    db: Session, owner_id: int, skip: int = 0, limit: int = 100,
    watcher_id: Optional[int] = None, token_address: Optional[str] = None,
    token_symbol: Optional[str] = None, start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None, from_address: Optional[str] = None,
    to_address: Optional[str] = None, min_usd_value: Optional[float] = None,
    max_usd_value: Optional[float] = None, sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc", active_watchers_only: Optional[bool] = False
) -> Dict[str, Any]:
    base_query = db.query(models.TokenEvent)\
                   .join(models.Watcher, models.TokenEvent.watcher_id == models.Watcher.id)\
                   .filter(models.Watcher.owner_id == owner_id)

    if active_watchers_only:
        base_query = base_query.filter(models.Watcher.is_active == True)
    if watcher_id is not None:
        base_query = base_query.filter(models.TokenEvent.watcher_id == watcher_id)
    if token_address:
        base_query = base_query.filter(models.TokenEvent.token_address_observed.ilike(f"%{token_address}%"))
    if token_symbol:
        base_query = base_query.filter(models.TokenEvent.token_symbol.ilike(f"%{token_symbol}%"))
    if start_date:
        start_date_utc = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
        base_query = base_query.filter(models.TokenEvent.created_at >= start_date_utc)
    if end_date:
        end_date_utc_exclusive = datetime(end_date.year, end_date.month, end_date.day) + timedelta(days=1)
        base_query = base_query.filter(models.TokenEvent.created_at < end_date_utc_exclusive)
    if from_address:
        base_query = base_query.filter(models.TokenEvent.from_address.ilike(from_address))
    if to_address:
        base_query = base_query.filter(models.TokenEvent.to_address.ilike(to_address))
    if min_usd_value is not None:
        base_query = base_query.filter(models.TokenEvent.usd_value >= min_usd_value)
    if max_usd_value is not None:
        base_query = base_query.filter(models.TokenEvent.usd_value <= max_usd_value)
    
    total_events = base_query.with_entities(sql_func.count(models.TokenEvent.id)).scalar() or 0
    
    sort_map = { "created_at": models.TokenEvent.created_at, "amount": models.TokenEvent.amount, "usd_value": models.TokenEvent.usd_value, "block_number": models.TokenEvent.block_number }
    sort_column = sort_map.get(sort_by, models.TokenEvent.created_at)
    
    if sort_order.lower() == "asc":
        ordered_query = base_query.order_by(asc(sort_column))
    else:
        ordered_query = base_query.order_by(desc(sort_column))
    
    events = ordered_query.offset(skip).limit(limit).all()
    return {"total_events": total_events, "events": events}

def get_events_for_watcher(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
    db_watcher = get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    base_query = db.query(models.TokenEvent).filter(models.TokenEvent.watcher_id == watcher_id)
    total_events = base_query.with_entities(sql_func.count(models.TokenEvent.id)).scalar() or 0
    events = base_query.order_by(desc(models.TokenEvent.created_at)).offset(skip).limit(limit).all()
    return {"total_events": total_events, "events": events}

def get_distinct_token_symbols_for_owner(db: Session, owner_id: int) -> List[str]:
    query = (
        db.query(distinct(models.TokenEvent.token_symbol))
          .join(models.Watcher, models.TokenEvent.watcher_id == models.Watcher.id)
          .filter(models.Watcher.owner_id == owner_id)
          .filter(models.TokenEvent.token_symbol.isnot(None))
          .filter(models.TokenEvent.token_symbol != '')
          .order_by(models.TokenEvent.token_symbol)
    )
    symbols = [item[0] for item in query.all()]
    return symbols

# --- Transport CRUD ---
def get_transport_by_id(db: Session, transport_id: int, owner_id: int) -> models.Transport | None:
    transport = (
        db.query(models.Transport)
          .join(models.Watcher, models.Transport.watcher_id == models.Watcher.id)
          .filter(models.Transport.id == transport_id, models.Watcher.owner_id == owner_id)
          .first()
    )
    if not transport:
        raise HTTPException(status_code=404, detail="Transport not found or not owned by user")
    return transport

def get_transports_for_watcher_owner_checked(db: Session, watcher_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Transport]:
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    return (
        db.query(models.Transport)
          .filter(models.Transport.watcher_id == watcher_id)
          .order_by(models.Transport.id)
          .offset(skip)
          .limit(limit)
          .all()
    )

def create_new_transport_for_watcher(db: Session, transport_data: schemas.TransportCreate, watcher_id: int, owner_id: int) -> models.Transport:
    if transport_data.watcher_id != watcher_id:
        raise HTTPException(
            status_code=400,
            detail=f"Watcher ID in payload ({transport_data.watcher_id}) does not match Watcher ID in path ({watcher_id})."
        )
    get_watcher_db(db, watcher_id=watcher_id, owner_id=owner_id)
    db_transport = models.Transport(**transport_data.model_dump())
    db.add(db_transport)
    db.commit()
    db.refresh(db_transport)
    return db_transport

def delete_transport_by_id(db: Session, transport_id: int, owner_id: int) -> None:
    db_transport = get_transport_by_id(db, transport_id=transport_id, owner_id=owner_id)
    db.delete(db_transport)
    db.commit()

def get_volume(db: Session, contract_address: str) -> float:
    total_volume = (
        db.query(sql_func.sum(models.TokenEvent.amount))
          .filter(models.TokenEvent.token_address_observed == contract_address)
          .scalar()
    )
    return total_volume if total_volume is not None else 0.0

# --- Plan and Subscription CRUD ---
def get_plan_by_name(db: Session, name: str) -> Optional[models.Plan]:
    return db.query(models.Plan).filter(models.Plan.name == name).first()

def get_plan(db: Session, plan_id: int) -> Optional[models.Plan]:
    return db.query(models.Plan).filter(models.Plan.id == plan_id).first()

def get_plans(db: Session, skip: int = 0, limit: int = 100) -> List[models.Plan]:
    """Returns all plans, for admin use."""
    return db.query(models.Plan).order_by(models.Plan.price_monthly).offset(skip).limit(limit).all()

def get_active_plans(db: Session, skip: int = 0, limit: int = 100) -> List[models.Plan]:
    """Returns only plans that are marked as active, for public view."""
    return db.query(models.Plan).filter(models.Plan.is_active == True).order_by(models.Plan.price_monthly).offset(skip).limit(limit).all()

def create_plan(db: Session, plan: schemas.PlanCreate) -> models.Plan:
    db_plan = models.Plan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

def update_plan(db: Session, plan_id: int, plan_data: schemas.PlanUpdatePayload) -> Optional[models.Plan]:
    db_plan = get_plan(db, plan_id)
    if not db_plan:
        return None
    
    update_data = plan_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
        
    db.commit()
    db.refresh(db_plan)
    return db_plan

def delete_plan(db: Session, plan_id: int) -> Optional[models.Plan]:
    db_plan = get_plan(db, plan_id)
    if not db_plan:
        return None
    
    if db_plan.name == 'Free':
        raise HTTPException(status_code=400, detail="The Free plan cannot be deleted.")

    active_subscriptions = db.query(models.Subscription).filter(models.Subscription.plan_id == plan_id).count()
    if active_subscriptions > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete plan. {active_subscriptions} user(s) are currently subscribed to it."
        )

    db.delete(db_plan)
    db.commit()
    return db_plan
