#!/usr/bin/env python3
import os
import json
import logging
from datetime import datetime, timedelta

import boto3
from sqlalchemy import text
from sqlalchemy.orm import Session

# Importamos el engine y SessionLocal de nuestra configuración
from api.app.config import engine, SessionLocal

# Configuración de logging
logger = logging.getLogger("cleanup_and_archive")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

def main():
    # Lectura de variables de entorno
    DATABASE_URL = os.getenv("DATABASE_URL")
    S3_BUCKET    = os.getenv("S3_BUCKET")
    AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")

    if not DATABASE_URL or not S3_BUCKET:
        logger.error("Faltan variables de entorno: DATABASE_URL y/o S3_BUCKET")
        return

    # Calculamos el cutoff de hace 1 día
    cutoff = datetime.utcnow() - timedelta(days=1)
    logger.info(f"Archiving events older than {cutoff.isoformat()}")

    # Abrimos sesión contra Postgres
    with SessionLocal() as session:
        # 1) Seleccionar eventos antiguos
        rows = session.execute(
            text("SELECT * FROM token_events WHERE timestamp < :cutoff"),
            {"cutoff": cutoff}
        ).all()

        if not rows:
            logger.info("No hay eventos para archivar.")
            return

        # 2) Serializar a JSON
        payload = [dict(row._mapping) for row in rows]
        key = f"token_events/{cutoff.strftime('%Y-%m-%d_%H%M%S')}.json"
        logger.info(f"Preparando {len(payload)} eventos para S3: s3://{S3_BUCKET}/{key}")

        # 3) Subir a S3
        s3 = boto3.client("s3", region_name=AWS_REGION)
        s3.put_object(Bucket=S3_BUCKET, Key=key, Body=json.dumps(payload))
        logger.info("Upload a S3 completado.")

        # 4) Borrar de la base de datos
        session.execute(
            text("DELETE FROM token_events WHERE timestamp < :cutoff"),
            {"cutoff": cutoff}
        )
        session.commit()
        logger.info("Eventos antiguos eliminados de la base de datos.")

    # 5) VACUUM ANALYZE para compactar y actualizar estadísticas
    with engine.connect() as conn:
        conn.execute(text("VACUUM ANALYZE token_events;"))
    logger.info("VACUUM ANALYZE realizado.")

if __name__ == "__main__":
    main()
