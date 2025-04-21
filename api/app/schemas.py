# api/app/schemas.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# — Watchers —
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
        from_attributes = True

# — TokenEvents —
class TokenEventBase(BaseModel):
    watcher_id: int
    contract: str
    volume: float
    tx_hash: str

class TokenEventCreate(TokenEventBase):
    pass

class TokenEventRead(TokenEventBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# — Transports —
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
        from_attributes = True

# — Tokens (nuevo endpoint) —
class TokenRead(BaseModel):
    contract: str
    volume: int

    class Config:
        orm_mode = True
