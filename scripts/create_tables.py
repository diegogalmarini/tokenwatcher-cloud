import sys
import os
from sqlalchemy.orm import Session

# Añadimos la ruta del proyecto al sys.path para que los imports funcionen
# desde fuera de la carpeta 'api'
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

# Ahora podemos importar los módulos de la aplicación
from api.app.database import engine, Base
from api.app.models import Plan
from api.app.config import settings

def create_initial_plan(db: Session):
    """
    Crea el plan 'Free' si no existe.
    """
    print("▶️  [INIT_PLANS] Verificando si el plan 'Free' existe...")
    free_plan = db.query(Plan).filter(Plan.name == "Free").first()
    
    if not free_plan:
        print("    ℹ️ [INIT_PLANS] El plan 'Free' no existe, creándolo...")
        
        default_limit = 3 # Tu nuevo límite para el plan gratuito
        
        new_free_plan = Plan(
            name="Free",
            description="The default plan for all new users.",
            price_monthly=0,
            price_annually=0,
            watcher_limit=default_limit,
            is_active=True
        )
        db.add(new_free_plan)
        db.commit()
        print(f"    ✅ [INIT_PLANS] Plan 'Free' creado con un límite de {default_limit} watchers.")
    else:
        print("    ✅ [INIT_PLANS] El plan 'Free' ya existe.")

def main():
    print("▶️  [CREATE_TABLES] Conectando a la base de datos...")
    try:
        # Crea todas las tablas definidas en Base (de models.py)
        Base.metadata.create_all(bind=engine)
        print("✅ [CREATE_TABLES] Tablas verificadas/creadas con éxito.")
        
        # Abre una sesión para crear el plan inicial
        with Session(engine) as session:
            create_initial_plan(session)
            
    except Exception as e:
        print(f"❌ [CREATE_TABLES_ERROR] No se pudieron crear/verificar las tablas: {e}")

if __name__ == "__main__":
    main()