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
from sqlalchemy.orm import Session

# Ahora sí podemos importar tu configuración de SQLAlchemy
from api.app.config import engine, SessionLocal

# Logging
logger = logging.getLogger("cleanup_and_archive")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

def main():
    # 1) Lee variables
    DATABASE_URL = os.getenv("DATABASE_URL")
    S3_BUCKET    = os.getenv("S3_BUCKET")
    AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")

    if not DATABASE_URL or not S3_BUCKET:
        logger.error("Faltan variables de entorno: DATABASE_URL y/o S3_BUCKET")
        sys.exit(1)

    cutoff = datetime.utcnow() - timedelta(days=1)
    logger.info(f"Archiving events older than {cutoff.isoformat()}")

    # 2) Abre sesión y lee filas antiguas
    with SessionLocal() as session:
        rows = session.execute(
            text("SELECT * FROM token_events WHERE timestamp < :cutoff"),
            {"cutoff": cutoff}
        ).all()

        if not rows:
            logger.info("No hay eventos para archivar.")
            return

        # 3) Serializa y sube a S3
        payload = [dict(r._mapping) for r in rows]
        key = f"token_events/{cutoff.strftime('%Y-%m-%d_%H%M%S')}.json"
        logger.info(f"Uploading to S3: s3://{S3_BUCKET}/{key}")
        s3 = boto3.client("s3", region_name=AWS_REGION)
        s3.put_object(Bucket=S3_BUCKET, Key=key, Body=json.dumps(payload))
        logger.info("Upload a S3 completado.")

        # 4) Borra de la BD
        session.execute(
            text("DELETE FROM token_events WHERE timestamp < :cutoff"),
            {"cutoff": cutoff}
        )
        session.commit()
        logger.info("Eventos antiguos eliminados de la base de datos.")

    # 5) VACUUM ANALYZE fuera de transacción
    # Con psycopg2 direct para activar autocommit y evitar el error
    logger.info("Ejecutando VACUUM ANALYZE token_events;")
    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("VACUUM ANALYZE token_events;")
    cur.close()
    conn.close()
    logger.info("VACUUM ANALYZE realizado.")

if __name__ == "__main__":
    main()
