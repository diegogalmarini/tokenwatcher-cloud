#!/usr/bin/env python3
import os
import sys
import json
import logging
import tempfile
from datetime import datetime, timedelta

# ---- AÑADE ROOT al path para encontrar tu paquete api/ ----
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
# ---------------------------------------------------------

import boto3
from sqlalchemy import text
from api.app.config import engine, SessionLocal

# Logging
logger = logging.getLogger("cleanup_and_archive")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

def main():
    # Vars de entorno
    DATABASE_URL = os.getenv("DATABASE_URL")
    S3_BUCKET    = os.getenv("S3_BUCKET")
    AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")

    if not DATABASE_URL or not S3_BUCKET:
        logger.error("Faltan variables de entorno: DATABASE_URL y/o S3_BUCKET")
        return

    # cutoff hace 1 día
    cutoff = datetime.utcnow() - timedelta(days=1)
    logger.info(f"Archiving events older than {cutoff.isoformat()}")

    # 1) Crear cursor server-side para no cargar todo en RAM
    raw_conn = engine.raw_connection()
    cur = raw_conn.cursor(name="archive_cursor")
    cur.itersize = 1000
    cur.execute(
        "SELECT * FROM token_events WHERE timestamp < %s",
        (cutoff,)
    )

    # 2) Escribir JSON por trozos a un temp file
    tmp = tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".json")
    tmp.write("[")
    first = True

    # Cabeceras
    cols = [d[0] for d in cur.description]

    for record in cur:
        row = dict(zip(cols, record))
        if not first:
            tmp.write(",")
        tmp.write(json.dumps(row))
        first = False

    tmp.write("]")
    tmp.flush()
    tmp.close()
    cur.close()
    raw_conn.close()

    key = f"token_events/{cutoff.strftime('%Y-%m-%d_%H%M%S')}.json"
    logger.info(f"Uploading to S3: s3://{S3_BUCKET}/{key}")

    # 3) Subir con boto3 usando multipart si hace falta
    s3 = boto3.client("s3", region_name=AWS_REGION)
    s3.upload_file(tmp.name, S3_BUCKET, key)
    logger.info("Upload a S3 completado.")

    # 4) Eliminar viejos de la DB
    with SessionLocal() as session:
        session.execute(
            text("DELETE FROM token_events WHERE timestamp < :cutoff"),
            {"cutoff": cutoff}
        )
        session.commit()
        logger.info("Eventos antiguos eliminados de la base de datos.")

    # 5) VACUUM ANALYZE
    with engine.connect() as conn:
        conn.execute(text("VACUUM ANALYZE token_events;"))
    logger.info("VACUUM ANALYZE realizado.")

    # 6) Borrar el temp file
    os.remove(tmp.name)

if __name__ == "__main__":
    main()
