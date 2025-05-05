#!/usr/bin/env python3
import os
import sys
import json
import logging
import tempfile
from datetime import datetime, timedelta

# ---- AÑADE EL ROOT DEL PROYECTO AL PATH ----
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
# --------------------------------------------

import boto3
from sqlalchemy import text
from api.app.config import engine, SessionLocal

# Logging
logger = logging.getLogger("cleanup_and_archive")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

def main():
    DATABASE_URL = os.getenv("DATABASE_URL")
    S3_BUCKET    = os.getenv("S3_BUCKET")
    AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")

    if not DATABASE_URL or not S3_BUCKET:
        logger.error("Faltan variables de entorno: DATABASE_URL y/o S3_BUCKET")
        return

    cutoff = datetime.utcnow() - timedelta(days=1)
    logger.info(f"Archiving events older than {cutoff.isoformat()}")

    # 1) Abrir conexión raw de psycopg2
    raw_conn = engine.raw_connection()
    cur = raw_conn.cursor()
    cur.execute(
        "SELECT * FROM token_events WHERE timestamp < %s",
        (cutoff,)
    )

    # 2) Obtener nombres de columnas
    cols = [desc[0] for desc in cur.description]

    # 3) Crear fichero temporal y abrir array JSON
    tmp = tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".json")
    tmp.write("[")
    first = True

    # 4) Iterar en bloques de 1000
    while True:
        batch = cur.fetchmany(1000)
        if not batch:
            break
        for record in batch:
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

    # 5) Subir a S3
    s3 = boto3.client("s3", region_name=AWS_REGION)
    s3.upload_file(tmp.name, S3_BUCKET, key)
    logger.info("Upload a S3 completado.")

    # 6) Borrar registros antiguos
    with SessionLocal() as session:
        session.execute(
            text("DELETE FROM token_events WHERE timestamp < :cutoff"),
            {"cutoff": cutoff}
        )
        session.commit()
        logger.info("Eventos antiguos eliminados de la base de datos.")

    # 7) VACUUM ANALYZE
    with engine.connect() as conn:
        conn.execute(text("VACUUM ANALYZE token_events;"))
    logger.info("VACUUM ANALYZE realizado.")

    # 8) Borrar fichero temporal
    os.remove(tmp.name)

if __name__ == "__main__":
    main()
