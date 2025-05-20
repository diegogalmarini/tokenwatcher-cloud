# create_tables.py

# CAMBIO: Importar 'engine' desde 'api.app.database'
# CAMBIO: Importar 'settings' desde 'api.app.config'
# CAMBIO: Importar 'Base' a través de 'api.app.models' (que a su vez lo importa de database.Base)
from api.app.database import engine # Engine ahora viene de database.py
from api.app.config import settings # Settings sigue viniendo de config.py
from api.app.models import Base     # Base ahora se importa a través de models.py

def main():
    print(f"▶️  [CREATE_TABLES] Conectando a la base de datos (usando settings desde config.py)...")
    # La URL de conexión ya está implícita en 'engine'
    print(f"▶️  [CREATE_TABLES] Intentando crear tablas definidas en Base (desde models.py)...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ [CREATE_TABLES] Tablas verificadas/creadas con éxito.")
    except Exception as e:
        print(f"❌ [CREATE_TABLES_ERROR] Error al crear tablas: {e}")
        # Considera si quieres que el script salga con error aquí
        # import sys
        # sys.exit(1)

if __name__ == "__main__":
    main()