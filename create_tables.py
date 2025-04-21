# api/create_tables.py

from app.config import engine, settings
from app.models import Base

def main():
    """
    Levanta todas las tablas definidas en app.models.Base
    usando el engine configurado en app.config.
    """
    print(f"▶️  Conectando a {settings.SQLALCHEMY_DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas con éxito")

if __name__ == "__main__":
    main()
