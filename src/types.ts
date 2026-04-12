export interface MetricsRecord {
  word: string;
  avg_monthly_searches: number | null;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  competition_index: number | null;
  monthly_searches_raw: unknown;
  collected_at: string;
  api_status: 'success' | 'failed';
  retry_count: number;
  source_shard: string;
  source_offset: number;
  input_batch_id: string;
  export_date: string;
  export_batch_id: string;
  row_key: string;
}

export interface Env {
  RESULTS_BUCKET: R2Bucket;
  STATE_DB: D1Database;
  GOOGLE_ADS_CUSTOMER_ID: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;
  GOOGLE_ADS_DEVELOPER_TOKEN: string;
  GOOGLE_ADS_CLIENT_ID: string;
  GOOGLE_ADS_CLIENT_SECRET: string;
  GOOGLE_ADS_REFRESH_TOKEN: string;
  GOOGLE_ADS_LANGUAGE_CONSTANT: string;
  GOOGLE_ADS_GEO_TARGET_CONSTANT: string;
  GOOGLE_DRIVE_FOLDER_ID: string;
  GOOGLE_SHEETS_SPREADSHEET_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
}

export interface ShardEntry {
  shard_id: string;
  input_batch_id: string;
  file_path: string;
  row_count: number;
  checksum: string;
  status: 'pending' | 'running' | 'retry' | 'done' | 'failed';
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface ShardManifest {
  input_batch_id: string;
  created_at: string;
  shards: Array<{
    shard_id: string;
    file_path: string;
    row_count: number;
    checksum: string;
  }>;
}

export interface ExportJob {
  export_id: string;
  export_date: string;
  export_batch_id: string;
  record_count: number;
  csv_path: string;
  xlsx_path: string;
  status: 'pending' | 'done' | 'failed';
  created_at: string;
}

export interface PublishJob {
  publish_id: string;
  export_id: string;
  drive_status: 'pending' | 'done' | 'failed';
  sheets_status: 'pending' | 'done' | 'failed';
  drive_file_id_csv: string | null;
  drive_file_id_xlsx: string | null;
  source_record_count: number;
  drive_record_count: number;
  sheets_record_count: number;
  reconcile_status: 'ok' | 'mismatch' | 'pending';
  verified_at: string | null;
  created_at: string;
}

export interface QaResult {
  run_id: string;
  status: 'pass' | 'fail' | 'error';
  expected_row_count: number;
  drive_row_count: number;
  drive_file_id_csv: string | null;
  drive_file_id_xlsx: string | null;
  checked_at: string;
  failure_reason: string | null;
}
