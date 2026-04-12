# architecture.md

## 1. 시스템 목적
이 프로젝트는 영어 단어 목록을 입력받아 Google Ads historical metrics를 수집하고, Cloudflare Workers 기반의 짧은 주기 배치 체인으로 처리한 뒤 날짜별 CSV/XLSX를 생성하여 R2, Google Drive, Google Sheets에 반영하는 서버형 배치 처리 시스템이다.

## 2. 범위
### 포함
- 영어 단어 리스트 입력
- 입력 정규화
- shard 분할 및 manifest 생성
- Cloudflare Workers + Cron 기반 batch 처리
- Google Ads API historical metrics 수집
- R2 원본 보관
- D1 상태 관리
- 날짜별 CSV/XLSX export
- Google Drive/Google Sheets 결과 배포
- backfill 및 publish 검증
- 실제 서버를 사용한 QA

### 제외
- 단어 의미 해석
- 동의어/변형/조합 생성
- SEO 적합성 판정
- 사업성 평가
- 사용자용 대시보드

## 3. 핵심 원칙
1. 입력 단어는 절대 변형하지 않는다.
2. 생산 런타임에서는 LLM을 호출하지 않는다.
3. 상태는 키워드 단위가 아니라 batch/shard 단위로 저장한다.
4. 원본 보관은 R2와 Google Drive가 담당한다.
5. Google Sheets는 열람 계층이며 row_key 기반 누락 검증을 수행한다.
6. QA는 실제 서버 실행 뒤 Google Drive 업로드 결과로 판정한다.
7. GitHub에서 내려받은 후 bootstrap 1회로 바로 실행 가능해야 한다.

## 4. 전체 흐름
```text
GitHub clone/download
→ bootstrap
→ input 업로드
→ normalize
→ shard build
→ R2 upload
→ D1 register
→ Cron batch run
→ Google Ads API call
→ normalize response
→ store results
→ export CSV/XLSX
→ publish to Drive/Sheets
→ reconcile counts
→ QA on real server using Drive outputs
```

## 5. 런타임 구성
- Server runtime: Cloudflare Workers
- Scheduler: Cloudflare Cron Triggers
- Object storage: Cloudflare R2
- State DB: Cloudflare D1
- Source API: Google Ads API
- User-facing output locations: Google Drive, Google Sheets
- Repo/document control: GitHub

## 6. 데이터 계층
### 입력 계층
- `input/*.txt`
- `input/*.csv`
- `input_batch_id` 단위 추적

### 중간 계층
- `output/prepared/normalized_words.txt`
- `output/shards/*.txt`
- `output/manifests/shard_manifest.json`
- R2 shard objects
- D1 state rows

### 최종 계층
- `output/exports/keyword_metrics_YYYY-MM-DD.csv`
- `output/exports/keyword_metrics_YYYY-MM-DD.xlsx`
- R2 export objects
- Google Drive files
- Google Sheets tab rows

## 7. 에이전트 구조
### main-orchestrator
- 설계 유지
- 구조/정책 판단
- 코드와 문서 일치성 유지

### qa-executor
- 실제 사용자 파이프라인 실행
- 실서버/실배포 환경 검증
- Drive 업로드 산출물 기준 pass/fail 판정

### ops-reviewer
- quota, retry, backlog, publish mismatch 검토

## 8. 상태 전이
- `pending`
- `running`
- `retry`
- `done`
- `failed`

전이:
- pending → running
- running → done
- running → retry
- retry → running
- retry → failed

## 9. QA 판정 기준 강화 사항
이 저장소의 QA는 일반적인 “파일이 생성되었는가” 수준으로 끝내면 안 된다. 반드시 아래 순서를 따른다.
1. 실제 배포된 Worker가 테스트 입력을 처리한다.
2. export가 생성된다.
3. publish 단계가 Google Drive에 CSV/XLSX를 업로드한다.
4. QA 에이전트가 Drive file id와 row count를 직접 확인한다.
5. Drive에 업로드된 최종 파일의 건수와 기대 건수를 비교한다.
6. 이 결과로만 pass/fail을 결정한다.

## 10. 필수 연계 문서
- `docs/deployment.md`
- `docs/operations.md`
- `docs/qa-plan.md`
- `docs/references/google-ads-historical-metrics.md`
- `docs/references/google-drive-publishing.md`
- `docs/references/google-sheets-publishing.md`
- `docs/references/cloudflare-workers-cron.md`
- `docs/references/cloudflare-r2-storage.md`
- `docs/references/cloudflare-d1-state.md`
- `docs/references/auth-secrets-model.md`
- `docs/references/end-to-end-data-contracts.md`
