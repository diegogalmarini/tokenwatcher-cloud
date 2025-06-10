# api/app/clients/coingecko_client.py
import requests
import time
import logging
from typing import Optional, Dict, Any
from ..config import settings # Importamos la configuración para acceder a la API Key

# Configuración del logger para este módulo
logger = logging.getLogger(__name__)

COINGECKO_API_URL = "https://api.coingecko.com/api/v3"

def get_historical_price_usd(token_address: str, timestamp: int, platform: str = "ethereum") -> Optional[float]:
    """
    Obtiene el precio histórico en USD de un token para un timestamp dado usando CoinGecko.
    """
    contract_address_lower = token_address.lower()
    from_timestamp = timestamp - 300
    to_timestamp = timestamp + 300

    url = f"{COINGECKO_API_URL}/coins/{platform}/contract/{contract_address_lower}/market_chart/range"
    params = {
        "vs_currency": "usd",
        "from": str(from_timestamp),
        "to": str(to_timestamp),
        "x_cg_demo_api_key": settings.COINGECKO_API_KEY # <-- AÑADIDO: Usamos la API Key
    }

    logger.info(f"  📞 [COINGECKO_CLIENT] Consultando precio para {contract_address_lower} cerca de {timestamp}...")

    try:
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code == 429:
            logger.warning("  ⚠️ [COINGECKO_CLIENT_WARN] Rate limited por CoinGecko. Esperando 10 segundos...")
            time.sleep(10)
            response = requests.get(url, params=params, timeout=15)

        response.raise_for_status()
        data = response.json()

        if data.get("prices") and len(data["prices"]) > 0:
            price = data["prices"][0][1]
            logger.info(f"  ✅ [COINGECKO_CLIENT] Precio encontrado: {price:.4f} USD")
            return float(price)
        else:
            logger.info(f"  ℹ️ [COINGECKO_CLIENT_INFO] No se encontró precio histórico para {contract_address_lower}.")
            return None

    except requests.exceptions.RequestException as e:
        logger.error(f"  ❌ [COINGECKO_CLIENT_ERROR] Error de red al consultar precio para {contract_address_lower}: {e}")
        return None
    except Exception as e:
        logger.error(f"  ❌ [COINGECKO_CLIENT_ERROR] Error inesperado al consultar precio para {contract_address_lower}: {e}")
        return None

# --- NUEVA FUNCIÓN PARA OBTENER DATOS DE MERCADO ---
def get_token_market_data(contract_address: str, platform: str = "ethereum") -> Optional[Dict[str, Any]]:
    """
    Obtiene el precio, market cap y volumen de 24h para un token en la red especificada.
    """
    contract_address_lower = contract_address.lower()
    url = f"{COINGECKO_API_URL}/coins/{platform}/contract/{contract_address_lower}"
    
    # Añadimos la API Key a los parámetros de la petición
    params = {
        "x_cg_demo_api_key": settings.COINGECKO_API_KEY
    }
    
    logger.info(f"  📞 [COINGECKO_CLIENT] Consultando datos de mercado para {contract_address_lower}...")

    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 429:
            logger.warning("  ⚠️ [COINGECKO_CLIENT_WARN] Rate limited por CoinGecko. Esperando 10 segundos...")
            time.sleep(10)
            response = requests.get(url, params=params, timeout=10)

        response.raise_for_status()
        data = response.json()

        market_data = data.get("market_data", {})
        
        price = market_data.get("current_price", {}).get("usd")
        market_cap = market_data.get("market_cap", {}).get("usd")
        total_volume_24h = market_data.get("total_volume", {}).get("usd")

        if price is None or market_cap is None or total_volume_24h is None:
            logger.warning(f"  ⚠️ [COINGECKO_CLIENT_WARN] Datos de mercado incompletos para {contract_address_lower}.")
            return None

        logger.info(f"  ✅ [COINGECKO_CLIENT] Datos de mercado encontrados para {data.get('symbol', '').upper()}.")
        return {
            "price": float(price),
            "market_cap": float(market_cap),
            "total_volume_24h": float(total_volume_24h),
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"  ❌ [COINGECKO_CLIENT_ERROR] Error al contactar la API de CoinGecko para {contract_address_lower}: {e}")
        return None
    except Exception as e:
        logger.error(f"  ❌ [COINGECKO_CLIENT_ERROR] Error inesperado al procesar datos de CoinGecko para {contract_address_lower}: {e}")
        return None