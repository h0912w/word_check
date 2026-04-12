-- D1 state schema for keyword-metrics-collector
-- All tables use IF NOT EXISTS for idempotent bootstrap.

CREATE TABLE IF NOT EXISTS input_batches (
  input_batch_id TEXT PRIMARY KEY,
  word_count     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS shards (
  shard_id       TEXT    PRIMARY KEY,
  input_batch_id TEXT    NOT NULL REFERENCES input_batches(input_batch_id),
  file_path      TEXT    NOT NULL,
  row_count      INTEGER NOT NULL DEFAULT 0,
  checksum       TEXT    NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'pending'
                         CHECK(status IN ('pending','running','retry','done','failed')),
  retry_count    INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shards_status ON shards(status);
CREATE INDEX IF NOT EXISTS idx_shards_batch  ON shards(input_batch_id);

CREATE TABLE IF NOT EXISTS batch_runs (
  run_id              TEXT PRIMARY KEY,
  shard_id            TEXT NOT NULL REFERENCES shards(shard_id),
  batch_start_offset  INTEGER NOT NULL DEFAULT 0,
  batch_size          INTEGER NOT NULL DEFAULT 0,
  processed_count     INTEGER NOT NULL DEFAULT 0,
  api_status          TEXT    NOT NULL,
  started_at          TEXT    NOT NULL,
  completed_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_batch_runs_shard ON batch_runs(shard_id);
CREATE INDEX IF NOT EXISTS idx_batch_runs_date  ON batch_runs(started_at);

CREATE TABLE IF NOT EXISTS export_jobs (
  export_id       TEXT PRIMARY KEY,
  export_date     TEXT NOT NULL,
  export_batch_id TEXT NOT NULL,
  record_count    INTEGER NOT NULL DEFAULT 0,
  csv_path        TEXT NOT NULL,
  xlsx_path       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending','done','failed')),
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_date ON export_jobs(export_date);

CREATE TABLE IF NOT EXISTS publish_jobs (
  publish_id            TEXT PRIMARY KEY,
  export_id             TEXT NOT NULL REFERENCES export_jobs(export_id),
  drive_status          TEXT NOT NULL DEFAULT 'pending'
                             CHECK(drive_status IN ('pending','done','failed')),
  sheets_status         TEXT NOT NULL DEFAULT 'pending'
                             CHECK(sheets_status IN ('pending','done','failed')),
  drive_file_id_csv     TEXT,
  drive_file_id_xlsx    TEXT,
  source_record_count   INTEGER NOT NULL DEFAULT 0,
  drive_record_count    INTEGER NOT NULL DEFAULT 0,
  sheets_record_count   INTEGER NOT NULL DEFAULT 0,
  reconcile_status      TEXT    NOT NULL DEFAULT 'pending'
                               CHECK(reconcile_status IN ('ok','mismatch','pending')),
  verified_at           TEXT,
  created_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_export ON publish_jobs(export_id);

CREATE TABLE IF NOT EXISTS qa_runs (
  qa_run_id          TEXT PRIMARY KEY,
  publish_id         TEXT NOT NULL REFERENCES publish_jobs(publish_id),
  expected_row_count INTEGER NOT NULL DEFAULT 0,
  drive_row_count    INTEGER NOT NULL DEFAULT 0,
  drive_file_id_csv  TEXT,
  drive_file_id_xlsx TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pass','fail','error','pending')),
  checked_at         TEXT NOT NULL,
  failure_reason     TEXT
);

CREATE INDEX IF NOT EXISTS idx_qa_runs_publish ON qa_runs(publish_id);
