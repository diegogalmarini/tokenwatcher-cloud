# En api/app/notifier.py
def notify_discord_embed(watcher_obj: Any, events_list: List[Any]) -> None:
    if not settings.DISCORD_WEBHOOK_URL or settings.DISCORD_WEBHOOK_URL == "YOUR_DISCORD_WEBHOOK_URL_HERE":
        print("    ℹ️ [NOTIFY_INFO] Discord webhook URL not configured. Skipping Discord notification.")
        return

    if not events_list:
        print("    ℹ️ [DISCORD_INFO] Lista de eventos vacía, no se enviarán notificaciones a Discord.")
        return

    batch_size = settings.DISCORD_BATCH_SIZE
    for i in range(0, len(events_list), batch_size):
        batch = events_list[i:i + batch_size]
        embeds: List[Dict[str, Any]] = []
        
        print(f"    ℹ️ [DISCORD_BATCH_PROC] Procesando lote de {len(batch)} evento(s) para Discord.")

        for event_item in batch:
            etherscan_url = f"{settings.ETHERSCAN_TX_URL}/{event_item.transaction_hash}"
            when_utc = event_item.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
            
            embed_fields = [
                {"name": "Token Address", "value": _truncate_field(f"`{watcher_obj.token_address}`"), "inline": False},
                {"name": "Amount",   "value": _truncate_field(f"{event_item.amount:.4f}"),    "inline": True},
                {"name": "Block",    "value": _truncate_field(str(event_item.block_number)),      "inline": True},
                {"name": "When (Detected UTC)",     "value": _truncate_field(when_utc),                       "inline": False},
                {"name": "Transaction", "value": f"[View on Etherscan]({etherscan_url})", "inline": False},
            ]
            if hasattr(event_item, 'token_address_observed') and event_item.token_address_observed != watcher_obj.token_address:
                embed_fields.insert(1, {"name": "Actual Token (Event)", "value": _truncate_field(f"`{event_item.token_address_observed}`"), "inline": False})

            embed = {
                "title": f"🚨 Token Alert: {watcher_obj.name} (Batch {i//batch_size + 1})", # Añadir info de lote al título
                "color": 15548997, 
                "fields": embed_fields,
                "footer": {"text": "TokenWatcher-Cloud"}
            }
            embeds.append(embed)

        if not embeds:
            continue # No debería pasar si el lote no está vacío, pero por si acaso

        payload = {"embeds": embeds}
        
        # Lógica de envío con reintentos (igual que antes, pero ahora por lote)
        success = False
        for attempt in range(1, settings.NOTIFY_MAX_RETRIES + 1):
            try:
                resp = requests.post(settings.DISCORD_WEBHOOK_URL, json=payload, timeout=10)
                resp.raise_for_status()
                print(f"    ✅ [NOTIFY_SUCCESS] Lote de Discord enviado para watcher '{watcher_obj.name}'.")
                success = True
                break # Salir del bucle de reintentos si es exitoso
            except requests.exceptions.RequestException as e:
                print(f"    ❌ [NOTIFY_ERROR] Discord API request failed para lote (attempt {attempt}): {e}")
                if attempt < settings.NOTIFY_MAX_RETRIES:
                    _backoff_sleep(attempt, settings.NOTIFY_MAX_RETRIES, settings.NOTIFY_BACKOFF_BASE)
                else:
                    print(f"    ❌ [NOTIFY_FATAL] Falló envío de lote de Discord para watcher '{watcher_obj.name}' después de {settings.NOTIFY_MAX_RETRIES} intentos.")
        
        if success and (i + batch_size) < len(events_list): # Si hay más lotes por enviar
            print(f"    ℹ️ [DISCORD_BATCH_DELAY] Esperando antes de enviar el siguiente lote de Discord para evitar rate limit...")
            time.sleep(2) # Un pequeño delay entre envíos de lotes a Discord podría ayudar

    # La función `notify` que llama a notify_slack_blockkit y notify_discord_embed ya no es necesaria en watcher.py
    # si watcher.py llama directamente a notify_slack_blockkit y notify_discord_embed.
    # O, puedes mantener la función `notify` en notifier.py pero necesitaría ser adaptada para manejar listas también,
    # o que watcher.py la llame por cada canal.
    # Por simplicidad, la llamada directa desde watcher.py a notify_slack_blockkit y notify_discord_embed es más clara ahora.