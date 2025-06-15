# api/app/rate_limiter.py

from slowapi import Limiter
from slowapi.util import get_remote_address

# El limiter ahora vive en su propio módulo para evitar importaciones circulares.
limiter = Limiter(key_func=get_remote_address)