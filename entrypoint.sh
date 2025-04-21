#!/usr/bin/env bash
set -e

# 1) Asegúrate de que las tablas existen
python create_tables.py

# 2) Arranca Gunicorn
exec gunicorn -k uvicorn.workers.UvicornWorker api.app.main:app \
  --bind 0.0.0.0:8000 \
  --workers 1 \
  --timeout 120
