# api/app/config.py

import os
from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # Configuración de la base de datos
    DATABASE_URL: str

    # Variables genéricas de tu app
    ETHERSCAN_API_KEY: str
    ETHERSCAN_TX_URL: str = "https://etherscan.io/tx"
    SLACK_WEBHOOK_URL: str
    SLACK_BATCH_SIZE: int = 5
    DISCORD_WEBHOOK_URL: str
    DISCORD_BATCH_SIZE: int = 5
    POLL_INTERVAL: int = 30
    MAX_BLOCK_RANGE: int = 10000
    START_BLOCK: int = 0
    NOTIFY_MAX_RETRIES: int = 3
    NOTIFY_BACKOFF_BASE: float = 1.0
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    S3_BUCKET: str
    AWS_REGION: str
    MONTHS_AHEAD: int = 2

    # --- Variables para Autenticación JWT ---
    SECRET_KEY: str
    ALGORITHM: Literal["HS256"] = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- Variables para envíos de correo con SendGrid ---
    SENDGRID_API_KEY: str
    MAIL_FROM: str

    # --- URL base de tu Frontend (para construir links de reset/verificación) ---
    FRONTEND_BASE_URL: str

    # --- VARIABLE PARA EL EMAIL DEL ADMINISTRADOR ---
    ADMIN_EMAIL: str
    
    # --- NUEVA VARIABLE PARA EL LÍMITE DE WATCHERS ---
    DEFAULT_WATCHER_LIMIT: int = 5

    class Config:
        case_sensitive = True
        # Apunta a tu .env (que debe estar en la raíz del proyecto)
        env_file = ".env"

# Instancia única de Settings
settings = Settings()