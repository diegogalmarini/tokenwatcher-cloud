# api/app/rate_limiter.py

from slowapi import Limiter
from slowapi.util import get_remote_address

# El limiter vive en su propio módulo para evitar importaciones circulares.
# Tanto main.py como auth.py lo importarán desde aquí.
limiter = Limiter(key_func=get_remote_address)