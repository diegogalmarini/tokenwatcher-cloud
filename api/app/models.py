# api/app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey, Boolean, Sequence, UniqueConstraint, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON # Asegúrate que JSON está importado
from .database import Base # Importar Base desde .database

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
    webhook_url = Column(String, nullable=True) # CAMBIO: Permitir que sea nulo
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="watchers")

    # Asegurar que las relaciones con cascade estén bien definidas
    events = relationship("Event", back_populates="watcher", cascade="all, delete-orphan", passive_deletes=True) # passive_deletes=True es importante si la BD usa ON DELETE CASCADE
    transports = relationship("Transport", back_populates="watcher", cascade="all, delete-orphan", passive_deletes=True)

class Event(Base):
    __tablename__ = "events"
    # id_seq = Sequence('events_id_seq') # SQLAlchemy 2.0 maneja secuencias implicitamente para identity si se usa server_default
    # Para PostgreSQL, podrías usar Identity strategy en lugar de Sequence directamente si es más simple.
    # Por ahora, mantendremos tu Sequence si así lo prefieres.
    id_seq = Sequence('events_id_seq') # Si usas esta secuencia, asegúrate que existe en la BD o se crea.
    id = Column(Integer, server_default=id_seq.next_value(), nullable=False) 
    watcher_id = Column(Integer, ForeignKey("watchers.id", ondelete="CASCADE"), nullable=False)
    token_address_observed = Column(String(42), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_hash = Column(String(66), nullable=False, index=True) 
    block_number = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)
    
    watcher = relationship("Watcher", back_populates="events")
    
    __table_args__ = (
        PrimaryKeyConstraint('id', 'created_at'), # Clave primaria compuesta para particionamiento
        UniqueConstraint('transaction_hash', 'created_at', name='uq_events_transaction_hash_created_at'),
        {
            'postgresql_partition_by': 'RANGE (created_at)'
        }
    )

class Transport(Base):
    __tablename__ = "transports"
    id = Column(Integer, primary_key=True, index=True)
    watcher_id = Column(Integer, ForeignKey("watchers.id", ondelete="CASCADE"), nullable=False) # ondelete="CASCADE" es bueno aquí
    type = Column(String(50), nullable=False) # "discord", "slack", etc.
    config = Column(JSON, nullable=False) # Ej: {"url": "http://discord_webhook_url"}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    watcher = relationship("Watcher", back_populates="transports")

class TokenVolume(Base):
    __tablename__ = "token_volumes"
    id = Column(Integer, primary_key=True, index=True) 
    contract = Column(String(42), unique=True, nullable=False, index=True)
    volume = Column(Float, nullable=False, default=0.0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())