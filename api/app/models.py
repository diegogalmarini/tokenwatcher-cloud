# api/app/models.py

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float,
    DateTime, ForeignKey
)
from sqlalchemy.orm import relationship, declarative_base
from .config import engine

Base = declarative_base()

class Watcher(Base):
    __tablename__ = "watchers"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String,  nullable=False)
    contract   = Column(String,  nullable=False)
    threshold  = Column(Float,   nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    events     = relationship(
        "TokenEvent",
        back_populates="watcher",
        cascade="all, delete-orphan"
    )
    transports = relationship(
        "Transport",
        back_populates="watcher",
        cascade="all, delete-orphan"
    )

class TokenEvent(Base):
    __tablename__ = "token_events"
    id         = Column(Integer, primary_key=True, index=True)
    watcher_id = Column(Integer, ForeignKey("watchers.id"), nullable=False)
    contract   = Column(String,  nullable=False)
    volume     = Column(Float,   nullable=False)
    tx_hash    = Column(String,  nullable=False)
    timestamp  = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    watcher    = relationship("Watcher", back_populates="events")

class Transport(Base):
    __tablename__ = "transports"
    id         = Column(Integer, primary_key=True, index=True)
    watcher_id = Column(Integer, ForeignKey("watchers.id"), nullable=False)
    type       = Column(String,  nullable=False)   # "slack" | "discord" | "email" | ...
    address    = Column(String,  nullable=False)   # webhook URL, email address, etc.
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    watcher    = relationship("Watcher", back_populates="transports")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas (watchers, token_events, transports) creadas con éxito")
