# CLAUDE.md

## 프로젝트 고정 정의
- 이 프로젝트는 영어 단어 목록 파일을 입력으로 받아 Google Ads historical metrics를 수집하고, Cloudflare Workers 기반 서버 배치로 처리한 뒤 날짜별 CSV/XLSX를 생성하여 R2에 원본 보관하고 Google Drive와 Google Sheets에 배포한다.
- 기본 목적은 해석이 아니라 측정이다. 입력 단어를 변형하지 말고 그대로 요청한다.
- README는 만들지 않는다. 설명성 내용은 `docs/`로 분리한다.

## 절대 우선순위
1. 원본 설계서 정보 누락 0%
2. 입력/출력 계약 불변
3. 런타임 비LLM 원칙 유지
4. 실제 서버 기준 E2E 동작 보장
5. QA 자동 실행 및 판정 근거 보존
6. 기존 구조 유지 + 최소 범위 수정
7. 성능/미관 개선은 후순위

## 절대 금지
- 입력 단어 변형 금지
- 생산 런타임에서 Claude Code LLM 또는 별도 anthropic 패키지 호출 금지
- README 생성 금지
- 출력 컬럼명, 열 순서, 파일명 규칙 임의 변경 금지
- QA 전용 별도 앱/서비스/판정기 생성 금지
- 테스트 없이 핵심 로직 교체 금지
- 서버를 우회한 로컬 모의 실행만으로 QA pass 처리 금지
- Google Drive 업로드 없이 QA 완료 처리 금지

## 입력 계약
- 허용 입력: `input/*.txt`, `input/*.csv`
- `txt`: 한 줄에 단어 1개
- `csv`: 최소 1개 컬럼에 단어 포함
- 내부 표준 입력: UTF-8 단일 단어 리스트
- 초기 1회 대량 업로드를 기본으로 하되 중간 증분 업로드 허용
- 각 입력 묶음은 `input_batch_id`로 추적
- 기본값은 중복 제거 안 함. 중복 제거는 옵션으로만 허용

## 출력 계약
- 날짜별 파일명 규칙 유지:
  - `output/exports/keyword_metrics_YYYY-MM-DD.csv`
  - `output/exports/keyword_metrics_YYYY-MM-DD.xlsx`
- 기본 컬럼 순서 유지:
  1. `word`
  2. `avg_monthly_searches`
  3. `competition`
  4. `competition_index`
  5. `monthly_searches_raw`
  6. `collected_at`
  7. `api_status`
  8. `retry_count`
  9. `source_shard`
  10. `source_offset`
  11. `input_batch_id`
  12. `export_date`
  13. `export_batch_id`
  14. `row_key`
- R2는 원본 보관소다.
- Google Drive는 날짜별 파일 보관소다.
- Google Sheets는 열람 계층이다.
- QA 최종 판정 기준은 **실제 서버 실행 후 Google Drive에 업로드된 최종 출력물**이다.

## LLM 처리 영역 vs 스크립트 처리 영역
| 작업 | 담당 |
|---|---|
| 배치 크기 기본값, 운영 구조, 예외 해석, QA 실패 원인 설명 | 현재 Claude Code 세션 |
| 입력 파싱, shard 생성, API 호출, 결과 저장, export, publish, backfill, 상태 갱신 | 스크립트/Worker |
| 실제 파이프라인 검증 및 pass/fail 판정 | QA 에이전트 + 사용자 파이프라인 |

고정 원칙:
- AI 판정은 현재 실행 중인 Claude Code 세션이 직접 수행한다.
- 생산 런타임은 결정론적 스크립트/Worker 경로만 사용한다.
- 사용자 확인이 필요한 상황은 자동 확정하지 말고 로그와 판정 근거를 남긴다.

## 필수 워크플로우
1. bootstrap
2. 입력 정규화
3. shard 생성 + manifest 생성
4. R2 업로드 + D1 상태 등록
5. Cron 기반 batch 실행
6. Google Ads API 호출 + 응답 정규화
7. 결과 저장
8. 날짜별 CSV/XLSX export
9. Google Drive + Google Sheets 배포
10. Drive/Sheets/R2 건수 대조
11. QA 실행
12. QA는 Drive 업로드된 최종 파일 기준으로 pass/fail 판정

## QA 고정 규칙
- 코드나 문서가 바뀌면 QA 에이전트를 반드시 실행한다.
- QA는 실제 사용자 경로를 그대로 사용해야 한다.
- QA는 테스트 입력으로 실제 배포된 Worker/Cron/R2/D1/Drive/Sheets를 사용한다.
- QA는 서버에서 처리 완료된 뒤 Google Drive에 업로드된 CSV/XLSX를 직접 조회해 판정한다.
- 로컬 임시 파일이나 중간 산출물만으로 pass 처리하지 않는다.
- `output/qa/qa_report.md`, `output/qa/qa_result.json`을 생성한다.
- `qa_result.json`에는 최소한 `run_id`, `drive_file_id_csv`, `drive_file_id_xlsx`, `drive_row_count`, `expected_row_count`, `status`, `checked_at`, `failure_reason`를 넣는다.

## 완료 기준
- 저장소를 clone/download한 뒤 bootstrap 1회로 실행 준비가 완료된다.
- 입력부터 export, publish, QA까지 실제 경로가 동작한다.
- Google Drive 업로드 성공 기록과 QA 판정 기록이 남는다.
- docs와 코드의 env/binding/table/file 계약이 일치한다.
- 원본 설계서 대비 누락 0% 대조 문서가 존재한다.

## 수정 원칙
- 기존 구조 유지, 필요한 파일만 최소 범위 수정
- 새 규칙은 먼저 `docs/`에 반영하고 코드/설정과 동기화
- 구현 전에 `docs/end-to-end-data-contracts.md`, `docs/qa-plan.md`, `docs/references/*`를 확인
- 문서와 코드가 충돌하면 둘 다 수정하고 traceability 문서까지 갱신

## 먼저 볼 문서
- `docs/architecture.md`
- `docs/deployment.md`
- `docs/operations.md`
- `docs/qa-plan.md`
- `docs/traceability_matrix.md`
- `docs/references/*.md`
