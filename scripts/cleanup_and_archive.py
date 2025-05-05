import os
import argparse
import json
import logging
from datetime import datetime, timedelta

import boto3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de logging
t=logging.getLogger("cleanup_and_archive")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# Argumentos de CLI
def parse_args():
    parser = argparse.ArgumentParser(description="Archiva y limpia token_events en Postgres y S3")
    parser.add_argument("--dry-run", action="store_true", help="No realiza cambios, solo simula")
    return parser.parse_args()


def main(dry_run: bool):
    # Parámetros de entorno
    DATABASE_URL = os.getenv("DATABASE_URL")
    S3_BUCKET = os.getenv("S3_BUCKET")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

    if not DATABASE_URL or not S3_BUCKET:
        t.error("Faltan variables de entorno: DATABASE_URL y/o S3_BUCKET")
        return

    # Conectar a Postgres\ n    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    cutoff = datetime.utcnow() - timedelta(days=1)
    t.info(f"Arquivando eventos anteriores a {cutoff.isoformat()}")

    # Seleccionar eventos antiguos
    query = text("SELECT * FROM token_events WHERE timestamp < :cutoff")
    old_events = session.execute(query, {"cutoff": cutoff}).fetchall()
    if not old_events:
        t.info("No hay eventos para archivar.")
        return

    # Preparar datos para S3
    payload = [dict(row) for row in old_events]
    key = f"token_events/{cutoff.strftime('%Y-%m-%d_%H%M%S')}.json"
    t.info(f"Preparando {len(payload)} eventos para S3: s3://{S3_BUCKET}/{key}")

    if not dry_run:
        # Subir a S3
        s3 = boto3.client("s3", region_name=AWS_REGION)
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(payload)
        )
        t.info("Upload a S3 completado.")

        # Borrar los eventos archivados\ n        delete_q = text("DELETE FROM token_events WHERE timestamp < :cutoff")
        session.execute(delete_q, {"cutoff": cutoff})
        session.commit()
        t.info("Eventos antiguos eliminados de la base de datos.")

        # Liberar espacio en Postgres
        with engine.connect() as conn:
            conn.execute(text("VACUUM ANALYZE token_events;"))
        t.info("VACUUM ANALYZE realizado.")
    else:
        t.info("Dry run completo, sin cambios aplicados.")


if __name__ == "__main__":
    args = parse_args()
    main(dry_run=args.dry_run)

# Para programar en Render:
# 0 2 * * * python scripts/cleanup_and_archive.py
