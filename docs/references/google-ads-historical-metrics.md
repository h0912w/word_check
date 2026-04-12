# google-ads-historical-metrics.md

## 1. 역할
Google Ads API는 단어별 검색량과 경쟁강도를 수집하는 핵심 데이터원이다.

## 2. 사용하는 이유
- historical metrics를 제공한다.
- 평균 월간 검색량, 월별 검색량 원본, 경쟁도, competition index를 한 경로에서 수집할 수 있다.

## 3. 필요한 계정/권한
- Google Ads 계정
- developer token
- OAuth 설정
- customer id
- 필요 시 login customer id
- geo/language/network 설정값

## 4. 사용할 서비스/메서드
- `KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics`

## 5. 요청에 포함할 주요 필드
- `keywords`
- `geo_target_constants`
- `language`
- `keyword_plan_network`

원칙:
- 입력 단어를 변형하지 않고 그대로 넣는다.
- batch 단위로 호출한다.
- batch 크기는 설정 파일로 외부화한다.

## 6. 응답에서 추출할 필드
- average monthly searches
- monthly search volumes
- competition
- competition index
- collected_at
- api_status

## 7. 내부 공통 스키마
```ts
export interface KeywordMetricRecord {
  word: string;
  avg_monthly_searches: number | null;
  competition: string | null;
  competition_index: number | null;
  monthly_searches_raw: unknown;
  collected_at: string;
  api_status: "success" | "failed";
  retry_count: number;
  source_shard: string;
  source_offset: number;
  input_batch_id: string;
  export_date?: string;
  export_batch_id?: string;
}
```

## 8. 요청 payload 예시
```json
{
  "keywords": ["merge", "split", "compress"],
  "geoTargetConstants": ["geoTargetConstants/2840"],
  "language": "languageConstants/1000",
  "keywordPlanNetwork": "GOOGLE_SEARCH"
}
```

## 9. 응답 정규화 규칙
- API 응답 구조가 일부 비어 있어도 입력 단어와 결과 레코드 연결은 유지한다.
- 실패 시에도 `word`, `api_status`, `retry_count`, `collected_at`는 남긴다.
- `monthly_searches_raw`는 원본 보존용 필드로 유지한다.

## 10. quota 보호
- 요청 전 `quotaGuard` 실행
- 재시도 포함 총 operation 추적
- 공식 상한이 명확하지 않으면 보수적 batch로 시작
- runtime-limits에서 조정

## 11. retry 기준
자동 재시도:
- 네트워크 오류
- 일시적 서버 오류
- 제한적 파싱 오류

재시도 금지 또는 에스컬레이션:
- 인증 오류
- 권한 오류
- 구조적 응답 불일치 반복
- quota 정책 위반

## 12. 실패 코드 처리 원칙
- 일시 오류: retry
- quota 초과: retry 상태 전환 후 다음 윈도우 대기
- 인증/권한 문제: 즉시 에스컬레이션
- 구조 불일치: 에스컬레이션 + 샘플 응답 로그 보존

## 13. TypeScript 구현 패턴
```ts
async function fetchHistoricalMetrics(words: string[], env: Env): Promise<KeywordMetricRecord[]> {
  await quotaGuard(words.length, env);
  const res = await googleAdsFetch(words, env);
  return normalizeHistoricalMetricsResponse(words, res);
}
```

## 14. rate limit guard pseudo-code
```ts
if (!quotaGuard.canStartBatch(batchSize)) {
  return { action: "skip", reason: "quota_exceeded" };
}
```

## 15. 테스트 전략
- 3~10개 단어로 QA
- 성공/실패/빈 값 케이스 확인
- 응답 파싱 단위 테스트
- 실제 Worker 경로 E2E 테스트

## 16. 하지 말아야 할 구현
- 입력 단어 자동 수정
- 실패 레코드 제거
- raw monthly data 버리기
- quota 검사 없이 API 직접 호출
