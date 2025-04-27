# api/app/config.py

import os
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class Settings(BaseSettings):
    # Credenciales y endpoints principales
    ETHERSCAN_API_KEY: str
    SLACK_WEBHOOK_URL: str
    DISCORD_WEBHOOK_URL: str
    # Pon aquí tu Internal Database URL (ver paso 2 abajo)
    DATABASE_URL: str

    # Polling
    POLL_INTERVAL: int = 30
    MAX_BLOCK_RANGE: int = 10000
    START_BLOCK: int = 0

    # Retry / backoff para notificaciones
    NOTIFY_MAX_RETRIES: int = 3
    NOTIFY_BACKOFF_BASE: float = 1.0

    # Batching de alertas
    SLACK_BATCH_SIZE: int = 5
    DISCORD_BATCH_SIZE: int = 5

    # URL base para enlaces Etherscan
    ETHERSCAN_TX_URL: str = "https://etherscan.io/tx"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", ".env")
        env_file_encoding = "utf-8"

settings = Settings()

# Motor y sesión de SQLAlchemy
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Asegúrate de usar la INTERNAL_DATABASE_URL de Render aquí
    # y forzar SSL + pre_ping
    engine = create_engine(
        settings.DATABASE_URL + "?sslmode=require",
        pool_pre_ping=True,
        connect_args={"sslmode": "require"},
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
