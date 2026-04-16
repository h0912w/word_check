# 작업 진행 상태

> **Claude 참고**: 이 프로젝트 작업 시작 시 반드시 이 파일을 먼저 확인하세요.
>
> 최신 작업 내용만 유지합니다. 오래된 내용은 덮어씁니다.

---

## 최신 작업 (2026-04-16) - 인터넷 단어 수집 기능 추가

### 오늘의 주요 성과
- ✅ **인터넷 실제 단어 수집 방법론 추가** (word-generation-architecture.md)
- ✅ **단어 수집 스크립트 구현** (collect_words.ts)
- ✅ **실제 SaaS 단어 7,605개 수집 완료** (WebSearch 기반)
- ✅ **QA 테스트 통과율 95.9% 달성** (7,289개 통과)
- ✅ **명령어 이름 확정** (mint, grade, collect)
- ✅ **CLAUDE.md에 인터넷 수집 방법론 추가**
- ✅ **package.json에 collect 스크립트 추가**

### 인터넷 단어 수집 특징
- **실제 SaaS 제품/서비스 이름**: Salesforce, HubSpot, Shopify, AWS 등
- **카테고리별 분류**: CRM, 마케팅, 프로젝트 관리, 커뮤니케이션 등
- **지역별 서비스 포함**: 한국 (Naver, Kakao), 글로벌 (AWS, Azure)
- **품질 검증**: QA 통과율 95.9%, 평균 점수 98.1점
- **실행 조건**: Claude Code 세션 내에서만 실행 (생산 런타임 비LLM 원칙 유지)

### 완료된 작업 내역 (이전)
- ✅ 단어 생성 기능 설계 완료 (word-generation-architecture.md)
- ✅ 단어 생성 프레임워크 구현 (generate_words.ts, qa_words.ts)
- ✅ 중복 제거 엔진 구현 (deduplication.ts)
- ✅ 단어 검증기 구현 (validator.ts)
- ✅ 타입 정의 완료 (types.ts)
- ✅ input/generated/ 디렉터리 구조 추가
- ✅ better-sqlite3 → sql.js 마이그레이션 완료
- ✅ Mock Google Ads API 클라이언트 구현
- ✅ QA 스크립트 로컬 실행 환경으로 수정
- ✅ Google Ads API REST 클라이언트 구현 (axios 기반)
- ✅ API 버전 v17 → v23 업데이트
- ✅ 엔드포인트 형식 수정 (`/customers/{id}:generateKeywordIdeas`)
- ✅ **403 오류 원인 규명 및 해결** (2026-04-14)
- ✅ **login-customer-id 헤더 수정 완료** (2026-04-14)
- ✅ **Mock API 전체 파이프라인 테스트 완료** (2026-04-14)
- ✅ **manifest 자동 로드 기능 추가** (collect_metrics.ts)
- ✅ **Developer Token 승인 요청 완료** (2026-04-14)
- ✅ **테스트 모드(Mock API) 기능 문서화 완료** (2026-04-15)
- ✅ **Google Cloud Console에서 Google Ads API 활성화 완료** (2026-04-16)
- ✅ **테스트 계정(890-341-2348) 권한 설정 완료** (2026-04-16)
- ✅ **`.env.local`에 테스트 계정 ID 추가 (프로덕션 ID 보관)** (2026-04-16)
- ✅ **실제 Google Ads API 테스트 계정으로 작동 확인** (2026-04-16)
- ✅ **API 응답 형식 수정 (`response.results` 처리)** (2026-04-16)
- ✅ **전체 파이프라인 테스트 완료 (10개 단어, 전부 성공)** (2026-04-16)
- ✅ **CSV/XLSX export 완료** (2026-04-16)

### 오늘 해결한 주요 문제
1. **인터넷 단어 수집 방법론**: WebSearch로 실제 SaaS 단어 수집
2. **품질 검증**: QA 통과율 95.9% 달성
3. **카테고리별 분류**: 17개 카테고리로 체계적 분류
4. **명령어 체계**: mint, grade, collect 명령어 확정

