CREATE TABLE IF NOT EXISTS sync_accounts (
 account_id TEXT PRIMARY KEY,
 auth_hash TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 active_upload TEXT,
 count INTEGER NOT NULL DEFAULT 0,
 bytes INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sync_chunks (
 account_id TEXT NOT NULL,
 upload_id TEXT NOT NULL,
 idx INTEGER NOT NULL,
 data TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (account_id, upload_id, idx)
);
CREATE INDEX IF NOT EXISTS idx_sync_chunks_owner ON sync_chunks(account_id,upload_id);
