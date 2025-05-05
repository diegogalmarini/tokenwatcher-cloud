import os
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class Settings(BaseSettings):
    # On-chain API keys and endpoints
    ETHERSCAN_API_KEY: str
    ETHERSCAN_TX_URL: str = "https://etherscan.io/tx"

    # Notification webhooks
    SLACK_WEBHOOK_URL: str
    SLACK_BATCH_SIZE: int = 5
    DISCORD_WEBHOOK_URL: str
    DISCORD_BATCH_SIZE: int = 5

    # Database connection (Postgres or SQLite fallback)
    DATABASE_URL: str

    # Poller settings
    POLL_INTERVAL: int = 30
    MAX_BLOCK_RANGE: int = 10000
    START_BLOCK: int = 0

    # Retry / backoff
    NOTIFY_MAX_RETRIES: int = 3
    NOTIFY_BACKOFF_BASE: float = 1.0

    # S3 archival settings
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    S3_BUCKET: str
    AWS_REGION: str

    class Config:
        # Read exclusively from system env vars
        case_sensitive = True

# Instantiate settings (will raise if any required var is missing)
settings = Settings()

# Build SQLAlchemy engine & session
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    url = settings.DATABASE_URL
    # Enforce SSL for Postgres if not already present
    if "sslmode=" not in url:
        url += "?sslmode=require"
    engine = create_engine(
        url,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"},
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
