import type { MetricsRecord } from './types.js';

interface MonthlySearchVolume {
  year: number;
  month: string;
  monthlySearches: string;
}

interface KeywordMetrics {
  avgMonthlySearches?: string | number | null;
  competition?: string | null;
  competitionIndex?: string | number | null;
  monthlySearchVolumes?: MonthlySearchVolume[];
}

interface AdsResult {
  keyword: { text: string };
  keywordMetrics?: KeywordMetrics;
}

interface AdsResponse {
  results?: AdsResult[];
}

export function normalizeResponse(
  rawResponse: unknown,
  words: string[],
  shardId: string,
  shardBaseOffset: number,
  inputBatchId: string,
  retryCountMap: Map<string, number>,
): MetricsRecord[] {
  const response = rawResponse as AdsResponse;
  const results = response.results ?? [];
  const collectedAt = new Date().toISOString();
  const exportDate = new Date().toISOString().slice(0, 10);
  const exportBatchId = `export_${exportDate}_${inputBatchId}`;

  const metricsMap = new Map<string, AdsResult>();
  for (const r of results) {
    metricsMap.set(r.keyword.text.toLowerCase(), r);
  }

  return words.map((word, idx) => {
    const offset = shardBaseOffset + idx;
    const rowKey = `${inputBatchId}:${shardId}:${offset}:${word}`;
    const retryCount = retryCountMap.get(word) ?? 0;
    const result = metricsMap.get(word.toLowerCase());
    const km = result?.keywordMetrics;

    if (!km) {
      return {
        word,
        avg_monthly_searches: null,
        competition: null,
        competition_index: null,
        monthly_searches_raw: null,
        collected_at: collectedAt,
        api_status: 'failed' as const,
        retry_count: retryCount,
        source_shard: shardId,
        source_offset: offset,
        input_batch_id: inputBatchId,
        export_date: exportDate,
        export_batch_id: exportBatchId,
        row_key: rowKey,
      };
    }

    const competition = (km.competition ?? null) as 'LOW' | 'MEDIUM' | 'HIGH' | null;
    const avgMonthly = km.avgMonthlySearches != null ? Number(km.avgMonthlySearches) : null;
    const compIndex = km.competitionIndex != null ? Number(km.competitionIndex) : null;

    return {
      word,
      avg_monthly_searches: avgMonthly,
      competition,
      competition_index: compIndex,
      monthly_searches_raw: km.monthlySearchVolumes ?? null,
      collected_at: collectedAt,
      api_status: 'success' as const,
      retry_count: retryCount,
      source_shard: shardId,
      source_offset: offset,
      input_batch_id: inputBatchId,
      export_date: exportDate,
      export_batch_id: exportBatchId,
      row_key: rowKey,
    };
  });
}
