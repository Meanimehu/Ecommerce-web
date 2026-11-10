-- Disposable entries for refreshing a session (Document 4, sections 4 and 9). They may be lost at any time without
-- weakening anything, because the consumed-token markers are always checked first; so the tables are UNLOGGED.

-- Only the holder of a session's lock may refresh it. Expires a little after the refresh call's timeout.
CREATE UNLOGGED TABLE web_store.refresh_locks (
  key_hash bytea PRIMARY KEY,
  holder text NOT NULL,
  expires_at timestamptz NOT NULL
);

-- The short-lived result of a refresh: a success (the new access token, encrypted) or a confirmed rejection.
-- Never the new refresh token. An unknown outcome is never stored.
CREATE UNLOGGED TABLE web_store.refresh_results (
  key_hash bytea PRIMARY KEY,
  outcome text NOT NULL CHECK (outcome IN ('success', 'rejected')),
  access_token_enc bytea,
  expires_in integer,
  reason text,
  expires_at timestamptz NOT NULL,
  CHECK ((outcome = 'success' AND access_token_enc IS NOT NULL AND expires_in IS NOT NULL) OR (outcome = 'rejected' AND reason IS NOT NULL))
);
CREATE INDEX refresh_results_expires_at ON web_store.refresh_results (expires_at);
CREATE INDEX refresh_locks_expires_at ON web_store.refresh_locks (expires_at);
