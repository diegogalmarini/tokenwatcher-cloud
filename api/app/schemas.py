# api/app/schemas.py

from pydantic import BaseModel, HttpUrl, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any

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

# --- SCHEMA PARA RESPUESTA PAGINADA DE EVENTOS ---
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


# --- SCHEMAS DE WATCHER ---
class WatcherBase(BaseModel):
    name: str
    token_address: str
    threshold: float
    is_active: bool = True

class WatcherCreate(WatcherBase):
    webhook_url: HttpUrl

class WatcherUpdatePayload(BaseModel):
    name: Optional[str] = None
    token_address: Optional[str] = None
    threshold: Optional[float] = None
    webhook_url: Optional[HttpUrl] = None
    is_active: Optional[bool] = None

class WatcherRead(WatcherBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    webhook_url: Optional[HttpUrl] = None

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
    
    # --- NUEVOS CAMPOS PARA EL PANEL DE ADMIN ---
    plan: str
    watcher_count: int
    watcher_limit: int

    class Config:
        from_attributes = True


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


# --- SCHEMAS PARA “FORGOT / RESET PASSWORD” ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    msg: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ResetPasswordResponse(BaseModel):
    msg: str