### 테스트 계정 권한 설정 방법 (노하u)
1. 테스트 계정(890-341-2348)으로 로그인
2. 왼쪽 메뉴: 도구 및 설정 > 액세스 및 보안 > 사용자 관리
3. OAuth refresh token 발급받은 Google 이메일 추가
4. 적절한 권한 부여 (표준 액세스 이상)
5. 초대받은 계정으로 메일 열어 수락

### 테스트 결과 (실제 API)
| 단어 | 월 검색량 | 경쟁 강도 | 상태 |
|------|-----------|----------|------|
| test | 1,220,000 | LOW | ✅ |
| example | 135,000 | LOW | ✅ |
| keyword | 90,500 | LOW | ✅ |
| sample | 74,000 | LOW | ✅ |
| demo | 246,000 | LOW | ✅ |
| quality | 110,000 | LOW | ✅ |
| assurance | 40,500 | LOW | ✅ |
| validation | 49,500 | LOW | ✅ |
| verification | 135,000 | LOW | ✅ |
| monitoring | 246,000 | HIGH | ✅ |

### 현재 `.env.local` 설정
```bash
# 테스트 계정 (현재 활성 - TEST Developer Token용)
GOOGLE_ADS_CUSTOMER_ID=8903412348

# 프로덕션 계정 (승인 후 사용을 위해 보관)
GOOGLE_ADS_CUSTOMER_ID_PRODUCTION=5398905405
```

### 수정된 파일 (오늘)
- `src/ads-api/local-client.ts`: 
  - API 응답 형식 수정 (`response.results` 처리)
  - 상세 오류 로깅 추가
  - **할당량 계산 수정**: 키워드 수 → API 호출 수 기준
- `scripts/collect_metrics.ts`:
  - 환경변수 BATCH_SIZE 읽기 추가
  - **Shard 완전 처리 로직**: while 루프로 각 shard 100단어 모두 처리
  - **Max shards per run 동적 계산**: 할당량 기반으로 최적 처리 개수 계산
- `.env.local`: BATCH_SIZE=20, FREE_TIER_ADS_BUDGET=5000으로 최적화
- `.env.example`: 배치 크기 설정 가이드 추가 (API 제한 20 키워드/요청)
- `scripts/collect-and-export.sh`: **주기적 export 자동화 스크립트 생성**
- `docs/setup.md`: 테스트 계정 권한 설정 방법 추가 (3.5 섹션)

---

## 403 오류: 원인 분석 및 해결 방안

### 근본 원인
**Developer Token이 TEST 상태**

Google Ads API Developer Token은 3가지 상태가 있습니다:
- **TEST**: 테스트 계정에서만 작동
- **PENDING**: 승인 대기 중 (테스트 계정에서만 작동)
- **APPROVED**: 프로덕션 계정에서 작동

현재 `GOOGLE_ADS_DEVELOPER_TOKEN=6VFJoYRZ2xKsD0ptAzfUg`이 TEST 상태이므로, 프로덕션 계정(`5398905405`)으로 접근 시 403 Forbidden 오류가 발생합니다.

### 추가 원인 (보완 사항)
**`login-customer-id` 헤더 누락**

Manager Account를 통해 하위 계정 접근 시 필요한 헤더가 누락되어 있었습니다.
- ✅ 수정 완료: `src/ads-api/local-client.ts` lines 112-124, 151-163

### 해결 방안
| 상태 | 설명 | 해결 여부 |
|------|------|----------|
| Developer Token TEST 상태 | **APPROVED** 승인 필요 | ⏳ 승인 요청 완료, 내일 확인 예정 |
| login-customer-id 헤더 누락 | 코드 수정 필요 | ✅ 수정 완료 |

---

## Mock API 테스트 결과

**QA 결과: 37/37 PASS (100%)**

테스트한 항목:
- 디렉터리 구조 (12개)
- 필수 파일 (5개)
- 환경변수 설정 (1개)
- 입력 준비 (1개)
- Shard 빌드 (2개)
- 데이터베이스 초기화 (2개)
- 메트릭 수집 (1개)
- Export 결과 (7개)
- 스키마 검증 (6개)

