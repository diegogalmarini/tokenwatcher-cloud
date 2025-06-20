# api/app/schemas.py

from pydantic import BaseModel, HttpUrl, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal

class OrmBase(BaseModel):
    class Config:
        from_attributes = True

# --- SCHEMAS DE PLANES Y SUSCRIPCIONES ---
class PlanBase(OrmBase):
    name: str
    description: Optional[str] = None
    price_monthly: int
    price_annually: int
    watcher_limit: int
    is_active: bool = True

class PlanCreate(PlanBase):
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_annually: Optional[str] = None

class PlanRead(PlanBase):
    id: int

class PlanUpdatePayload(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[int] = None
    price_annually: Optional[int] = None
    watcher_limit: Optional[int] = None
    is_active: Optional[bool] = None
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_annually: Optional[str] = None

class SubscriptionBase(OrmBase):
    user_id: int
    plan_id: int
    status: str
    stripe_subscription_id: Optional[str] = None
    current_period_end: Optional[datetime] = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionRead(SubscriptionBase):
    id: int
    plan: PlanRead

# --- SCHEMAS DE EVENTOS ---
class TokenEventBase(OrmBase):
    watcher_id: int
    token_address_observed: str
    from_address: str
    to_address: str
    amount: float
    transaction_hash: str
    block_number: int
    usd_value: Optional[float] = None
    token_name: Optional[str] = None
    token_symbol: Optional[str] = None

class TokenEventCreate(TokenEventBase):
    pass

class TokenEventRead(TokenEventBase):
    id: int
    created_at: datetime

class PaginatedTokenEventResponse(OrmBase):
    total_events: int
    events: List[TokenEventRead]

# --- SCHEMAS DE TRANSPORT ---
class TransportBase(OrmBase):
    type: str
    config: Dict[str, Any]

class TransportCreate(TransportBase):
    watcher_id: int

class TransportRead(TransportBase):
    id: int
    watcher_id: int

class TransportTest(BaseModel):
    watcher_id: int
    transport_type: Literal["slack", "discord", "email", "telegram"]
    transport_target: str

# --- SCHEMAS DE WATCHER ---
class WatcherBase(OrmBase):
    name: str
    token_address: str
    threshold: float
    is_active: bool = True

class WatcherCreate(WatcherBase):
    transport_type: Literal["slack", "discord", "email", "telegram"]
    transport_target: str
    send_test_notification: bool = False

class WatcherUpdatePayload(BaseModel):
    name: Optional[str] = None
    threshold: Optional[float] = None
    is_active: Optional[bool] = None
    transport_type: Optional[Literal["slack", "discord", "email", "telegram"]] = None
    transport_target: Optional[str] = None
    send_test_notification: bool = False

class WatcherRead(WatcherBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    transports: List[TransportRead] = []

# --- SCHEMAS DE USUARIO ---
class UserBase(OrmBase):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    is_admin: bool = False
    plan: str
    watcher_count: int
    watcher_limit: int
    subscription: Optional[SubscriptionRead] = None

class UserUpdateAdmin(BaseModel):
    watcher_limit: Optional[int] = None
    is_active: Optional[bool] = None
    plan: Optional[str] = None

class Token(OrmBase):
    access_token: str
    token_type: str

class TokenData(OrmBase):
    email: Optional[str] = None

class TokenRead(OrmBase):
    contract: str
    volume: float

class TokenInfo(OrmBase):
    price: float
    market_cap: float
    total_volume_24h: float
    suggested_threshold: float
    minimum_threshold: float

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(OrmBase):
    msg: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ResetPasswordResponse(OrmBase):
    msg: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    
class DeleteAccountRequest(BaseModel):
    password: str

class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    message: str
