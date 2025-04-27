-- sql/PURGE_TOKEN_EVENTS.sql
DELETE FROM token_events
 WHERE created_at < NOW() - INTERVAL '30 days';