**생성된 파일:**
- `output/exports/keyword_metrics_2026-04-14.csv` (3,415 bytes)
- `output/exports/keyword_metrics_2026-04-14.xlsx` (24,835 bytes)
- `output/qa/qa_report_mock_2026-04-14.md`
- `output/qa/qa_result_mock_2026-04-14.json`

**테스트 데이터 (10개 단어):**
```
test, example, keyword, sample, demo, quality, assurance, validation, verification, monitoring
```

---

## 현재 상태

### 전체 처리 진행 상황
| 항목 | 값 |
|------|-----|
| 전체 단어 | 466,550 단어 |
| 처리 완료 | 120,001 단어 |
| 진행률 | 25.7% |
| 남은 단어 | 346,549 단어 |
| 처리된 shards | shard_000001 ~ shard_002650 |

### 시스템 상태
| 항목 | 상태 | 비고 |
|------|------|------|
| 전체 파이프라인 | ✅ 정상 작동 | 테스트 계정(890-341-2348)으로 실제 API 작동 |
| 배치 크기 | ✅ 최적화 완료 | BATCH_SIZE=20 (API 최대값) |
| API 할당량 | ⏸️ 일일 소진 | 5,000회/일, 현재 429 오류로 대기 중 |
| Developer Token | ⏳ 승인 대기 | TEST 상태, 테스트 계정에서는 정상 작동 |
| 테스트 계정 | ✅ 설정 완료 | 권한 설정 완료, API 호출 성공 |
| 주기적 export | ✅ 자동화 | collect-and-export.sh 자동 실행 |

**환경변수 설정:**
```bash
GOOGLE_ADS_DEVELOPER_TOKEN=6VFJoYRZ2xKsD0ptAzfUg  # ⏳ 승인 대기 중 (TEST 상태)
GOOGLE_ADS_CUSTOMER_ID=8903412348                  # ✅ 테스트 계정 (현재 활성)
GOOGLE_ADS_CUSTOMER_ID_PRODUCTION=5398905405       # ⏳ 프로덕션 계정 (승인 후 사용)
GOOGLE_ADS_LOGIN_CUSTOMER_ID=                      # 비어있음 (직접 접근)
BATCH_SIZE=20                                      # ✅ API 최대값 (20 키워드/요청)
FREE_TIER_ADS_BUDGET=5000                          # 하루 최대 API 호출 수
```

**처리 속도:**
- 각 shard: 100단어 × 5회 API 호출 = 완전 처리
- 일일 처리 가능: 1,000 shards (5,000 calls ÷ 5)
- 일일 처리 단어: 100,000 단어
- 남은 작업 예상: 약 3.5일

---

## 내일 계획 (할당량 리셋 후)

### 할당량 리셋 시간
- **429 오류 메시지**: "Retry in 34,661 seconds" (약 9.6시간)
- **예상 재개 시간**: 2026-04-17 오전 2시경

### 재개 방법
```bash
cd C:/Users/h0912/claude_project/Word_check
bash scripts/collect-and-export.sh
```

또는 백그라운드로 실행:
```bash
cd C:/Users/h0912/claude_project/Word_check
nohup bash scripts/collect-and-export.sh > logs/continuous.log 2>&1 &
```

### 예상 완료 시간
- 남은 단어: 346,549 단어
- 예상 소요일: 약 3.5일
- 완료 예상: 2026-04-20 오후

---

## Developer Token 승인 후 계획

### 승인 확인 방법
1. **Google Ads API Center 접속**
   - https://ads.google.com/aw/apicenter
2. **토큰 상태 확인**
   - TEST → **APPROVED**로 변경되었는지 확인
3. **승인 완료 시**: 프로덕션 계정으로 전환

### 프로덕션 계정 전환
`.env.local`에서 Customer ID 변경:
```bash
# 승인 완료 후 프로덕션 계정으로 전환
GOOGLE_ADS_CUSTOMER_ID=5398905405                  # 프로덕션 계정
GOOGLE_ADS_CUSTOMER_ID_PRODUCTION=8903412348       # 테스트 계정 백업
```

### 실행 가능한 명령어

