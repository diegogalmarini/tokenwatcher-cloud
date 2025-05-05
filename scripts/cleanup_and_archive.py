#!/usr/bin/env python3
import os
import sys
import json
import logging
import tempfile
from datetime import datetime, timedelta

import boto3
import psycopg2
import psycopg2.extras

# Logging básico
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("cleanup_and_archive")

def main():
    # 1) Leer variables de entorno
    DATABASE_URL = os.getenv("DATABASE_URL")
    S3_BUCKET    = os.getenv("S3_BUCKET")
    AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")

    if not DATABASE_URL or not S3_BUCKET:
        logger.error("Faltan variables de entorno: DATABASE_URL y/o S3_BUCKET")
        sys.exit(1)

    # 2) Calculamos el cutoff de hace 1 día
    cutoff = datetime.utcnow() - timedelta(days=1)
    logger.info(f"Archiving events older than {cutoff.isoformat()}")

    # 3) Conectar a Postgres con psycopg2
    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    # Crear cursor servidor-side para streaming
    cur = conn.cursor(name="archive_cursor", cursor_factory=psycopg2.extras.DictCursor)
    cur.itersize = 1000
    cur.execute("SELECT * FROM token_events WHERE timestamp < %s", (cutoff,))

    # 4) Escribir JSON *streaming* en un fichero temporal
    tmp = tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".json")
    tmp.write("[")
    first = True
    for record in cur:
        row = dict(record)
        if not first:
            tmp.write(",")
        tmp.write(json.dumps(row, default=str))
        first = False
    tmp.write("]")
    tmp.flush()
    tmp.close()

    # Cierra cursor streaming
    cur.close()

    # 5) Subir fichero a S3
    key = f"token_events/{cutoff.strftime('%Y-%m-%d_%H%M%S')}.json"
    logger.info(f"Uploading to S3: s3://{S3_BUCKET}/{key}")
    s3 = boto3.client("s3", region_name=AWS_REGION)
    s3.upload_file(tmp.name, S3_BUCKET, key)
    logger.info("Upload a S3 completado.")

    # 6) Borrar los eventos antiguos
    cur2 = conn.cursor()
    cur2.execute("DELETE FROM token_events WHERE timestamp < %s", (cutoff,))
    conn.commit()
    logger.info(f"Eventos antiguos eliminados de la base de datos.")

    # 7) VACUUM ANALYZE
    cur2.execute("VACUUM ANALYZE token_events;")
    conn.commit()
    cur2.close()
    conn.close()
    logger.info("VACUUM ANALYZE realizado.")

    # 8) Eliminar fichero temporal
    os.remove(tmp.name)
    logger.info("Fichero temporal borrado.")

if __name__ == "__main__":
    main()
