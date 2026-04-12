import type { MetricsRecord } from './types.js';

export const EXPORT_COLUMNS = [
  'word',
  'avg_monthly_searches',
  'competition',
  'competition_index',
  'monthly_searches_raw',
  'collected_at',
  'api_status',
  'retry_count',
  'source_shard',
  'source_offset',
  'input_batch_id',
  'export_date',
  'export_batch_id',
  'row_key',
] as const;

/** Build a CSV string from MetricsRecord[]. Column order matches EXPORT_COLUMNS. */
export function recordsToCsv(records: MetricsRecord[]): string {
  const header = EXPORT_COLUMNS.join(',');
  const rows = records.map((r) => {
    return EXPORT_COLUMNS.map((col) => {
      const val = (r as Record<string, unknown>)[col];
      if (val == null) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      // RFC 4180 CSV escaping
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  });
  return [header, ...rows].join('\n');
}

/** Return the canonical export file names for a given ISO date (YYYY-MM-DD). */
export function getExportFilenames(date: string): { csv: string; xlsx: string } {
  return {
    csv: `keyword_metrics_${date}.csv`,
    xlsx: `keyword_metrics_${date}.xlsx`,
  };
}
