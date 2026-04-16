# CLAUDE.md

## 프로젝트 정의
이 프로젝트는 영어 단어 목록 파일을 입력으로 받아, Google Ads historical metrics를 수집하고, 검색량·경쟁강도 결과를 날짜별 CSV/XLSX로 내보낸 뒤 Google Drive와 Google Sheets에 동시 배포하는 **로컬 실행 배치 처리 시스템**이다.

## 최상위 목표
1. 입력 단어를 변형하지 않고 그대로 수집 대상에 사용한다.
2. 로컬 PC에서 `npm run` 명령어로 즉시 실행 가능한 구조로 만든다.
3. 최종 산출물은 사용자가 바로 확인 가능한 CSV/XLSX와 Google Drive/Sheets 반영 결과여야 한다.
4. GitHub 저장소를 clone 또는 다운로드한 직후 Claude Code CLI에서 추가 구조 보정 없이 바로 이해·작업 가능한 저장소를 만든다.

## 범위 밖
- 단어 의미 해석
- 동의어/파생어/조합 생성
- SEO 적합성 판단
- 검색량 기반 사업성 평가
- 추천 시스템
- 사용자용 대시보드
- 전면 UI 재설계
- 런타임 LLM 호출 의존 구조

## 우선순위
1. 원본 설계 요구 누락 0%
2. 입력/출력 계약 준수
3. 런타임 비LLM 원칙 유지
4. 배치 상태 무결성, 재시도, 체크포인트 안정성
5. 무료 사용량 하드캡 및 추가 과금 방지 구조
6. Google Drive 원본 보관과 Google Sheets 반영 검증
7. 기존 구조 유지 + 최소 범위 수정
8. 코드 미관/리팩토링

## 절대 규칙
- 입력 단어를 변형, 번역, 정규어화, 추론 보정하지 말 것.
- 생산 런타임에서 Claude Code LLM, anthropic 패키지, 별도 LLM API를 호출하지 말 것.
- Google Ads quota/rate limit를 항상 선행 검사할 것.
- 상태 저장은 키워드 1건 단위가 아니라 batch/shard 단위 중심으로 설계할 것.
- 결과 원본 보관의 기준은 Google Drive 파일이다.
- Google Sheets는 조회 계층이며, append/upsert 성공 여부와 행 수 검증을 별도로 기록할 것.
- 각 결과 행에는 row_key를 부여해 중복/누락을 검증할 것.
- QA는 별도 QA 소프트웨어를 만들지 말고 실제 사용자 파이프라인을 직접 실행할 것.
- 코드나 문서 수정 후 QA를 반드시 수행할 것.
- README 파일을 만들지 말 것. 필요한 내용은 `CLAUDE.md`와 `docs/`로 분산한다.
- 저장소는 clone/download 직후 bootstrap 1회로 초기 준비가 끝나야 한다.

## 입력 계약
- 허용 입력: `input/*.txt`, `input/*.csv`
- 기본 형식: UTF-8, 단어 1개당 1행
- 초기 1회 대량 업로드를 기본으로 하되, 운영 중 추가 입력 파일 증분 업로드를 허용한다.
- 각 업로드 묶음은 `input_batch_id` 단위로 추적한다.
- 빈 줄 제거, 앞뒤 공백 제거, UTF-8 정규화는 허용한다.
- 기본값은 중복 제거 안 함이다. 중복 제거는 명시적 옵션일 때만 허용한다.

## 출력 계약
- 운영 중간 산출물:
  - `output/prepared/normalized_words.txt`
  - `output/shards/*.txt`
  - `output/manifests/shard_manifest.json`
  - 오류 로그, QA 리포트, publish/backfill 리포트
- 최종 사용자 산출물:
  - `output/exports/keyword_metrics_YYYY-MM-DD.csv`
  - `output/exports/keyword_metrics_YYYY-MM-DD.xlsx`
- 최종 기본 컬럼:
  - `word`
  - `avg_monthly_searches`
  - `competition`
  - `competition_index`
  - `monthly_searches_raw`
  - `collected_at`
  - `api_status`
  - `retry_count`
  - `source_shard`
  - `source_offset`
  - `input_batch_id`
  - `export_date`
  - `export_batch_id`
- 결과는 Google Drive와 Google Sheets에 모두 배포해야 한다.

## 워크플로우 고정
1. 저장소 bootstrap
2. 입력 수집 및 정규화
3. shard 분할 및 manifest 생성
4. 로컬 batch 실행 (npm run collect-metrics)
5. Google Ads API 직접 호출 및 응답 정규화
6. 결과 저장 (SQLite DB + JSON 백업)
7. 최종 집계 및 CSV/XLSX export (npm run export)
8. Google Drive + Google Sheets 배포 (npm run publish)
9. Drive/Sheets 건수 대조 및 backfill 검증
10. QA 실행 (npm run qa)

상세 절차는 `docs/architecture.md`, `docs/operations.md`, `docs/qa-plan.md`를 따른다.

## 판단과 코드의 역할 분리
| 작업 | 담당 |
|---|---|
| 배치 크기 초기값 결정 | LLM(main-orchestrator) |
| 배포 구조 선택 | LLM(main-orchestrator) |
| 오류 원인 해석 | LLM(main-orchestrator / qa-executor / ops-reviewer) |
| 설정값 조정 제안 | LLM |
| 입력 파일 파싱 | 스크립트 |
| shard 분할 | 스크립트 |
| Google Ads API 호출 | 스크립트 |
| 응답 정규화 | 스크립트 |
| 결과 저장 | 스크립트 |
| 상태 갱신 | 스크립트 |
| CSV/XLSX export | 스크립트 |
| Drive/Sheets publish | 스크립트 |
| 실제 사용자 파이프라인 QA 실행 | QA 에이전트 + 기존 스크립트 |

