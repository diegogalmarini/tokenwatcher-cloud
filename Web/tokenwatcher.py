#!/usr/bin/env python3
"""
TokenWatcher: Escanea bloques de Ethereum y notifica tokens con volumen alto.
Incluye:
 - Captura de eventos ERC‑20 Transfer por bloque.
 - Cache de símbolos vía Etherscan.
 - Filtro de logs con data vacía ("0x").
 - Manejo robusto de respuestas Etherscan para tokeninfo.
 - Notificaciones por Slack Webhook.
"""

import requests
import time

# ———————— CONFIGURACIÓN ————————
ETHERSCAN_API_KEY    = "8TDRQD2KN7J5499PYT4YFDZV32EHVSA34A"
SLACK_WEBHOOK_URL    = "https://hooks.slack.com/services/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"
# Para pruebas rápidas usa 1 wei; en producción, descomenta la línea siguiente y comenta la de 1 wei:
# VOLUME_THRESHOLD_WEI = 1             # 1 wei para prueba
VOLUME_THRESHOLD_WEI = 1 * 10**18  # 1 ETH en producción
POLL_INTERVAL        = 60            # segundos entre poll
TRANSFER_EVENT_SIG   = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
# ————————————————————————————

# Cache local de símbolos de token
_symbol_cache = {}

def get_token_symbol(token_addr: str) -> str:
    """
    Resuelve el símbolo de un token ERC‑20 usando la API `tokeninfo` de Etherscan.
    Cachea resultados y maneja respuestas inesperadas.
    """
    if token_addr in _symbol_cache:
        return _symbol_cache[token_addr]

    url = "https://api.etherscan.io/api"
    params = {
        "module": "token",
        "action": "tokeninfo",
        "contractaddress": token_addr,
        "apikey": ETHERSCAN_API_KEY
    }
    resp = requests.get(url, params=params).json()
    result = resp.get("result")

    symbol = None
    # Si result es dict con clave "symbol"
    if isinstance(result, dict):
        symbol = result.get("symbol")
    # Si result es lista de dicts
    elif isinstance(result, list) and result and isinstance(result[0], dict):
        symbol = result[0].get("symbol")
    # Fallback si no encontramos un símbolo válido
    if not symbol or not isinstance(symbol, str):
        symbol = token_addr[:6] + "…"

    _symbol_cache[token_addr] = symbol
    return symbol

def get_latest_block() -> int:
    """Devuelve el número del bloque más reciente en Ethereum."""
    url = "https://api.etherscan.io/api"
    params = {
        "module": "proxy",
        "action": "eth_blockNumber",
        "apikey": ETHERSCAN_API_KEY
    }
    result = requests.get(url, params=params).json()
    return int(result["result"], 16)

def get_token_transfers(block_number: int) -> list:
    """
    Captura todos los eventos ERC‑20 Transfer en un bloque dado.
    Devuelve lista de dicts: {tokenAddress, from, to, value}
    Ignora logs con data == "0x" y maneja parseo de hex.
    """
    url = "https://api.etherscan.io/api"
    params = {
        "module": "logs",
        "action": "getLogs",
        "fromBlock": block_number,
        "toBlock": block_number,
        "topic0": TRANSFER_EVENT_SIG,
        "apikey": ETHERSCAN_API_KEY
    }
    resp = requests.get(url, params=params).json()
    raw = resp.get("result", [])
    if not isinstance(raw, list):
        return []
    transfers = []
    for e in raw:
        data = e.get("data", "")
        # Ignorar logs sin valor
        if not data or data == "0x":
            continue
        try:
            value = int(data, 16)
        except ValueError:
            continue
        token_addr = e.get("address", "")
        topics = e.get("topics", [])
        frm = "0x" + topics[1][-40:] if len(topics) > 1 else "0x?"
        to  = "0x" + topics[2][-40:] if len(topics) > 2 else "0x?"
        transfers.append({
            "tokenAddress": token_addr,
            "from": frm,
            "to": to,
            "value": value
        })
    return transfers

def send_slack_notification(message: str):
    """Envía un mensaje a Slack vía Incoming Webhook."""
    requests.post(SLACK_WEBHOOK_URL, json={"text": message})

def main():
    """Bucle principal: monitorea bloques nuevos y notifica si superan el umbral."""
    last_block = get_latest_block()
    print(f"▶️  Iniciando monitor en bloque {last_block}")

    while True:
        latest = get_latest_block()
        if latest > last_block:
            print(f"🔍 Bloques nuevos: {last_block+1} → {latest}")
            for blk in range(last_block+1, latest+1):
                transfers = get_token_transfers(blk)
                print(f"  • Bloque {blk}: {len(transfers)} transferencias válidas")
                volumes = {}
                for tx in transfers:
                    addr = tx["tokenAddress"]
                    volumes[addr] = volumes.get(addr, 0) + tx["value"]
                for addr, vol in volumes.items():
                    eth_vol = vol / 1e18
                    sym    = get_token_symbol(addr)
                    print(f"    – {sym} ({addr}): {eth_vol:.6f} ETH")
                    if vol >= VOLUME_THRESHOLD_WEI:
                        msg = (f"💡 Token *{sym}* ({addr}) movió {eth_vol:.2f} ETH "
                               f"en bloque {blk}.")
                        print("    🚀 Notificando:", msg)
                        send_slack_notification(msg)
            last_block = latest
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