**현재 상태에서 실행 (진행 중인 작업 계속):**
```bash
# 할당량 리셋 후 자동으로 계속 진행
cd C:/Users/h0912/claude_project/Word_check
bash scripts/collect-and-export.sh

# 또는 백그라운드 실행
nohup bash scripts/collect-and-export.sh > logs/continuous.log 2>&1 &
```

**개별 실행 (필요시):**
```bash
# DB 초기화 (처음 시작 시만)
npm run init-db

# 입력 파일 준비
npm run prepare-input -- --input input/words.txt

# Shard 분할
npm run build-shards

# 메트릭 수집 (단일 실행)
npm run collect-metrics

# Export 실행
npm run export

# QA 실행
npm run qa
```

---

## 최신 Export 결과 (2026-04-16)

### 파일 정보
- **CSV**: `output/exports/keyword_metrics_2026-04-16.csv`
- **XLSX**: `output/exports/keyword_metrics_2026-04-16.xlsx`
- **총 레코드**: 120,001개

### 데이터 샘플 (마지막 처리된 단어들)
| word | avg_monthly_searches | competition | competition_index |
|------|---------------------|-------------|-------------------|
| arterial | 110,000 | LOW | 5 |
| arterially | 480 | LOW | 0 |
| arteriogram | 480 | LOW | 0 |
| arteriograms | 480 | LOW | 0 |
| arteriole | 1,800 | LOW | 8 |
| arterioles | 1,800 | LOW | 0 |
| arteriosclerosis | 150,000,000 | LOW | 33 |
| arteriosclerotic | 60,500 | LOW | 11 |
| arteriovenous | 880 | LOW | 1 |
| artery's | 90,500 | LOW | 0 |

### 처리된 데이터 특징
- 모든 레코드 `api_status: success`
- 경쟁 강도: LOW (대부분), MEDIUM, HIGH
- 검색량 범위: 10 ~ 150,000,000
- 수집 시간: 2026-04-15 23:38 ~ 2026-04-16 14:25

---

## 대기 중인 결정 사항
- **Google Drive/Sheets 배포 기능**: 구현 여부 (2-4시간 작업량)
- **운영 방식**: 완전 자동화 vs 반자동 vs 수동 배치

---

## 실행 가능한 명령어

```bash
# 테스트 계정으로 실제 Google Ads API 사용 (현재 작동)
npm run init-db
npm run prepare-input -- --input input/words.txt
npm run build-shards
npm run collect-metrics  # ✅ 테스트 계정(890-341-2348)로 실제 API 작동
npm run export
npm run publish

# Mock API로 테스트 (API 호출 없이)
USE_MOCK_API=true npm run collect-metrics
npm run export
npm run qa -- --mock

# QA 실행
npm run qa
```

---

## 프로젝트 상태

| 구성 요소 | 상태 | 비고 |
|---------|------|------|
| DB (sql.js) | ✅ | SQLite WebAssembly |
| Mock API | ✅ | 테스트용 정상 작동, 전체 파이프라인 QA 통과 |
| 실제 Google Ads API | ✅ | 테스트 계정(890-341-2348)로 작동 확인 |
| REST API 클라이언트 | ✅ | axios로 구현, login-customer-id 헤더 추가 완료 |
| OAuth 인증 | ✅ | 토큰 발급 정상 |
| Developer Token | ⏳ | TEST 상태 (테스트 계정에서는 작동) |
| 테스트 계정 권한 | ✅ | 설정 완료, API 호출 성공 |
| QA 스크립트 | ✅ | Mock/실제 API 모드 지원, 37/37 PASS |
| Export (CSV/XLSX) | ✅ | 정상 작동 |
| Manifest 로드 | ✅ | collect_metrics에 자동 로드 기능 추가 |
| Publish | ⚠️ | 로컬 실행 미변경 |

---

## 기술 스택

- **DB**: sql.js (SQLite WebAssembly)
- **HTTP Client**: axios
- **API 버전**: Google Ads API v23
- **인증**: OAuth 2.0 (refresh token)
- **Developer Token**: 6VFJoYRZ2xKsD0ptAzfUg (TEST 상태, 테스트 계정에서 작동)
- **테스트 계정**: 890-341-2348 (현재 활성)
- **프로덕션 계정**: 5398905405 (승인 후 사용 예정)
