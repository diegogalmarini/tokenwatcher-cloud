# api/app/config.py
import os
from pydantic_settings import BaseSettings
from typing import Literal # Para el algoritmo

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
    DATABASE_URL: str # Esta URL será usada por database.py

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
    
    # --- NUEVAS VARIABLES PARA AUTENTICACIÓN JWT ---
    SECRET_KEY: str = "¡¡CAMBIAR_ESTO_EN_PRODUCCION_POR_UNA_CLAVE_SECRETA_FUERTE_Y_ALEATORIA!!" # ¡¡MUY IMPORTANTE!!
    ALGORITHM: Literal["HS256"] = "HS256" # Usaremos HS256
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Los tokens expirarán en 30 minutos

    class Config:
        case_sensitive = True
        # Para desarrollo local, si tienes un archivo .env en la raíz del proyecto backend:
        # env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
        # env_file_encoding = "utf-8"

settings = Settings()