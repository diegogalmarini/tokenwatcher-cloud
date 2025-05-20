# api/app/watcher.py (solo el final del archivo, el resto permanece igual a la versión que te di antes)

# ... (resto del código de watcher.py sin cambios) ...

if __name__ == "__main__":
    # CAMBIO: Importar SessionLocal desde database.py
    from api.app.database import SessionLocal
    # crud y schemas ya se importan relativamente al principio del archivo watcher.py
    # from api.app.crud import get_watchers, create_event # No es necesario reimportar así

    db = SessionLocal()
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")
    print("▶ [CRON RUN] Initializing TokenWatcher Poller...")
    try:
        poll_and_notify(
            db=db,
            # Las lambdas ahora usan crud y schemas directamente porque están en el mismo ámbito
            # o son importados correctamente al inicio de watcher.py
            get_watchers_func=lambda: crud.get_watchers(db),
            create_event_func=lambda data_dict: crud.create_event(db, schemas.TokenEventCreate(**data_dict))
        )
    except Exception as e:
        print(f"❌ [CRON_FATAL_ERROR] Unhandled exception in watcher cron run: {e!r}")
    finally:
        db.close()
        print("▶ [CRON RUN] Database session closed. Poller finished.")
    print("■■■■■■■■■■■■■■■■■■■■■■■■■■■■")