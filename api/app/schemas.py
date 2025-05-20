# api/app/schemas.py
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List

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

# --- Schemas para Event (TokenEvent) ---

# CAMBIO: Renombrado de TokenEventDataForCreation a TokenEventCreate
class TokenEventCreate(BaseModel): # Datos que vienen para crear un evento
    watcher_id: int
    # El payload de watcher.py usa: "contract", "volume", "tx_hash", "block_number"
    # Estos nombres deben coincidir con los que espera crud.create_event
    contract: str = Field(..., description="Dirección del contrato donde ocurrió el evento (token_address_observed en el modelo)")
    volume: float = Field(..., description="Volumen del token transferido (amount en el modelo)")
    tx_hash: str = Field(..., description="Hash de la transacción del evento")
    block_number: int = Field(..., description="Número de bloque donde ocurrió el evento")

class TokenEventRead(BaseModel): # Lo que devolvemos al leer un evento de la BD
    id: int
    watcher_id: int
    token_address_observed: str
    amount: float
    transaction_hash: str
    block_number: int
    created_at: datetime # Timestamp de guardado en nuestra BD

    class Config:
        from_attributes = True # CAMBIO: de orm_mode a from_attributes

class WatcherRead(WatcherBase):
    id: int
    created_at: datetime
    updated_at: datetime
    events: List[TokenEventRead] = []

    class Config:
        from_attributes = True # CAMBIO: de orm_mode a from_attributes

# --- Schemas para Transport ---
class TransportBase(BaseModel):
    watcher_id: int
    type: str = Field(..., description="Tipo de transporte, ej: 'slack', 'discord'")
    config: dict # Ej: {"url": "http://..."} o {"channel_id": "...", "token": "..."}

class TransportCreate(TransportBase):
    pass

class TransportRead(TransportBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True # CAMBIO: de orm_mode a from_attributes

# --- Schemas para Token (Volumen) ---
class TokenRead(BaseModel):
    contract: str
    volume: float

    class Config:
        from_attributes = True # CAMBIO: de orm_mode a from_attributes (si este esquema se mapea desde un ORM)