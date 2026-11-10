-- The shared store (Document 4, section 4; D4-10). PostgreSQL, in a database used only by the frontend.
-- Only the security-critical class lives in ordinary (logged, durable) tables. Nothing here is ever removed except by
-- its own expiry time. Slice 1 adds the disposable entries (locks, short-lived refresh results).

CREATE SCHEMA IF NOT EXISTS web_store;

-- The permanent generation id (Document 4, section 9, "Store generation"). Exactly one row, created with the store and
-- never expired. After any possible loss of security-critical entries (a restore from backup, a failover that may have
-- dropped acknowledged writes, a manual deletion) it is replaced with: npm run store:new-generation -- --reason "..."
CREATE TABLE web_store.store_generation (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  generation_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL
);
INSERT INTO web_store.store_generation (generation_id, reason) VALUES (gen_random_uuid(), 'store created');

-- Consumed refresh-token markers. Keyed by a keyed hash of the refresh token, never the token itself (Document 4,
-- section 9). Written with an atomic "insert if absent" before the backend is called.
CREATE TABLE web_store.consumed_markers (
  key_hash bytea PRIMARY KEY,
  generation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);
CREATE INDEX consumed_markers_expires_at ON web_store.consumed_markers (expires_at);

-- "Already used" marks of pending adds (Document 2, section 3; Document 4, D4-08).
CREATE TABLE web_store.pending_add_marks (
  mark_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);
CREATE INDEX pending_add_marks_expires_at ON web_store.pending_add_marks (expires_at);

-- One row the start-up and regular checks write to, proving the store accepts durable writes right now.
CREATE TABLE web_store.store_probe (
  id smallint PRIMARY KEY CHECK (id = 1),
  written_at timestamptz NOT NULL
);
