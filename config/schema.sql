-- Word Check SQLite Database Schema
-- This schema defines all tables required for tracking input batches,
-- shards, batch runs, export jobs, and publish jobs.

-- Input batches table
-- Tracks each uploaded input file batch
CREATE TABLE IF NOT EXISTS input_batches (
  input_batch_id TEXT PRIMARY KEY,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  source_filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'prepared',
  normalized_path TEXT NOT NULL
);

-- Index on status for efficient querying
CREATE INDEX IF NOT EXISTS idx_input_batches_status ON input_batches(status);

-- Shards table
-- Tracks each shard and its processing state
CREATE TABLE IF NOT EXISTS shards (
  shard_id TEXT PRIMARY KEY,
  input_batch_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'retry', 'done', 'failed')),
  current_offset INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_run_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (input_batch_id) REFERENCES input_batches(input_batch_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_shards_status ON shards(status);
CREATE INDEX IF NOT EXISTS idx_shards_input_batch ON shards(input_batch_id);

-- Batch runs table
-- Tracks each batch execution for monitoring and debugging
CREATE TABLE IF NOT EXISTS batch_runs (
  run_id TEXT PRIMARY KEY,
  shard_id TEXT NOT NULL,
  batch_start_offset INTEGER NOT NULL,
  batch_size INTEGER NOT NULL,
  api_status TEXT NOT NULL,
  processed_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (shard_id) REFERENCES shards(shard_id)
);

-- Index on shard_id for querying run history
CREATE INDEX IF NOT EXISTS idx_batch_runs_shard ON batch_runs(shard_id);
CREATE INDEX IF NOT EXISTS idx_batch_runs_created ON batch_runs(created_at);

-- Export jobs table
-- Tracks export operations
CREATE TABLE IF NOT EXISTS export_jobs (
  export_id TEXT PRIMARY KEY,
  export_date TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  record_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  output_csv_path TEXT NOT NULL,
  output_xlsx_path TEXT NOT NULL
);

-- Index on export_date and status for querying
CREATE INDEX IF NOT EXISTS idx_export_jobs_date ON export_jobs(export_date);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);

-- Publish jobs table
-- Tracks publish operations to Drive and Sheets
CREATE TABLE IF NOT EXISTS publish_jobs (
  publish_id TEXT PRIMARY KEY,
  export_id TEXT NOT NULL,
  drive_status TEXT NOT NULL,
  sheets_status TEXT NOT NULL,
  drive_file_id TEXT,
  sheet_tab_name TEXT,
  source_record_count INTEGER NOT NULL,
  drive_record_count INTEGER NOT NULL DEFAULT 0,
  sheets_record_count INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (export_id) REFERENCES export_jobs(export_id)
);

-- Index on export_id for querying publish status
CREATE INDEX IF NOT EXISTS idx_publish_jobs_export ON publish_jobs(export_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_created ON publish_jobs(created_at);

-- Keyword results table
-- Stores collected keyword metrics
CREATE TABLE IF NOT EXISTS keyword_results (
  row_key TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  avg_monthly_searches REAL,
  competition TEXT,
  competition_index REAL,
  monthly_searches_raw TEXT, -- JSON string
  collected_at TEXT NOT NULL DEFAULT (datetime('now')),
  api_status TEXT NOT NULL CHECK(api_status IN ('success', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  source_shard TEXT NOT NULL,
  source_offset INTEGER NOT NULL,
  input_batch_id TEXT NOT NULL,
  export_date TEXT,
  export_batch_id TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_keyword_results_word ON keyword_results(word);
CREATE INDEX IF NOT EXISTS idx_keyword_results_batch ON keyword_results(input_batch_id);
CREATE INDEX IF NOT EXISTS idx_keyword_results_shard ON keyword_results(source_shard);
CREATE INDEX IF NOT EXISTS idx_keyword_results_export_date ON keyword_results(export_date);
CREATE INDEX IF NOT EXISTS idx_keyword_results_api_status ON keyword_results(api_status);
CREATE INDEX IF NOT EXISTS idx_keyword_results_collected ON keyword_results(collected_at);
