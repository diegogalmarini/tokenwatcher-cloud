# api/app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey, Boolean, Sequence, UniqueConstraint, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from .database import Base

# --- Modelo User ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    watchers = relationship("Watcher", back_populates="owner", cascade="all, delete-orphan")

class Watcher(Base):
    __tablename__ = "watchers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    token_address = Column(String(42), nullable=False)
    threshold = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="watchers")

    events = relationship("Event", back_populates="watcher", cascade="all, delete-orphan", passive_deletes=True)
    transports = relationship("Transport", back_populates="watcher", cascade="all, delete-orphan", passive_deletes=True)

class Event(Base):
    __tablename__ = "events"
    id_seq = Sequence('events_id_seq') 
    id = Column(Integer, server_default=id_seq.next_value(), nullable=False) 
    watcher_id = Column(Integer, ForeignKey("watchers.id", ondelete="CASCADE"), nullable=False)
    token_address_observed = Column(String(42), nullable=False)
    
    # NUEVOS CAMPOS From y To Address
    from_address = Column(String(42), nullable=False, index=True) # Dirección de origen
    to_address = Column(String(42), nullable=False, index=True)   # Dirección de destino
    
    amount = Column(Float, nullable=False)
    transaction_hash = Column(String(66), nullable=False, index=True) 
    block_number = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)
    
    watcher = relationship("Watcher", back_populates="events")
    
    __table_args__ = (
        PrimaryKeyConstraint('id', 'created_at'),
        UniqueConstraint('transaction_hash', 'created_at', 'from_address', 'to_address', 'amount', name='uq_events_unique_event_fields'), # Ajustada para mayor unicidad si es necesario
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