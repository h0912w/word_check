# google-ads-historical-metrics.md

## 1. 역할
Google Ads API는 단어별 검색량과 경쟁강도를 수집하는 핵심 데이터원이다.

## 2. 사용하는 이유
- historical metrics를 제공한다.
- 평균 월간 검색량, 월별 검색량 원본, 경쟁도, competition index를 한 경로에서 수집할 수 있다.

## 3. 필요한 계정/권한
- Google Ads 계정
- developer token
- OAuth 설정 (refresh token)
- customer id
- 필요 시 login customer id
- geo/language/network 설정값

## 4. 사용할 서비스/메서드
- `KeywordPlanIdeaService.GenerateKeywordIdeas` (gRPC, google-ads-node 라이브러리)

## 5. google-ads-node 라이브러리 사용

### 설치
```bash
npm install google-ads-node
```

### 기본 사용법
```typescript
import { GoogleAdsApi } from 'google-ads-node';

const client = new GoogleAdsApi({
  client_id: 'YOUR_CLIENT_ID',
  client_secret: 'YOUR_CLIENT_SECRET',
  developer_token: 'YOUR_DEVELOPER_TOKEN',
});

const customer = client.Customer({
  customer_id: '1234567890',
  refresh_token: 'YOUR_REFRESH_TOKEN',
});

const results = await customer.keywordPlanIdeas.generateKeywordIdeas({
  language: 'languageConstants/1000',
  geo_target_constants: ['geoTargetConstants/2840'],
  keyword_plan_network: 'GOOGLE_SEARCH',
  keyword_seed: {
    keywords: ['keyword1', 'keyword2'],
  },
});
```

## 6. 요청에 포함할 주요 필드
- `keywords` (seed keywords)
- `geo_target_constants`
- `language`
- `keyword_plan_network`

원칙:
- 입력 단어를 변형하지 않고 그대로 넣는다.
- batch 단위로 호출한다.
- batch 크기는 설정 파일로 외부화한다.

## 7. 요청 payload 예시
```json
{
  "customer": {
    "resourceName": "customers/5398905405"
  },
  "generateKeywordIdeasRequest": {
    "languageCode": "en",
    "geoTargetConstants": [
      {
        "resourceName": "geoTargetConstants/2840"
      }
    ],
    "keywordPlanNetwork": "KEYWORD_PLAN_NETWORK_SEARCH",
    "seedKeywords": [
      {
        "text": "merge",
        "matchType": "BROAD"
      }
    ],
    "includeHistoricalMetrics": true,
    "includeContentMetrics": false
  }
}
```

## 8. 응답에서 추출할 필드
- average monthly searches
- monthly search volumes
- competition
- competition index
- collected_at
- api_status

## 9. 내부 공통 스키마
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

## 10. 로컬 실행 구조

### 특징
- **직접 호출**: google-ads-node로 Google Ads API에 직접 gRPC 호출
- **OAuth2 자체 관리**: refresh_token으로 access_token 자동 갱신
- **배포 불필요**: 로컬 Node.js 환경에서 바로 실행

### 아키텍처
```
┌─────────────────────────────────────────┐
│  로컬 Node.js 스크립트                   │
│  - Batch orchestration                  │
│  - SQLite state management              │
│  - Drive/Sheets publish                 │
│  - OAuth2 token refresh                 │
└─────────────────┬───────────────────────┘
                  │ gRPC (google-ads-node)
┌─────────────────▼───────────────────────┐
│  Google Ads API                         │
└─────────────────────────────────────────┘
```

### 구현 예시
```typescript
import { GoogleAdsApi } from 'google-ads-node';

async function fetchMetrics(keywords: string[]) {
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });

  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  });

  return await customer.keywordPlanIdeas.generateKeywordIdeas({
    language: 'languageConstants/1000',
    geo_target_constants: ['geoTargetConstants/2840'],
    keyword_plan_network: 'GOOGLE_SEARCH',
    keyword_seed: { keywords },
  });
}
```

### 보안 고려사항
- **Credential 보호**: .env.local을 .gitignore에 포함
- **Token 갱신**: google-ads-node가 자동으로 access_token 갱신
- **Rate Limiting**: 배치 크기로 API 호출 제어
   - Developer token, Customer ID 사용

3. **Credential 저장 위치**:
   - Worker: OAuth2 credentials (client_id, client_secret, refresh_token)
   - Proxy: Google Ads credentials (developer_token, customer_id)
   - API Secret: 양쪽 모두 보유

## 11. quota 보호
- 요청 전 `quotaGuard` 실행
- 재시도 포함 총 operation 추적
- 공식 상한이 명확하지 않으면 보수적 batch로 시작
- runtime-limits에서 조정

## 12. retry 기준
자동 재시도:
- 네트워크 오류
- 일시적 서버 오류
- 제한적 파싱 오류

재시도 금지 또는 에스컬레이션:
- 인증 오류
- 권한 오류
- 구조적 응답 불일치 반복
- quota 정책 위반

## 13. 실패 코드 처리 원칙
- 일시 오류: retry
- quota 초과: retry 상태 전환 후 다음 윈도우 대기
- 인증/권한 문제: 즉시 에스컬레이션
- 구조 불일치: 에스컬레이션 + 샘플 응답 로그 보존

## 14. TypeScript 구현 패턴
```ts
async function fetchHistoricalMetrics(words: string[], env: Env): Promise<KeywordMetricRecord[]> {
  await quotaGuard(words.length, env);
  const res = await googleAdsFetch(words, env);
  return normalizeHistoricalMetricsResponse(words, res);
}
```

## 15. rate limit guard pseudo-code
```ts
if (!quotaGuard.canStartBatch(batchSize)) {
  return { action: "skip", reason: "quota_exceeded" };
}
```

## 16. 테스트 전략
- 10개 단어로 QA
- 성공/실패/빈 값 케이스 확인
- 응답 파싱 단위 테스트
- 실제 Worker 경로 E2E 테스트

## 17. 하지 말아야 할 구현
- 입력 단어 자동 수정
- 실패 레코드 제거
- raw monthly data 버리기
- quota 검사 없이 API 직접 호출

## 18. REST API 엔드포인트 수정 기록

### 2026-04-14: 엔드포인트 형식 수정 (최종 정정)
- **이전**: `/customers/{id}/keywordPlanIdeas:generateKeywordIdeas` ❌
- **중간**: `/customers/{id}/keywordPlanIdeaService:generateKeywordIdeas` ❌
- **최종**: `/customers/{id}:generateKeywordIdeas` ✅
- **원인**: proto 파일 확인 결과, REST API 경로가 `/v23/customers/{customer_id=*}:generateKeywordIdeas` 형태임
- **참고**: `google-ads-node/build/protos/google/ads/googleads/v23/services/keyword_plan_idea_service.proto:59`
- **API 버전**: v17 → v23으로 업데이트
