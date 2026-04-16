# operations.md

## 1. 운영 원칙
- Cloudflare Workers는 상시 실행 프로세스가 아니라 짧은 작업의 반복 체인으로 사용한다.
- 상태는 batch/shard 중심으로 기록한다.
- 실패는 숨기지 말고 재시도, 에스컬레이션, 스킵+로그로 명확히 분류한다.
- Google Drive 원본과 Google Sheets 반영 건수는 항상 대조한다.

## 2. 실행 주기 권장안
초기 권장:
- 1분 Cron
- 실행당 quota-safe batch 여러 개 반복
- 한 번의 실행이 duration limit에 근접하지 않도록 제한

주 병목:
- 서버보다 Google Ads API quota/rate limit

## 3. batch 실행 절차
1. `pending` 또는 `retry` shard 선택
2. 현재 offset부터 N개 로드
3. quotaGuard 검사
4. free_tier_guard 검사
5. Google Ads API 호출 (또는 Mock API)
6. 응답 정규화
7. 결과 저장
8. offset 갱신
9. shard 끝이면 `done`

### 3.1 테스트 모드 실행

Google Ads API 승인 대기 중인 경우, **Mock API 모드**를 사용할 수 있습니다.

#### 활성화
```bash
# .env.local 파일
USE_MOCK_API=true
```

#### Mock API 동작
- 실제 API를 호출하지 않음
- 무작위 테스트 데이터 반환
- API quota/승인 불필요
- 전체 파이프라인 테스트 가능

#### 실행
```bash
npm run collect-metrics  # Mock 모드로 실행
```

#### Mock 데이터 예시
- avg_monthly_searches: 1000~100000 (무작위)
- competition: LOW, MEDIUM, HIGH
- competition_index: 10, 50, 90

## 4. 실패 처리 정책
### 4.1 자동 재시도
사용:
- 네트워크 오류
- 일시적 API 실패
- 저장소 타임아웃
- 형식적 누락 오류

정책:
- 기본 2~3회
- 지수 백오프
- 동일 batch 무한 재시도 금지

### 4.2 에스컬레이션
사용:
- quota 정책 해석 모호
- API 응답 구조 불일치
- 동일 오류 반복
- 상태 무결성 의심

대상:
- main-orchestrator
- 필요 시 사람 검토

### 4.3 스킵 + 로그
사용:
- 선택적 부가 산출물 실패
- 전체 운영에 영향 없는 후처리 실패

## 5. export/publish 규칙
### export
- shard 결과 병합
- 컬럼 순서 고정
- 실패 레코드 포함 여부는 설정 기반
- CSV 먼저 생성
- XLSX는 후속 생성 및 재시도 가능

### publish
1. Drive 업로드
2. Sheets 반영
3. 성공 여부 기록
4. Drive/Sheets 건수 대조
5. 불일치 시 backfill 후보 등록

## 6. Google Sheets 운영 원칙
- 무한 단일 시트 append 금지
- 일별 또는 월별 시트 분리
- 각 행에 `row_key` 부여
- append 후 row count 기록
- idempotent append/upsert 정책 유지
- 정기 backfill 검증 실행

## 7. 상태 무결성 규칙
- 상태 전이는 문서에 정의된 값만 사용
- batch 결과 저장과 offset 갱신 순서를 고정
- partial failure는 실패 레코드만 retry 큐로 이동
- 기존 shard는 불변, 증분 업로드는 신규 batch/shard 세트로 분리

## 8. 운영 중 자주 깨지는 지점
- Google Ads quota/rate limit 초과
- export 건수와 publish 건수 불일치
- Google Sheets append 성공처럼 보이지만 일부 누락
- Drive 저장공간 부족
- 신규 입력 batch 등록 시 기존 상태 오염
- bootstrap 기준 불일치로 신규 환경 재현 실패

## 9. 운영 리포트
권장 리포트:
- `output/exports/publish_report_YYYY-MM-DD.json`
- `output/exports/sheets_backfill_report_YYYY-MM-DD.json`
- `output/exports/free_tier_guard_report_YYYY-MM-DD.json`

## 10. 금지
- 키워드 1건마다 D1 쓰기
- retry 무한 반복
- Sheets만 보고 완료 판정
- 실패를 성공처럼 마킹
