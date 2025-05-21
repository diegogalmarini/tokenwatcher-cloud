# api/app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey, UniqueConstraint, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from .database import Base 

# ... (Clases Watcher, Transport, TokenVolume como antes) ...

class Watcher(Base):
    __tablename__ = "watchers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    token_address = Column(String(42), nullable=False)
    threshold = Column(Float, nullable=False)
    webhook_url = Column(String, nullable=False) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    events = relationship("Event", back_populates="watcher", cascade="all, delete-orphan", passive_deletes=True)
    transports = relationship("Transport", back_populates="watcher", cascade="all, delete-orphan")

class Event(Base):
    __tablename__ = "events"
    
    # Columnas
    id = Column(Integer, index=True, nullable=False) # 'id' ya no es serial autoincrementado por defecto aquí, se maneja por PK
    watcher_id = Column(Integer, ForeignKey("watchers.id", ondelete="CASCADE"), nullable=False)
    token_address_observed = Column(String(42), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_hash = Column(String(66), nullable=False, index=True) 
    block_number = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)

    watcher = relationship("Watcher", back_populates="events")

    # CAMBIOS CLAVE PARA RESTRICCIONES EN TABLA PARTICIONADA:
    __table_args__ = (
        PrimaryKeyConstraint('id', 'created_at'), # Clave primaria compuesta
        UniqueConstraint('transaction_hash', 'created_at', name='uq_events_transaction_hash_created_at'), # Restricción de unicidad compuesta
        {
            'postgresql_partition_by': 'RANGE (created_at)'
        }
    )

class Transport(Base):
    __tablename__ = "transports"
    id = Column(Integer, primary_key=True, index=True)
    watcher_id = Column(Integer, ForeignKey("watchers.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    config = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    watcher = relationship("Watcher", back_populates="transports")

class TokenVolume(Base):
    __tablename__ = "token_volumes"
    id = Column(Integer, primary_key=True, index=True) 
    contract = Column(String(42), unique=True, nullable=False, index=True)
    volume = Column(Float, nullable=False, default=0.0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())