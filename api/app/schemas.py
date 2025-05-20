# api/app/schemas.py
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict

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
    created_at: datetime
    updated_at: datetime
    events: List["TokenEventRead"] = []

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
    config: Dict[str, str] # Ejemplo: {"url": "http://..."}

class TransportCreate(TransportBase):
    pass

class TransportRead(TransportBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Schemas para Token (Volumen) ---
class TokenRead(BaseModel): # Este es el que falta según el log
    contract: str
    volume: float

    # class Config: # No necesita Config si no se mapea desde un ORM directamente.
    #     from_attributes = True

# --- Actualizar referencias anticipadas ---
# Esto es importante si tienes tipos referenciados como strings.
WatcherRead.update_forward_refs()
# TokenEventRead.update_forward_refs() # Solo si TokenEventRead referencia a otro tipo definido después
# TransportRead.update_forward_refs() # Solo si TransportRead referencia a otro tipo definido después