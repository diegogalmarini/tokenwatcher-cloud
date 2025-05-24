# api/app/schemas.py
from pydantic import BaseModel, HttpUrl, EmailStr
from datetime import datetime
from typing import Optional, List

# --- SCHEMAS DE EVENTOS ---
class TokenEventBase(BaseModel):
    watcher_id: int
    token_address_observed: str # <-- Usamos este nombre (coincide con tu schema)
    from_address: str
    to_address: str
    amount: float # <-- Usamos este nombre (coincide con tu schema)
    transaction_hash: str
    block_number: int
    usd_value: Optional[float] = None # <-- AÑADIDO

class TokenEventCreate(TokenEventBase):
    pass

class TokenEventRead(TokenEventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True # Pydantic V2 (o orm_mode = True para V1)


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

class WatcherCreatePayload(WatcherBase):
    webhook_url: HttpUrl

class WatcherUpdatePayload(BaseModel): # <-- Lo he llamado así para claridad
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

# --- SCHEMAS DE TOKEN (AUTH) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- SCHEMAS DE TOKEN VOLUME (Ya lo tenías en crud.py) ---
# Añadimos aquí los schemas que se infieren de tu crud.py para TokenVolume
class TokenRead(BaseModel): # Asumo este schema basado en tu crud.py
    contract: str
    volume: float

    class Config:
        from_attributes = True