중요:
- AI 판정은 현재 실행 중인 Claude Code 세션이 직접 수행한다.
- 별도로 anthropic 패키지를 호출하거나 API 키를 설정하지 않는다.
- 생산 런타임 경로는 LLM 비의존 구조로 유지한다.

## 저장소 구조 규칙
반드시 아래 디렉터리를 저장소에 포함한다.
- `input/` - 입력 파일
- `data/` - 로컬 데이터베이스 및 상태 파일
- `output/prepared/` - 정규화된 출력
- `output/shards/` - 분할된 shard 파일
- `output/exports/` - CSV/XLSX 내보내기
- `output/qa/` - QA 결과
- `logs/` - 실행 로그
- `temp/` - 임시 파일
- `config/` - 설정 파일
- `scripts/` - 실행 스크립트
- `src/` - 소스 코드
- `docs/` - 문서
- `docs/references/` - 서비스별 참조 문서

루트 필수 파일:
- `CLAUDE.md` - 프로젝트 정의
- `package.json` - 의존성 및 스크립트
- `.env.example` - 환경변수 템플릿
- `tsconfig.json` - TypeScript 설정

누락되기 쉬운 빈 디렉터리는 `.gitkeep`로 버전관리한다.

## 구현 원칙
- 기존 구조를 유지하면서 필요한 파일만 추가/수정한다.
- 핵심 계약을 깨는 구조 개편은 금지한다.
- 테스트 없이 핵심 로직을 교체하지 않는다.
- 출력 헤더명, 열 순서, 파일명 규칙은 명시적 요구 없이는 변경하지 않는다.
- **배포 불필요**: 로컬에서 `npm run`으로 실행한다.
- Google Ads API는 google-ads-node 라이브러리로 직접 호출한다.
- 상태 저장은 SQLite DB와 JSON 파일로 한다.
- CSV는 항상 우선 보존하고, XLSX 실패 시 별도 재시도 가능 구조로 둔다.

## 무료 사용량/과금 방지 규칙
- 결제수단 등록이 필요한 유료형 저장소를 기본 구성에서 제외한다.
- 공식 상한보다 낮은 내부 상한을 사용한다.
- `free_tier_guard`를 batch 시작 전, publish 시작 전에 반드시 실행한다.
- 상한 도달 시 추가 실행보다 중단/실패를 우선한다.
- 중단 사유를 JSON 리포트로 남긴다.
- Google Drive는 API 쿼터와 저장공간 이슈를 분리해서 관리한다.

## 상태 전이 규칙
허용 상태:
- `pending`
- `running`
- `retry`
- `done`
- `failed`

허용 전이:
- `pending -> running`
- `running -> done`
- `running -> retry`
- `retry -> running`
- `retry -> failed`

상태 전이는 임의 확장하지 말고 문서와 코드 모두 동기화한다.

## 실행 규칙
- `npm run collect-metrics` - Google Ads 데이터 수집
- `npm run export` - CSV/XLSX 내보내기
- `npm run publish` - Google Drive/Sheets 배포
- `npm run qa` - QA 실행
- `npm run run-all` - 전체 파이프라인 실행
- 날짜 포함 파일명으로 CSV/XLSX를 생성한다.
- Google Drive 원본 보관 폴더 업로드 성공 여부를 기록한다.
- Google Sheets append/upsert 성공 여부를 기록한다.
- Drive 원본 건수와 Sheets 반영 건수를 대조한다.
- 둘 중 하나라도 실패하면 재시도 큐 또는 backfill 대상으로 등록한다.

## QA 규칙
- QA 전용 별도 앱/서비스 금지
- 실제 사용자 파이프라인과 동일 경로 사용
- 테스트 입력은 10개 단어로 고정 사용
- 문서 변경 시 경량 QA, 코드/설정 변경 시 전체 E2E QA 수행
- QA 결과는 `output/qa/qa_report.md`, `output/qa/qa_result.json`에 남긴다.
- QA는 신규 디렉터리 clone → bootstrap → 실행 재현까지 검증해야 한다.

## 금지사항
- README 생성
- 런타임 LLM 호출 경로 추가
- 입력 단어 임의 수정
- 출력 포맷 임의 변경
- 검증되지 않은 라이브러리 무분별 추가
- 테스트 없는 핵심 로직 교체
- 예외를 숨기고 성공 처리
- shard 완료 전 임의 done 처리
- Google Sheets를 유일한 원본 저장소로 취급
- QA를 mock만으로 대체

## 완료 기준
다음이 모두 만족되어야 완료로 본다.
1. `CLAUDE.md`와 `docs/` 전체 구조가 원본 설계서 정보를 누락 없이 보존한다.
2. LLM 처리 영역과 스크립트 처리 영역 분리 항목이 `CLAUDE.md` 본문에 존재한다.
3. 저장소 구조, bootstrap, env template, 명령 체계가 즉시 실행 가능 기준을 만족한다.
4. 입력 정규화 → shard → batch → 저장 → export → publish → QA 흐름이 문서상 일관된다.
5. QA 규칙이 실제 사용자 파이프라인 기준으로 정의된다.
6. 원본 설계서 대비 누락 0% 더블체크가 끝난다.

## 참조 문서
- 작업 진행 상태: `docs/task-progress.md` ⭐ **Claude 시작 시 먼저 확인**
- 전체 구조: `docs/architecture.md`
- 실행 환경 설정: `docs/setup.md`
- 운영/실패 처리: `docs/operations.md`
- QA 기준: `docs/qa-plan.md`
- 한도/과금 방지: `docs/limits.md`
- 서비스별 구현 규칙: `docs/references/*.md`
