# api/app/config.py

import os
from pydantic_settings import BaseSettings
# Se añade EmailStr para validar el formato del correo
from typing import Literal
from pydantic import EmailStr

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

    # --- Variables para envíos de correo con Resend ---
    RESEND_API_KEY: str
    MAIL_FROM: EmailStr # Usamos EmailStr para validar

    # --- URL base de tu Frontend (para construir links de reset/verificación) ---
    FRONTEND_BASE_URL: str
    NEXT_PUBLIC_FRONTEND_BASE_URL: str

    # --- VARIABLES PARA EMAILS DE ADMINISTRACIÓN Y CONTACTO ---
    ADMIN_EMAIL: EmailStr
    # === NUEVA VARIABLE AÑADIDA ===
    CONTACT_FORM_RECIPIENT_EMAIL: EmailStr
    
    # --- LÍMITE DE WATCHERS POR DEFECTO ---
    DEFAULT_WATCHER_LIMIT: int = 5

    # --- NUEVAS VARIABLES PARA UMBRAL INTELIGENTE Y COINGECKO ---
    COINGECKO_API_KEY: str
    MINIMUM_WATCHER_THRESHOLD_USD: int = 100
    SUGGESTED_THRESHOLD_VOLUME_PERCENT: float = 0.005   # 0.5%
    MINIMUM_THRESHOLD_VOLUME_PERCENT: float = 0.001     # 0.1%

    class Config:
        case_sensitive = True
        # Apunta a tu .env (que debe estar en la raíz del proyecto)
        env_file = ".env"

# Instancia única de Settings
settings = Settings()