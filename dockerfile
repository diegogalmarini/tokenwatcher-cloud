# usa Python 3.11 slim
FROM python:3.11-slim

# evita buffers en stdout/err y cachés pip
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# directorio de la app dentro del contenedor
WORKDIR /app

# copia requisitos e instala pip + gunicorn + deps
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install gunicorn \
 && pip install -r requirements.txt

# copia todo el proyecto
COPY . .

# exponemos el puerto 8000
EXPOSE 8000

# comando de arranque: gunicorn con workers UVicorn
CMD ["gunicorn", 
     "-k", "uvicorn.workers.UvicornWorker", 
     "api.app.main:app", 
     "--bind", "0.0.0.0:8000", 
     "--workers", "1", 
     "--timeout", "120"]
