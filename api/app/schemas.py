# api/app/schemas.py
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field, EmailStr
from typing import Optional, List, Dict, Any

# --- Schemas para User ---
class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Email del usuario, actuará como username")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Contraseña del usuario (se guardará hasheada)")

class UserRead(UserBase):
    id: int
    is_active: bool # Relacionado al usuario, no al watcher
    created_at: datetime
    class Config:
        from_attributes = True

# --- Schemas para Token JWT ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None

# --- Schemas para Watcher ---
class WatcherBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    token_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")
    threshold: float = Field(..., gt=0)
    webhook_url: HttpUrl # Obligatorio en la creación

class WatcherCreate(WatcherBase):
    is_active: bool = True # Por defecto, se crea activo

class WatcherUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    token_address: Optional[str] = Field(None, pattern=r"^0x[a-fA-F0-9]{40}$")
    threshold: Optional[float] = Field(None, gt=0)
    webhook_url: Optional[HttpUrl] = None # Para cambiar o quitar el webhook principal
    is_active: Optional[bool] = None # Para pausar/reanudar

class WatcherRead(BaseModel):
    id: int
    owner_id: int
    name: str
    token_address: str
    threshold: float
    is_active: bool
    webhook_url: Optional[HttpUrl] = None # Se poblará desde el primer Transport encontrado
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Schemas para Event (TokenEvent) ---
class TokenEventCreate(BaseModel):
    watcher_id: int = Field(..., description="ID del watcher asociado")
    contract: str = Field(..., description="Dirección del contrato donde ocurrió el evento")
    volume: float = Field(..., description="Volumen del token transferido")
    tx_hash: str = Field(..., description="Hash de la transacción del evento")
    block_number: int = Field(..., description="Número de bloque donde ocurrió el evento")

class TokenEventRead(BaseModel):
    id: int # Asumiendo que el ID de la secuencia es suficiente para la lectura individual
    watcher_id: int
    token_address_observed: str
    amount: float
    transaction_hash: str
    block_number: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Schemas para Transport ---
class TransportBase(BaseModel):
    watcher_id: int # Necesario para crear un transport asociado a un watcher existente
    type: str = Field(..., description="Tipo de transporte, ej: 'slack', 'discord'")
    config: Dict[str, Any] # Ej: {"url": "http://example.com/webhook"}

class TransportCreate(TransportBase):
    pass

class TransportRead(TransportBase): # TransportBase ya incluye watcher_id, type, config
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Schemas para Token (Volumen) ---
class TokenRead(BaseModel): # Usado para leer el volumen calculado
    contract: str
    volume: float