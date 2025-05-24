# api/app/clients/coingecko_client.py
import requests
import time
from typing import Optional

COINGECKO_API_URL = "https://api.coingecko.com/api/v3"

def get_historical_price_usd(token_address: str, timestamp: int, platform: str = "ethereum") -> Optional[float]:
    """
    Obtiene el precio histórico en USD de un token para un timestamp dado usando CoinGecko.

    Args:
        token_address: La dirección del contrato del token.
        timestamp: El timestamp Unix (en segundos) para el cual se busca el precio.
        platform: La plataforma blockchain (ej: 'ethereum').

    Returns:
        El precio en USD como float, o None si hay un error o no se encuentra.
    """
    # CoinGecko espera timestamps en segundos y prefiere direcciones en minúsculas
    contract_address_lower = token_address.lower()
    
    # Buscamos en un rango pequeño alrededor del timestamp para aumentar la probabilidad
    # de encontrar un punto de datos (ej: +/- 5 minutos = 600 segundos)
    from_timestamp = timestamp - 300
    to_timestamp = timestamp + 300

    url = f"{COINGECKO_API_URL}/coins/{platform}/contract/{contract_address_lower}/market_chart/range"
    params = {
        "vs_currency": "usd",
        "from": str(from_timestamp),
        "to": str(to_timestamp),
    }

    print(f"  📞 [COINGECKO_CLIENT] Consultando precio para {contract_address_lower} cerca de {timestamp}...")

    try:
        response = requests.get(url, params=params, timeout=15)
        
        # Manejo específico del rate limit de CoinGecko (429)
        if response.status_code == 429:
            print("  ⚠️ [COINGECKO_CLIENT_WARN] Rate limited por CoinGecko. Esperando 10 segundos...")
            time.sleep(10) # Espera simple. Podría mejorarse con backoff.
            response = requests.get(url, params=params, timeout=15) # Reintenta una vez

        response.raise_for_status()
        data = response.json()

        if data.get("prices") and len(data["prices"]) > 0:
            # CoinGecko devuelve una lista [timestamp_ms, price]. Tomamos el primer precio.
            price = data["prices"][0][1]
            print(f"  ✅ [COINGECKO_CLIENT] Precio encontrado: {price:.4f} USD")
            return float(price)
        else:
            print(f"  ℹ️ [COINGECKO_CLIENT_INFO] No se encontró precio histórico para {contract_address_lower} en el rango {from_timestamp}-{to_timestamp}.")
            return None

    except requests.exceptions.Timeout:
        print(f"  ❌ [COINGECKO_CLIENT_ERROR] Timeout al consultar precio para {contract_address_lower}.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"  ❌ [COINGECKO_CLIENT_ERROR] Error de red al consultar precio para {contract_address_lower}: {e}")
        return None
    except Exception as e:
        print(f"  ❌ [COINGECKO_CLIENT_ERROR] Error inesperado al consultar precio para {contract_address_lower}: {e}")
        return None