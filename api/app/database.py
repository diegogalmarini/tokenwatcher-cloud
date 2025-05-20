# api/app/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"} if settings.DATABASE_URL.startswith("postgresql") else {}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

def get_db():
    """
    Dependencia de FastAPI: obtiene una sesión de DB y la cierra tras usarla.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
