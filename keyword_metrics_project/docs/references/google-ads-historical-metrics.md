# google-ads-historical-metrics.md

## 역할
영어 단어별 검색량과 경쟁강도를 수집한다.

## 사용하는 이유
- Google Ads historical metrics는 평균 월간 검색량, 월별 검색량, 경쟁도, competition index를 제공한다.
- 이 프로젝트의 목적이 해석이 아니라 측정이므로 가장 직접적인 데이터원이다.

## 필수 계정/권한
- Google Ads 계정
- developer token
- OAuth 또는 서비스 계정 기반 인증 설계
- customer id
- 필요 시 login customer id

## 호출 대상
- `KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics`

## 요청 원칙
- 입력 단어를 변형하지 않는다.
- batch 단위로 호출한다.
- geo/language/network는 설정 파일에서 고정 관리한다.
- quotaGuard 통과 후에만 호출한다.

## 요청 payload 예시
```json
{
  "keywords": ["merge", "split"],
  "geoTargetConstants": ["geoTargetConstants/2840"],
  "language": "languageConstants/1000",
  "keywordPlanNetwork": "GOOGLE_SEARCH"
}
```

## 응답에서 추출할 필드
- `avg_monthly_searches`
- `competition`
- `competition_index`
- `monthly_searches_raw`
- `collected_at`
- `api_status`
- `retry_count`

## TypeScript 스키마 예시
```ts
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
}
```

## 정규화 원칙
- 입력 단어 1건당 결과 레코드 1건을 유지한다.
- API 실패 시에도 실패 레코드를 남긴다.
- 파싱 실패는 batch 전체가 아니라 실패 레코드만 retry 큐로 보낸다.

## quota/rate limit 처리
- 요청 전 quotaGuard 점검
- 초과 예상 시 이번 실행 종료
- retry는 quota 예산과 분리 관리

## 실패 처리
- 네트워크/일시 오류: 자동 재시도
- 구조 변경: 에스컬레이션
- 인증 오류: 즉시 실패 처리 + 운영자 확인

## 하지 말아야 할 구현
- 런타임에서 LLM으로 키워드 보정
- 입력 단어 정규화 명목의 변경
- 키워드 1건마다 D1 write
