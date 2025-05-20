# api/app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON # <-- CAMBIO: Añadido para el campo config de Transport
from .config import Base

class Watcher(Base):
    __tablename__ = "watchers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    token_address = Column(String, nullable=False)
    threshold = Column(Float, nullable=False)
    webhook_url = Column(String, nullable=False)
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
    # Relación opcional a Transports, si quieres acceder a ellos desde un Watcher.
    # transports = relationship("Transport", back_populates="watcher")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    watcher_id = Column(
        Integer,
        ForeignKey("watchers.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_address_observed = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_hash = Column(String, unique=True, nullable=False, index=True)
    block_number = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    watcher = relationship("Watcher", back_populates="events")

class Transport(Base): # <-- CAMBIO: Nueva clase Transport añadida
    __tablename__ = "transports"

    id = Column(Integer, primary_key=True, index=True)
    watcher_id = Column(Integer, ForeignKey("watchers.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # Ej: "slack", "discord", "webhook_generic"
    config = Column(JSON, nullable=False)  # Ej: {"url": "https://hooks.slack.com/..."} o {"token": "xyz", "channel_id":"123"}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relación opcional al Watcher, si quieres acceder al watcher desde un transport.
    # watcher = relationship("Watcher", back_populates="transports")