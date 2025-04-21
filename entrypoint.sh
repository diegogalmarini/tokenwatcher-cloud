#!/usr/bin/env bash
set -e

# 1) Inicializa la base de datos (tablas)
python create_tables.py

# 2) Arranca Gunicorn con Uvicorn
exec gunicorn \
  -k uvicorn.workers.UvicornWorker \
  api.app.main:app \
  --bind 0.0.0.0:8000 \
  --workers 1 \
  --timeout 120
