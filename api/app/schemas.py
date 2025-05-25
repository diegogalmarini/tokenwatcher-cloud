# api/app/schemas.py
from pydantic import BaseModel, HttpUrl, EmailStr
from datetime import datetime
from typing import Optional, List

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

class TokenEventCreate(TokenEventBase):
    pass

class TokenEventRead(TokenEventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- SCHEMAS DE TRANSPORT ---
class TransportBase(BaseModel):
    type: str
    config: dict

class TransportCreate(TransportBase):
    pass

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

# Para crear, esperamos la URL del webhook directamente
# class WatcherCreatePayload(WatcherBase): # <-- NOMBRE ANTERIOR
class WatcherCreate(WatcherBase): # <-- NOMBRE CORREGIDO
    webhook_url: HttpUrl # El webhook es obligatorio al crear

# Para actualizar, permitimos cambios parciales y webhook opcional
class WatcherUpdatePayload(BaseModel):
    name: Optional[str] = None
    token_address: Optional[str] = None
    threshold: Optional[float] = None
    webhook_url: Optional[HttpUrl | None] = None
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
# (El resto de tus schemas de User y Token se mantienen igual)
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime

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