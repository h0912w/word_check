export interface MetricsRecord {
  word: string;
  avg_monthly_searches: number | null;
  competition: string | null;
  competition_index: number | null;
  monthly_searches_raw: unknown;
  collected_at: string;
  api_status: string;
  retry_count: number;
  source_shard: string;
  source_offset: number;
  input_batch_id: string;
  export_date: string;
  export_batch_id: string;
  row_key: string;
}
