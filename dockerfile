FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# deps
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install gunicorn uvicorn \
 && pip install -r requirements.txt

# copia el código
COPY . .

EXPOSE 8000

# copiamos y damos permiso al entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
