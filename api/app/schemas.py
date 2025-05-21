# api/app/schemas.py
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field, EmailStr # EmailStr añadido
from typing import Optional, List, Dict

# --- Schemas para User ---
class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Email del usuario, actuará como username")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Contraseña del usuario (se guardará hasheada)")

class UserRead(UserBase): # Lo que devolvemos de la API sobre un usuario
    id: int
    is_active: bool # Asumiendo que 'is_active' está en tu modelo User
    created_at: datetime
    # No incluir hashed_password aquí por seguridad

    class Config:
        from_attributes = True

# --- Schemas para Token JWT ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel): # Contenido del payload del JWT
    email: Optional[EmailStr] = None

# --- Schemas para Watcher ---
class WatcherBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Un nombre descriptivo para el Watcher")
    token_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$", description="Dirección del contrato ERC-20")
    threshold: float = Field(..., gt=0, description="Umbral de volumen para notificar")
    webhook_url: HttpUrl

class WatcherCreate(WatcherBase):
    pass

class WatcherUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    token_address: Optional[str] = Field(None, pattern=r"^0x[a-fA-F0-9]{40}$")
    threshold: Optional[float] = Field(None, gt=0)
    webhook_url: Optional[HttpUrl] = None

class WatcherRead(WatcherBase):
    id: int
    owner_id: int 
    created_at: datetime
    updated_at: datetime
    # events: List["TokenEventRead"] = [] # Comentado temporalmente si causa problemas de forward ref no resueltos

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
    id: int
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
    watcher_id: int
    type: str = Field(..., description="Tipo de transporte, ej: 'slack', 'discord'")
    config: Dict[str, str]

class TransportCreate(TransportBase):
    pass

class TransportRead(TransportBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Schemas para Token (Volumen) ---
class TokenRead(BaseModel):
    contract: str
    volume: float

# --- Actualizar referencias anticipadas (si es necesario) ---
# Si WatcherRead.events está descomentado y TokenEventRead se define después, esto es necesario:
# WatcherRead.update_forward_refs()