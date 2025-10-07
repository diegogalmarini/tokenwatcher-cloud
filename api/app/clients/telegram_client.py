# api/app/clients/telegram_client.py

import requests
import logging
from typing import Dict, Any

# Configuración del logger para este módulo
logger = logging.getLogger(__name__)

# URL base de la API de Bots de Telegram
TELEGRAM_API_BASE_URL = "https://api.telegram.org/bot"

def send_telegram_message(bot_token: str, chat_id: str, text: str) -> bool:
    """
    Envía un mensaje de texto a un chat de Telegram a través de un bot específico.

    Args:
        bot_token (str): El token de autenticación del bot de Telegram.
        chat_id (str): El ID único del chat de destino.
        text (str): El mensaje a enviar (soporta formato MarkdownV2 de Telegram).

    Returns:
        bool: True si el mensaje se envió con éxito, False en caso contrario.
    """
    if not bot_token or not chat_id or not text:
        logger.warning("send_telegram_message fue llamado con argumentos faltantes (bot_token, chat_id, o text).")
        return False

    # Construimos la URL del endpoint sendMessage de la API de Telegram
    url = f"{TELEGRAM_API_BASE_URL}{bot_token}/sendMessage"

    # El payload que espera la API de Telegram
    payload: Dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "MarkdownV2", # Usamos MarkdownV2 para formatear el texto
        "disable_web_page_preview": True, # Desactivamos la previsualización de enlaces para un mensaje más limpio
    }

    try:
        # Hacemos la petición POST a la API de Telegram
        response = requests.post(url, json=payload, timeout=10)
        
        # raise_for_status() lanzará una excepción para respuestas de error (4xx o 5xx)
        response.raise_for_status()

        # Verificamos que la respuesta de Telegram sea exitosa
        response_data = response.json()
        if response_data.get("ok"):
            logger.info(f"✅ Mensaje de Telegram enviado con éxito al chat ID {chat_id}.")
            return True
        else:
            # En caso de que la API devuelva ok: false con un código 200
            error_description = response_data.get('description', 'Unknown error')
            logger.error(f"❌ La API de Telegram devolvió un error para el chat ID {chat_id}: {error_description}")
            return False

    except requests.exceptions.RequestException as e:
        # Capturamos errores de red, timeouts, etc.
        logger.error(f"❌ Fallo en la solicitud a la API de Telegram para el chat ID {chat_id}: {e}")
        return False
    except Exception as e:
        # Capturamos cualquier otro error inesperado
        logger.exception(f"❌ Excepción no manejada al enviar mensaje de Telegram: {e}")
        return False