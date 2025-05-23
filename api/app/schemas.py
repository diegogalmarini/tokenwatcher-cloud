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
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True # Reemplaza orm_mode = True en Pydantic v2

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
    webhook_url: HttpUrl 

class WatcherCreate(WatcherBase):
    is_active: bool = True 

class WatcherUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    token_address: Optional[str] = Field(None, pattern=r"^0x[a-fA-F0-9]{40}$")
    threshold: Optional[float] = Field(None, gt=0)
    webhook_url: Optional[HttpUrl] = None 
    is_active: Optional[bool] = None

class WatcherRead(BaseModel):
    id: int
    owner_id: int
    name: str
    token_address: str
    threshold: float
    is_active: bool
    webhook_url: Optional[HttpUrl] = None 
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Schemas para Event (TokenEvent) ---
class TokenEventBase(BaseModel): # Creando una base para campos comunes
    watcher_id: int = Field(..., description="ID del watcher asociado")
    contract: str = Field(..., description="Dirección del contrato donde ocurrió el evento (token_address_observed)")
    from_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$", description="Dirección de origen de la transferencia") # NUEVO
    to_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$", description="Dirección de destino de la transferencia")   # NUEVO
    volume: float = Field(..., description="Volumen del token transferido (cantidad real después de decimales)")
    tx_hash: str = Field(..., description="Hash de la transacción del evento")
    block_number: int = Field(..., description="Número de bloque donde ocurrió el evento")

class TokenEventCreate(TokenEventBase):
    # No necesita campos adicionales más allá de TokenEventBase por ahora
    pass

class TokenEventRead(TokenEventBase):
    id: int # El ID del evento en la BD
    # Renombrar 'contract' a 'token_address_observed' y 'volume' a 'amount' para coincidir con el modelo Event
    # O, mejor, mantener consistencia con TokenEventBase y ajustar el modelo Event o la query si es necesario.
    # Por ahora, mantendremos los nombres de TokenEventBase para la API y el modelo Event usará estos.
    # Si el modelo Event usa 'token_address_observed' y 'amount', el mapeo debe hacerse en el endpoint o al construir el schema.
    # Vamos a alinear TokenEventRead con los nombres de campo que tiene el modelo Event.
    token_address_observed: str = Field(alias="contract") # Usar alias si los nombres de campo difieren
    amount: float = Field(alias="volume")                 # Usar alias
    
    created_at: datetime
    
    class Config:
        from_attributes = True
        # Permitir alias para mapear 'contract' a 'token_address_observed' y 'volume' a 'amount'
        # si los datos de la BD (modelo Event) tienen nombres diferentes a TokenEventBase.
        # Sin embargo, es más limpio si los nombres coinciden.
        # Voy a asumir que crud.create_event y los endpoints de lectura manejarán el mapeo
        # o que cambiaremos los nombres en el modelo Event para que coincidan con estos esquemas.
        # Por ahora, para la lectura, el modelo Event tiene `token_address_observed` y `amount`.
        # Y TokenEventCreate usa `contract` y `volume`.
        # Vamos a hacer TokenEventRead más directo con los campos del modelo Event:

# REVISIÓN DE TokenEventRead para alinear con el modelo Event
class TokenEventRead(BaseModel): # Quitamos la herencia de TokenEventBase para redefinir
    id: int
    watcher_id: int
    token_address_observed: str # Coincide con models.Event.token_address_observed
    from_address: str           # NUEVO, coincide con models.Event.from_address
    to_address: str             # NUEVO, coincide con models.Event.to_address
    amount: float               # Coincide con models.Event.amount
    transaction_hash: str
    block_number: int
    created_at: datetime
    class Config:
        from_attributes = True


# --- Schemas para Transport ---
class TransportBase(BaseModel):
    watcher_id: int 
    type: str = Field(..., description="Tipo de transporte, ej: 'slack', 'discord'")
    config: Dict[str, Any]

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