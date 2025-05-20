# api/app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base # Asegúrate de que este import sea correcto para tu estructura

class Watcher(Base):
    __tablename__ = "watchers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)  # <-- CAMBIO: Añadido 'name', asumimos que no puede ser nulo
    token_address = Column(String, nullable=False)
    threshold = Column(Float, nullable=False)
    webhook_url = Column(String, nullable=False) # En tu schema es HttpUrl, aquí es String. Usualmente String en el modelo está bien.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    events = relationship(
        "Event",
        back_populates="watcher",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

class Event(Base):
    __tablename__ = "events" # Tu script cleanup_and_archive.py usa 'token_events'. Asegura consistencia con el nombre real de tu tabla.

    id = Column(Integer, primary_key=True, index=True)
    watcher_id = Column(
        Integer,
        ForeignKey("watchers.id", ondelete="CASCADE"), # Si watchers.id cambia, esto se actualiza o borra
        nullable=False,
    )
    # Los siguientes campos deben coincidir con lo que `watcher.py` intenta guardar en `payload` para `create_event`.
    # payload = { "watcher_id": w.id, "contract": w.contract, "volume": amt, "tx_hash": tx["hash"], "block_number": int(tx["blockNumber"]) }
    # Necesitamos mapear esto a los campos del modelo Event.
    # 'contract' en payload -> podría ser 'token_address_observed' si es diferente al del watcher, o no guardarlo si es el mismo.
    # 'volume' en payload -> 'amount' en tu modelo Event.
    # 'tx_hash' en payload -> 'transaction_hash' en tu modelo Event.
    # 'block_number' en payload -> 'block_number' en tu modelo Event.
    # 'event_type' estaba en tu modelo original. ¿Sigue siendo necesario o lo deducimos? Por ahora lo comento.
    # event_type = Column(String, nullable=False)

    # Usaremos los campos que directamente vienen del payload de watcher.py y son persistidos
    token_address_observed = Column(String, nullable=False) # Mapea 'contract' del payload del evento
    amount = Column(Float, nullable=False) # Mapea 'volume' del payload del evento
    transaction_hash = Column(String, unique=True, nullable=False, index=True) # Mapea 'tx_hash', unique para evitar duplicados
    block_number = Column(Integer, nullable=False, index=True) # Mapea 'block_number'

    created_at = Column(DateTime(timezone=True), server_default=func.now()) # Esto es el timestamp de cuando se guarda el evento en *tu* BD

    watcher = relationship("Watcher", back_populates="events")