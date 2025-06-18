# api/app/schemas.py

from pydantic import BaseModel, HttpUrl, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal

# --- Configuración Base para todos los Schemas ---
class OrmBase(BaseModel):
    class Config:
        from_attributes = True

# --- SCHEMAS DE EVENTOS ---
class TokenEventBase(BaseModel):
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

    class Config:
        from_attributes = True

class PaginatedTokenEventResponse(BaseModel):
    total_events: int
    events: List[TokenEventRead]


# --- SCHEMAS DE TRANSPORT ---
class TransportBase(BaseModel):
    type: str
    config: Dict[str, Any]

class TransportCreate(TransportBase):
    watcher_id: int

class TransportRead(TransportBase):
    id: int
    watcher_id: int

    class Config:
        from_attributes = True

class TransportTest(BaseModel):
    watcher_id: int
    transport_type: Literal["slack", "discord", "email", "telegram"]
    transport_target: str


# --- SCHEMAS DE WATCHER ---
class WatcherBase(BaseModel):
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

    class Config:
        from_attributes = True


# --- SCHEMAS DE USUARIO ---
class UserBase(BaseModel):
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

    class Config:
        from_attributes = True

class UserUpdateAdmin(BaseModel):
    watcher_limit: Optional[int] = None
    is_active: Optional[bool] = None
    plan: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class TokenRead(BaseModel):
    contract: str
    volume: float

    class Config:
        from_attributes = True


# --- TOKEN INFO ---
class TokenInfo(BaseModel):
    price: float
    market_cap: float
    total_volume_24h: float
    suggested_threshold: float
    minimum_threshold: float


# --- AUTHENTICATION & USER MANAGEMENT ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    msg: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ResetPasswordResponse(BaseModel):
    msg: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    
class DeleteAccountRequest(BaseModel):
    password: str

# --- OTROS ---
class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    message: str