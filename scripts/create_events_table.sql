-- scripts/create_events_table.sql

CREATE TABLE IF NOT EXISTS events (
  id              BIGSERIAL PRIMARY KEY,
  watcher_id      BIGINT      NOT NULL REFERENCES watchers(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL,
  block_number    BIGINT      NOT NULL,
  transaction_hash TEXT       NOT NULL,
  amount          NUMERIC     NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_watcher_id ON events(watcher_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
