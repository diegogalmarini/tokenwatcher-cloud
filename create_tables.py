# create_tables.py

from api.app.config import engine, settings
from api.app.models import Base

def main():
    print(f"▶️  Conectando a {settings.DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas con éxito")

if __name__ == "__main__":
    main()
