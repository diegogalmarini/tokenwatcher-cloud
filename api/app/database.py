# api/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base # <-- AÑADIR declarative_base
from .config import settings # Asumimos que config.py SOLO tiene Settings

# CAMBIO: Mover engine y SessionLocal de config.py aquí
# y añadir la definición de Base.

DATABASE_URL_WITH_SSL = settings.DATABASE_URL
if settings.DATABASE_URL.startswith("postgresql") and "sslmode=" not in settings.DATABASE_URL:
    DATABASE_URL_WITH_SSL += "?sslmode=require"

engine = create_engine(
    DATABASE_URL_WITH_SSL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base() # <-- AÑADIR ESTA LÍNEA

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()