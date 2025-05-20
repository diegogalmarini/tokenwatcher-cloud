# api/app/schemas.py
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List # Añadido List para WatcherRead que puede incluir eventos

# --- Schemas para Watcher ---
class WatcherBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Un nombre descriptivo para el Watcher") # <-- CAMBIO: Añadido 'name'
    token_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$", description="Dirección del contrato ERC-20")
    threshold: float = Field(..., gt=0, description="Umbral de volumen para notificar")
    webhook_url: HttpUrl # Tu modelo lo tiene como String, Pydantic como HttpUrl, lo cual es bueno para validación.

class WatcherCreate(WatcherBase):
    pass

class WatcherUpdate(BaseModel): # Para PUT, usualmente todos los campos son opcionales
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    token_address: Optional[str] = Field(None, pattern=r"^0x[a-fA-F0-9]{40}$")
    threshold: Optional[float] = Field(None, gt=0)
    webhook_url: Optional[HttpUrl] = None

# --- Schemas para Event (TokenEvent) ---
# Estos esquemas deben coincidir con el payload que `watcher.py` envía a `crud.create_event`
# y con los campos del modelo `Event` en `models.py`.

class TokenEventDataForCreation(BaseModel): # Datos que vienen del watcher.py para crear un evento
    watcher_id: int
    # El payload de watcher.py usa: "contract", "volume", "tx_hash", "block_number"
    contract: str # Este es el 'token_address_observed' en el modelo
    volume: float # Este es 'amount' en el modelo
    tx_hash: str
    block_number: int

class TokenEventRead(BaseModel): # Lo que devolvemos al leer un evento de la BD
    id: int
    watcher_id: int
    token_address_observed: str # Campo del modelo Event
    amount: float               # Campo del modelo Event
    transaction_hash: str       # Campo del modelo Event
    block_number: int           # Campo del modelo Event
    created_at: datetime        # Campo del modelo Event (timestamp de guardado en BD)

    class Config:
        orm_mode = True

class WatcherRead(WatcherBase): # Esquema para leer un Watcher, incluyendo sus datos y, opcionalmente, eventos.
    id: int
    created_at: datetime
    updated_at: datetime
    events: List[TokenEventRead] = [] # Para incluir eventos si se hace un join o carga eager.

    class Config:
        orm_mode = True


# Los siguientes schemas para Transport y TokenRead estaban en tu main.py,
# pero no me has proporcionado sus definiciones en schemas.py.
# Los creo aquí basándome en su uso en main.py y el whitepaper.

class TransportBase(BaseModel):
    watcher_id: int
    type: str # ej. "slack", "discord", "webhook"
    config: dict # ej. {"url": "http://..."}

class TransportCreate(TransportBase):
    pass

class TransportRead(TransportBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class TokenRead(BaseModel): # Para el endpoint /tokens/{contract_address}
    contract: str
    volume: float # Asumo que es el volumen total que calculas.