# api/app/config.py

import os
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class Settings(BaseSettings):
    ETHERSCAN_API_KEY: str
    SLACK_WEBHOOK_URL: str
    DISCORD_WEBHOOK_URL: str
    DATABASE_URL: str

    POLL_INTERVAL: int = 30
    MAX_BLOCK_RANGE: int = 10000
    START_BLOCK: int = 0

    NOTIFY_MAX_RETRIES: int = 3
    NOTIFY_BACKOFF_BASE: float = 1.0

    SLACK_BATCH_SIZE: int = 5
    DISCORD_BATCH_SIZE: int = 5

    ETHERSCAN_TX_URL: str = "https://etherscan.io/tx"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), '..', '.env')
        env_file_encoding = "utf-8"

settings = Settings()

# Motor y sesión de SQLAlchemy
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Forzamos SSL y validación de conexiones caídas
    url = settings.DATABASE_URL
    if "sslmode" not in url:
        url += "?sslmode=require"
    engine = create_engine(
        url,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
