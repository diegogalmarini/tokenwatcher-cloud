import os
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class Settings(BaseSettings):
    ETHERSCAN_API_KEY: str
    SLACK_WEBHOOK_URL: str
    DISCORD_WEBHOOK_URL: str
    POLL_INTERVAL: int = 30
    MAX_BLOCK_RANGE: int = 10000
    START_BLOCK: int = 0
    DATABASE_URL: str = "sqlite:///./watchers.db"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), '..', '.env')
        env_file_encoding = "utf-8"

settings = Settings()

# Motor y sesión de SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # Solo para SQLite
)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)