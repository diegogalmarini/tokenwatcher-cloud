-- Borra eventos antiguos de la tabla token_events para evitar crecimiento ilimitado
-- Mantiene solo los últimos 5 días de historial.
DELETE FROM token_events
WHERE created_at < now() - INTERVAL '2 days';

-- Opcional: optimiza la tabla después de borrar muchos registros (solo en PostgreSQL)
VACUUM ANALYZE token_events;
