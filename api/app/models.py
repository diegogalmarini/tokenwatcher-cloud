# api/app/models.py

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Numeric,
    Boolean,
    ForeignKey,
    DateTime,
    UniqueConstraint,
    PrimaryKeyConstraint,
    DECIMAL
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from typing import List, Dict, Any, Optional

from .database import Base
from .config import settings

class Plan(Base):
    __tablename__ = "plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    price_monthly: Mapped[int] = mapped_column(Integer, nullable=False) 
    price_annually: Mapped[int] = mapped_column(Integer, nullable=False)
    watcher_limit: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    stripe_price_id_monthly: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    stripe_price_id_annually: Mapped[Optional[str]] = mapped_column(String, nullable=True)

class Subscription(Base):
    __tablename__ = "subscriptions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("plans.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="inactive") # por ejemplo: active, inactive, cancelled
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True, index=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    user: Mapped["User"] = relationship("User", back_populates="subscription")
    plan: Mapped["Plan"] = relationship("Plan")

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True, index=True)

    watchers: Mapped[List["Watcher"]] = relationship(
        "Watcher", back_populates="owner", cascade="all, delete-orphan"
    )
    subscription: Mapped[Optional["Subscription"]] = relationship(
        "Subscription", back_populates="user", cascade="all, delete-orphan", uselist=False
    )

    @property
    def is_admin(self) -> bool:
        return self.email == settings.ADMIN_EMAIL
        
    @property
    def watcher_count(self) -> int:
        return len(self.watchers)

    @property
    def plan(self) -> str:
        if self.subscription and self.subscription.status == 'active':
            return self.subscription.plan.name
        return "Free"

    @property
    def watcher_limit(self) -> int:
        if self.subscription and self.subscription.status == 'active':
            return self.subscription.plan.watcher_limit
        
        free_plan_limit = settings.DEFAULT_WATCHER_LIMIT
        try:
            with Session(engine) as session:
                free_plan = session.query(Plan).filter(Plan.name == "Free").first()
                if free_plan:
                    return free_plan.watcher_limit
                return free_plan_limit
        except:
             return free_plan_limit


class Watcher(Base):
    __tablename__ = "watchers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String, index=True)
    token_address: Mapped[str] = mapped_column(String, index=True)
    threshold: Mapped[float] = mapped_column(Numeric(30, 18))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship("User", back_populates="watchers")
    transports: Mapped[List["Transport"]] = relationship(
        "Transport", back_populates="watcher", cascade="all, delete-orphan"
    )
    events: Mapped[List["TokenEvent"]] = relationship(
        "TokenEvent", back_populates="watcher", cascade="all, delete-orphan"
    )

class Transport(Base):
    __tablename__ = "transports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    watcher_id: Mapped[int] = mapped_column(Integer, ForeignKey("watchers.id"))
    type: Mapped[str] = mapped_column(String)
    config: Mapped[Dict[str, Any]] = mapped_column(JSONB)

    watcher: Mapped["Watcher"] = relationship("Watcher", back_populates="transports")

class TokenEvent(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    watcher_id: Mapped[int] = mapped_column(Integer, ForeignKey("watchers.id"))
    token_address_observed: Mapped[str] = mapped_column(String, index=True)
    from_address: Mapped[str] = mapped_column(String, index=True)
    to_address: Mapped[str] = mapped_column(String, index=True)
    
    amount: Mapped[float] = mapped_column(Numeric(78, 18))
    
    transaction_hash: Mapped[str] = mapped_column(String, index=True)
    block_number: Mapped[int] = mapped_column(Integer)
    usd_value: Mapped[Optional[float]] = mapped_column(
        DECIMAL(20, 4), nullable=True
    )

    token_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    token_symbol: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), primary_key=True
    )

    watcher: Mapped["Watcher"] = relationship(back_populates="events")

    __table_args__ = (
        PrimaryKeyConstraint("id", "created_at"),
        UniqueConstraint(
            "transaction_hash", "id", "created_at", name="uq_tx_hash_id_created"
        ),
        {"postgresql_partition_by": "RANGE (created_at)"},
    )