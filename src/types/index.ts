// Core data contract types
export interface KeywordMetricRecord {
  word: string;
  avg_monthly_searches: number | null;
  competition: string | null;
  competition_index: number | null;
  monthly_searches_raw: MonthlySearchesEntry[] | null;
  collected_at: string;
  api_status: "success" | "failed";
  retry_count: number;
  source_shard: string;
  source_offset: number;
  input_batch_id: string;
  export_date?: string;
  export_batch_id?: string;
  row_key?: string;
}

export interface MonthlySearchesEntry {
  year: number;
  month: number;
  count: number;
}

export interface GoogleAdsHistoricalMetricsResponse {
  averageMonthlySearches?: number | null;
  competition?: string | null;
  competitionIndex?: number | null;
  monthlySearches?: MonthlySearchesEntry[] | null;
}

export interface ShardInfo {
  shard_id: string;
  input_batch_id: string;
  file_path: string;
  row_count: number;
  checksum: string;
}

export interface ShardManifest {
  input_batch_id: string;
  total_rows: number;
  total_shards: number;
  shards: ShardInfo[];
  created_at: string;
}

export type ShardStatus = "pending" | "running" | "retry" | "done" | "failed";

export interface ShardState {
  shard_id: string;
  input_batch_id: string;
  file_path: string;
  total_rows: number;
  status: ShardStatus;
  current_offset: number;
  retry_count: number;
  last_run_at: string | null;
  completed_at: string | null;
}

export interface InputBatch {
  input_batch_id: string;
  uploaded_at: string;
  source_filename: string;
  total_rows: number;
  status: string;
  normalized_path: string;
}

export interface BatchRun {
  run_id: string;
  shard_id: string;
  batch_start_offset: number;
  batch_size: number;
  api_status: string;
  processed_count: number;
  created_at: string;
}

export interface ExportJob {
  export_id: string;
  export_date: string;
  started_at: string;
  finished_at: string | null;
  record_count: number;
  status: string;
  output_csv_path: string;
  output_xlsx_path: string;
}

export interface PublishJob {
  publish_id: string;
  export_id: string;
  drive_status: string;
  sheets_status: string;
  drive_file_id: string | null;
  sheet_tab_name: string | null;
  source_record_count: number;
  drive_record_count: number;
  sheets_record_count: number;
  verified_at: string | null;
}

export interface PublishReport {
  publish_id: string;
  export_id: string;
  export_date: string;
  drive_status: string;
  sheets_status: string;
  drive_file_id: string | null;
  sheet_tab_name: string | null;
  source_record_count: number;
  drive_record_count: number;
  sheets_record_count: number;
  created_at: string;
  verified_at: string | null;
}

export interface BackfillReport {
  export_date: string;
  sheet_tab_name: string;
  source_record_count: number;
  sheets_record_count: number;
  missing_row_keys: string[];
  duplicated_row_keys: string[];
  verified_at: string;
}

export interface FreeTierGuardReport {
  date: string;
  stop_reason: string;
  worker_budget_remaining: number;
  ads_budget_remaining: number;
  drive_budget_remaining: number;
  sheets_budget_remaining: number;
  drive_storage_state: string;
  blocked_phase: string;
  created_at: string;
}

export type StopReason =
  | "worker_budget_exceeded"
  | "ads_budget_exceeded"
  | "drive_budget_exceeded"
  | "sheets_budget_exceeded"
  | "drive_storage_threshold_reached";

export interface BudgetState {
  worker: number;
  ads: number;
  drive: number;
  sheets: number;
  driveStorageBlocked: boolean;
}

export interface QuotaGuardResult {
  ok: boolean;
  stopReason?: StopReason;
}

export interface GoogleAdsApiConfig {
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
  geoTargetConstants: string;
  language: string;
  keywordPlanNetwork: string;
}

export interface GoogleDriveConfig {
  exportFolderId: string;
  inputFolderId: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
}

export interface Env {
  // Cloudflare bindings
  DB?: D1Database;

  // Google Ads
  GOOGLE_ADS_DEVELOPER_TOKEN: string;
  GOOGLE_ADS_CUSTOMER_ID: string;
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string;

  // Google OAuth
  GOOGLE_OAUTH_CLIENT_ID: string;
  GOOGLE_OAUTH_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;

  // Google Drive
  GOOGLE_DRIVE_EXPORT_FOLDER_ID: string;
  GOOGLE_DRIVE_INPUT_FOLDER_ID: string;

  // Google Sheets
  GOOGLE_SHEETS_SPREADSHEET_ID: string;

  // Runtime configuration
  BATCH_SIZE?: string;
  MAX_RETRY_COUNT?: string;
  FREE_TIER_WORKER_BUDGET?: string;
  FREE_TIER_ADS_BUDGET?: string;
  FREE_TIER_DRIVE_BUDGET?: string;
  FREE_TIER_SHEETS_BUDGET?: string;
  DRIVE_STORAGE_THRESHOLD_MB?: string;

  // Google Ads API Configuration
  GOOGLE_ADS_GEO_TARGET_CONSTANTS?: string;
  GOOGLE_ADS_LANGUAGE?: string;
  GOOGLE_ADS_KEYWORD_PLAN_NETWORK?: string;

  // Proxy server configuration
  PROXY_SERVER_URL: string;
  PROXY_API_SECRET: string;
}

export interface QAReport {
  timestamp: string;
  overall_status: "pass" | "fail";
  checks: QACheck[];
}

export interface QACheck {
  name: string;
  status: "pass" | "fail";
  details: string;
  expected?: string;
  actual?: string;
}

export interface QAResult {
  timestamp: string;
  overall_status: "pass" | "fail";
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  checks: QACheck[];
  export_csv_exists: boolean;
  export_xlsx_exists: boolean;
  required_columns_exist: boolean;
  at_least_one_success_record: boolean;
  records_count: number;
  failed_records_count: number;
}
