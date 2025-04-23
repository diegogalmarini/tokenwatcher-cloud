from datetime import datetime
from pydantic import BaseModel

class WatcherBase(BaseModel):
    name: str
    contract: str
    threshold: float

class WatcherCreate(WatcherBase):
    pass

class WatcherRead(WatcherBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# ----------------------------------------------

class TokenEventBase(BaseModel):
    watcher_id: int
    contract: str
    volume: float
    tx_hash: str
    block_number: int

class TokenEventCreate(TokenEventBase):
    pass

class TokenEventRead(TokenEventBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True

# ----------------------------------------------

class TransportBase(BaseModel):
    watcher_id: int
    type: str
    address: str

class TransportCreate(TransportBase):
    pass

class TransportRead(TransportBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

# Para la ruta /tokens/{contract}
class TokenRead(BaseModel):
    contract: str
    volume: int