#!/usr/bin/env python3
import os
import sys
import json
import logging
from datetime import datetime, timedelta

# ---- Permite importar tu paquete api/ desde este script ----
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
# --------------------------------------------------------------

import boto3
import psycopg2
from sqlalchemy import text
# from sqlalchemy.orm import Session # No se usa Session directamente aquí, sino SessionLocal

# CAMBIO: Importar SessionLocal desde database y settings desde config
from api.app.database import SessionLocal
from api.app.config import settings # Para S3_BUCKET, AWS_REGION, DATABASE_URL si no usas os.getenv directamente

# Logging
logger = logging.getLogger("cleanup_and_archive")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)] # Asegurar que los logs vayan a stdout para Render
)

def main():
    logger.info("🚀 Iniciando script de limpieza y archivado de eventos...")

    # 1) Lee variables de entorno (usando el objeto settings o directamente os.getenv)
    # Usar el objeto settings es más consistente si ya lo tienes configurado.
    DATABASE_URL = settings.DATABASE_URL
    S3_BUCKET    = settings.S3_BUCKET
    AWS_REGION   = settings.AWS_REGION
    # AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY son leídos automáticamente por boto3 del entorno.

    if not DATABASE_URL or not S3_BUCKET:
        logger.error("❌ Faltan variables de entorno críticas: DATABASE_URL y/o S3_BUCKET. Terminando script.")
        sys.exit(1)

    # CAMBIO: Usar el nombre de columna correcto 'created_at'
    # El número de días para el corte de eventos.
    # ---- MODIFICACIÓN AQUÍ: Cambiamos el default de 1 a 7 ----
    DAYS_TO_KEEP = int(os.getenv("EVENT_RETENTION_DAYS", "7")) # Mantener 7 días por defecto
    # ---- FIN DE LA MODIFICACIÓN ----
    cutoff_date = datetime.utcnow() - timedelta(days=DAYS_TO_KEEP)
    logger.info(f"🗓️  Archivando y purgando eventos más antiguos que: {cutoff_date.isoformat()} UTC (política de {DAYS_TO_KEEP} días)")


    # Nombre de la tabla de eventos (debe coincidir con models.Event.__tablename__)
    EVENTS_TABLE_NAME = "events"

    events_to_archive = []
    # 2) Abre sesión y lee filas antiguas
    try:
        with SessionLocal() as session: # Usar SessionLocal del módulo database
            logger.info(f"ℹ️  Consultando eventos antiguos en la tabla '{EVENTS_TABLE_NAME}'...")
            # Usar columna 'created_at'
            result_proxy = session.execute(
                text(f"SELECT * FROM {EVENTS_TABLE_NAME} WHERE created_at < :cutoff_date ORDER BY created_at ASC"),
                {"cutoff_date": cutoff_date}
            )
            # Convertir las filas a diccionarios
            events_to_archive = [dict(row._mapping) for row in result_proxy]

            if not events_to_archive:
                logger.info("✅ No hay eventos antiguos para archivar y purgar esta vez.")
                return # Salir si no hay nada que hacer

            logger.info(f"📄 Encontrados {len(events_to_archive)} eventos para archivar.")

            # 3) Serializa y sube a S3
            s3_file_key = f"archived_events/{datetime.utcnow().strftime('%Y-%m-%d_%H-%M-%S')}_event_archive.json"
            
            logger.info(f"📦 Subiendo {len(events_to_archive)} eventos a S3: s3://{S3_BUCKET}/{s3_file_key}")
            s3_client = boto3.client("s3", region_name=AWS_REGION)
            
            def datetime_converter(o):
                if isinstance(o, datetime):
                    return o.isoformat()
            
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_file_key,
                Body=json.dumps(events_to_archive, default=datetime_converter, indent=2), # Añadido indent=2 para legibilidad en S3
                ContentType="application/json"
            )
            logger.info(f"✅ Upload a S3 completado: {s3_file_key}")

            # 4) Borra de la BD (solo si la subida a S3 fue exitosa)
            logger.info(f"🗑️  Eliminando {len(events_to_archive)} eventos archivados de la tabla '{EVENTS_TABLE_NAME}' en la base de datos...")
            event_ids_to_delete = [event['id'] for event in events_to_archive] # Asumimos que todos los eventos tienen 'id'
            
            # Necesitamos también las 'created_at' para la clave primaria compuesta
            # Creamos una lista de tuplas (id, created_at)
            # Nota: Asegúrate que los objetos 'event' en 'events_to_archive' tengan 'created_at' como objeto datetime
            # o como string ISO formateado si la consulta SQL los devuelve así.
            # El json.dumps con default=datetime_converter lo maneja para S3, pero aquí lo necesitamos para la query.
            # Si `event['created_at']` ya es un string ISO, está bien. Si es datetime, también.
            
            # Para borrar de forma segura con PK compuesta, es mejor iterar o usar una condición más compleja
            # o borrar por una lista de IDs si 'id' es suficientemente único para este propósito de borrado.
            # Dado que usamos `PrimaryKeyConstraint('id', 'created_at')`, borrar solo por 'id' puede ser ambiguo
            # si los IDs no son globalmente únicos a través de particiones.
            # Sin embargo, si `id` es un SERIAL y siempre incrementa, debería ser seguro.
            # Vamos a mantener el borrado por IDs por simplicidad, asumiendo que son los IDs correctos de los eventos archivados.

            if event_ids_to_delete:
                # Construir la condición para borrar por la clave primaria compuesta (id, created_at)
                # Esto es más seguro si la tabla está particionada y los IDs no son únicos globalmente.
                # Sin embargo, si los IDs de `events_to_archive` son los correctos, podemos usarlos.
                # La forma más simple si los IDs son de la tabla principal y únicos para esos eventos:
                placeholders = ", ".join([f":id_{i}" for i in range(len(event_ids_to_delete))])
                delete_statement = text(f"DELETE FROM {EVENTS_TABLE_NAME} WHERE id IN ({placeholders})")
                
                params_for_delete = {f"id_{i}": event_id for i, event_id in enumerate(event_ids_to_delete)}

                # O si quieres ser más preciso con la PK compuesta, necesitarías los created_at también:
                # conditions = " OR ".join([f"(id = :id_{i} AND created_at = :created_at_{i})" for i in range(len(events_to_archive))])
                # delete_statement = text(f"DELETE FROM {EVENTS_TABLE_NAME} WHERE {conditions}")
                # params_for_delete = {}
                # for i, event_item in enumerate(events_to_archive):
                #     params_for_delete[f"id_{i}"] = event_item['id']
                #     params_for_delete[f"created_at_{i}"] = event_item['created_at'] # Asegurarse que esto sea un datetime o string compatible con la DB

                session.execute(delete_statement, params_for_delete)
                session.commit()
                logger.info(f"✅ {len(event_ids_to_delete)} eventos antiguos eliminados de la base de datos.")
            else:
                logger.info("ℹ️ No se encontraron IDs para eliminar.")

    except Exception as e:
        logger.error(f"❌ Error durante el proceso de selección o borrado de eventos / subida a S3: {e}", exc_info=True)
        # No salimos con sys.exit(1) aquí para permitir que VACUUM intente ejecutarse si es un error no crítico de S3
        # Pero si el error fue en la consulta o borrado de BD, VACUUM podría no ser ideal.
        # Considera la granularidad del manejo de errores. Por ahora, lo logueamos.

    # 5) VACUUM ANALYZE fuera de transacción y usando psycopg2 directamente para autocommit
    logger.info(f"🧹 Ejecutando VACUUM ANALYZE en la tabla '{EVENTS_TABLE_NAME}'...")
    db_conn_for_vacuum = None # Para asegurar que se cierra
    try:
        conn_string = settings.DATABASE_URL
        if conn_string.startswith("postgresql://"): # psycopg2 usa 'postgres' o nada para el esquema
            conn_string = conn_string.replace("postgresql://", "postgres://", 1)

        db_conn_for_vacuum = psycopg2.connect(conn_string)
        db_conn_for_vacuum.autocommit = True
        with db_conn_for_vacuum.cursor() as cur:
            cur.execute(f"VACUUM ANALYZE {EVENTS_TABLE_NAME};")
            logger.info(f"✅ VACUUM ANALYZE en '{EVENTS_TABLE_NAME}' completado.")
    except Exception as e:
        logger.error(f"❌ Error durante VACUUM ANALYZE: {e}", exc_info=True)
    finally:
        if db_conn_for_vacuum:
            db_conn_for_vacuum.close()
            logger.info("ℹ️ Conexión de Psycopg2 (para VACUUM) cerrada.")
    
    logger.info("🎉 Script de limpieza y archivado finalizado.")

if __name__ == "__main__":
    main()