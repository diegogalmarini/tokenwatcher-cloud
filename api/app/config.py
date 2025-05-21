# api/app/config.py
import os
from pydantic_settings import BaseSettings
from typing import Literal 

class Settings(BaseSettings):
    # ... (tus otras variables como ETHERSCAN_API_KEY, DATABASE_URL, etc.) ...
    ETHERSCAN_API_KEY: str
    ETHERSCAN_TX_URL: str = "https://etherscan.io/tx"
    SLACK_WEBHOOK_URL: str
    SLACK_BATCH_SIZE: int = 5
    DISCORD_WEBHOOK_URL: str
    DISCORD_BATCH_SIZE: int = 5
    DATABASE_URL: str 
    POLL_INTERVAL: int = 30
    MAX_BLOCK_RANGE: int = 10000
    START_BLOCK: int = 0
    NOTIFY_MAX_RETRIES: int = 3
    NOTIFY_BACKOFF_BASE: float = 1.0
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    S3_BUCKET: str
    AWS_REGION: str
    
    # --- Variables para Autenticación JWT ---
    # Esta variable DEBE estar definida en tu entorno (ej. en Render o en tu .env local)
    # Pydantic lanzará un error al iniciar si no la encuentra, lo cual es bueno.
    SECRET_KEY: str 
    ALGORITHM: Literal["HS256"] = "HS256" # Este puede tener un default seguro en el código.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Este también puede tener un default seguro.

    class Config:
        case_sensitive = True
        # Pydantic-settings buscará un archivo .env por defecto si no se especifica env_file.
        # Para desarrollo local, asegúrate que tu archivo .env esté en la raíz del proyecto
        # desde donde ejecutas la aplicación (normalmente la raíz de tokenwatcher-cloud).
        # Si Pydantic-settings no encuentra el .env o la variable no está en el entorno,
        # y no hay default en la clase Settings (como ahora para SECRET_KEY), la app fallará al iniciar.

settings = Settings()