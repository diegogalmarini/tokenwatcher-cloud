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
    DAYS_TO_KEEP = int(os.getenv("EVENT_RETENTION_DAYS", "1")) # Mantener 1 día por defecto
    cutoff_date = datetime.utcnow() - timedelta(days=DAYS_TO_KEEP)
    logger.info(f"🗓️  Archivando eventos más antiguos que: {cutoff_date.isoformat()} UTC")

    # Nombre de la tabla de eventos (debe coincidir con models.Event.__tablename__)
    EVENTS_TABLE_NAME = "events" # CAMBIO: Nombre de tabla consistente

    events_to_archive = []
    # 2) Abre sesión y lee filas antiguas
    try:
        with SessionLocal() as session: # Usar SessionLocal del módulo database
            logger.info(f"ℹ️  Consultando eventos antiguos en la tabla '{EVENTS_TABLE_NAME}'...")
            # CAMBIO: Usar columna 'created_at'
            result_proxy = session.execute(
                text(f"SELECT * FROM {EVENTS_TABLE_NAME} WHERE created_at < :cutoff_date ORDER BY created_at ASC"),
                {"cutoff_date": cutoff_date}
            )
            events_to_archive = [dict(row._mapping) for row in result_proxy]

            if not events_to_archive:
                logger.info("✅ No hay eventos antiguos para archivar esta vez.")
                return

            logger.info(f"📄 Encontrados {len(events_to_archive)} eventos para archivar.")

            # 3) Serializa y sube a S3
            # Crear un nombre de archivo único para el archivo S3, ej: events_archive_YYYY-MM-DD_HH-MM-SS.json
            s3_file_key = f"archived_events/{datetime.utcnow().strftime('%Y-%m-%d_%H-%M-%S')}_event_archive.json"
            
            logger.info(f"📦 Subiendo {len(events_to_archive)} eventos a S3: s3://{S3_BUCKET}/{s3_file_key}")
            s3_client = boto3.client("s3", region_name=AWS_REGION)
            
            # Convertir datetimes a string ISO para serialización JSON
            def datetime_converter(o):
                if isinstance(o, datetime):
                    return o.isoformat()
            
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_file_key,
                Body=json.dumps(events_to_archive, default=datetime_converter),
                ContentType="application/json"
            )
            logger.info(f"✅ Upload a S3 completado: {s3_file_key}")

            # 4) Borra de la BD (solo si la subida a S3 fue exitosa)
            logger.info(f"🗑️  Eliminando {len(events_to_archive)} eventos archivados de la tabla '{EVENTS_TABLE_NAME}' en la base de datos...")
            # CAMBIO: Usar columna 'created_at'
            # Es más seguro borrar por IDs si los tienes, para evitar borrar eventos que se insertaron mientras se subía a S3.
            # Pero si el volumen no es masivo y el proceso es rápido, borrar por fecha de corte es más simple.
            # Para mayor seguridad, podrías borrar por los IDs específicos que acabas de archivar.
            event_ids_to_delete = [event['id'] for event in events_to_archive]
            if event_ids_to_delete:
                session.execute(
                    text(f"DELETE FROM {EVENTS_TABLE_NAME} WHERE id = ANY(:ids_to_delete)"),
                    {"ids_to_delete": event_ids_to_delete}
                )
                session.commit()
                logger.info(f"✅ {len(event_ids_to_delete)} eventos antiguos eliminados de la base de datos.")
            else:
                logger.info("ℹ️  No se encontraron IDs para eliminar (esto no debería pasar si events_to_archive no estaba vacío).")

    except Exception as e:
        logger.error(f"❌ Error durante el proceso de selección o borrado de eventos / subida a S3: {e}", exc_info=True)
        sys.exit(1) # Salir si hay error para no ejecutar VACUUM en un estado inconsistente

    # 5) VACUUM ANALYZE fuera de transacción y usando psycopg2 directamente para autocommit
    logger.info(f"🧹 Ejecutando VACUUM ANALYZE en la tabla '{EVENTS_TABLE_NAME}'...")
    try:
        # Usar la DATABASE_URL directamente de settings para consistencia, ya que psycopg2 no usa el objeto 'engine' de SQLAlchemy
        # La URL de Render ya suele incluir ?sslmode=require o se maneja por el entorno
        conn_string = settings.DATABASE_URL
        # Psycopg2 no entiende el prefijo postgresql://, necesita postgres:// o ser adaptado
        if conn_string.startswith("postgresql://"):
            conn_string = conn_string.replace("postgresql://", "postgres://", 1)

        conn = psycopg2.connect(conn_string) # SSL se maneja por la URL de Render o variables de entorno
        conn.autocommit = True # VACUUM no puede correr dentro de una transacción en algunos contextos.
        with conn.cursor() as cur:
            cur.execute(f"VACUUM ANALYZE {EVENTS_TABLE_NAME};") # CAMBIO: Nombre de tabla
            logger.info(f"✅ VACUUM ANALYZE en '{EVENTS_TABLE_NAME}' completado.")
    except Exception as e:
        logger.error(f"❌ Error durante VACUUM ANALYZE: {e}", exc_info=True)
    finally:
        if 'conn' in locals() and conn:
            conn.close()
            logger.info("ℹ️  Conexión de Psycopg2 cerrada.")
    
    logger.info("🎉 Script de limpieza y archivado finalizado.")

if __name__ == "__main__":
    main()