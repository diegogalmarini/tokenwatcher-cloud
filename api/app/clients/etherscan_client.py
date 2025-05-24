# api/app/clients/etherscan_client.py
import requests
import time
from typing import Optional

from ..config import settings # Importamos la configuración

ETHERSCAN_API_URL = "https://api.etherscan.io/api"
API_KEY = settings.ETHERSCAN_API_KEY

def get_block_timestamp(block_number: int) -> Optional[int]:
    """
    Obtiene el timestamp Unix de un número de bloque específico usando Etherscan.

    Args:
        block_number: El número de bloque a consultar.

    Returns:
        El timestamp Unix (en segundos) o None si hay un error.
    """
    hex_block_number = hex(block_number)
    params = {
        "module": "proxy",
        "action": "eth_getBlockByNumber",
        "tag": hex_block_number,
        "boolean": "false",  # No necesitamos las transacciones completas, solo el header
        "apikey": API_KEY,
    }

    print(f"  📞 [ETHERSCAN_CLIENT] Consultando timestamp para bloque {block_number} ({hex_block_number})...")

    try:
        response = requests.get(ETHERSCAN_API_URL, params=params, timeout=15)
        response.raise_for_status()  # Lanza una excepción para errores HTTP (4xx o 5xx)
        data = response.json()

        if data.get("result") and data["result"].get("timestamp"):
            timestamp_hex = data["result"]["timestamp"]
            timestamp_int = int(timestamp_hex, 16)
            print(f"  ✅ [ETHERSCAN_CLIENT] Timestamp encontrado: {timestamp_int}")
            return timestamp_int
        else:
            error_message = data.get('error', {}).get('message', 'Respuesta inesperada')
            print(f"  ❌ [ETHERSCAN_CLIENT_ERROR] No se pudo obtener timestamp para bloque {block_number}. Etherscan dijo: {error_message}. Respuesta: {data}")
            return None

    except requests.exceptions.Timeout:
        print(f"  ❌ [ETHERSCAN_CLIENT_ERROR] Timeout al consultar timestamp para bloque {block_number}.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"  ❌ [ETHERSCAN_CLIENT_ERROR] Error de red al consultar timestamp para bloque {block_number}: {e}")
        return None
    except Exception as e:
        print(f"  ❌ [ETHERSCAN_CLIENT_ERROR] Error inesperado al consultar timestamp para bloque {block_number}: {e}")
        return None