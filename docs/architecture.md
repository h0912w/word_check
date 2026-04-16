# architecture.md

## 1. 시스템 목적
이 프로젝트는 영어 단어 목록을 **로컬에서 배치 처리**하여 Google Ads historical metrics를 수집하고, 결과를 날짜별 CSV/XLSX로 export한 뒤 Google Drive와 Google Sheets에 동시 배포하는 구조를 만든다.

## 2. 상위 설계 목표
- 입력 단어 측정 자동화
- 검색량 및 경쟁강도 동시 수집
- 로컬 PC에서 주기 실행 (수동 또는 node-cron)
- 결과를 사용자가 직접 열람 가능한 위치로 배포
- 저장소 자체 완결성 확보
- QA 에이전트가 실제 파이프라인으로 검증

## 3. 범위
### 포함
- 영어 단어 리스트 입력
- 배치 분할 및 로컬 파일 저장
- 주기 실행 (수동 또는 node-cron)
- Google Ads API historical metrics 수집
- 결과 저장 (SQLite DB + JSON)
- CSV/XLSX export
- 재시도, 체크포인트, 진행률 관리
- Google Drive / Google Sheets 배포
- 실제 파이프라인 QA

### 제외
- 단어 의미 해석
- 단어 변형, 동의어 생성, 조합 생성
- 검색량 기반 점수화/랭킹 고도화
- SEO 적합성 판단
- 최종 사업성 평가
- 사용자용 대시보드 구축

## 4. 시스템 구성요소
- Node.js: 배치 실행 엔진
- SQLite: shard/batch/export/publish 상태 저장
- google-ads-node: Google Ads API gRPC 클라이언트
- Google Ads API: historical metrics 원천 데이터
- Google Drive: 입력 shard 및 결과 원본 보관
- Google Sheets: 열람 계층
- node-cron: 주기 실행 (선택사항)
- GitHub: 코드/문서 버전관리
- Claude Code: 설계, 구현, 수정, QA 조율

## 5. 핵심 데이터 흐름
```text
입력 파일 업로드
→ 정규화
→ shard 분할
→ manifest 생성
→ 로컬 파일 저장 (output/shards/)
→ SQLite DB 상태 등록
→ batch 실행 (npm run collect-metrics)
→ Google Ads API 직접 호출
→ 응답 정규화
→ 결과 저장 (SQLite + JSON)
→ offset 갱신
→ shard 완료
→ 일별 export (npm run export)
→ Drive 업로드
→ Sheets 반영 (npm run publish)
→ 건수 검증 / backfill
→ QA (npm run qa)
```

## 6. 단계별 정의
### 6.1 저장소 bootstrap
목적:
- clone/download 직후 추가 수동 조치 없이 실행 가능한 상태로 맞춘다.

주요 처리:
- 필수 디렉터리 보장
- `.env.example` 기반 초기 설정 파일 복사 지원
- dependency 설치
- self-check 실행
- 기본 명령어 노출

성공 기준:
- bootstrap 1회로 작업 준비가 끝난다.

### 6.2 입력 수집 및 정규화
입력:
- `input/*.txt`
- `input/*.csv`

출력:
- `output/prepared/normalized_words.txt`

규칙:
- UTF-8 정규화
- 빈 줄 제거
- 앞뒤 공백 제거
- `input_batch_id` 부여
- 기본값은 중복 유지
- 증분 업로드는 별도 batch 등록

### 6.3 shard 분할 및 manifest 생성
출력:
- `output/shards/shard_*.txt`
- `output/manifests/shard_manifest.json`

규칙:
- shard id, row count, checksum 생성
- 기존 shard는 수정하지 않고 신규 입력 시 새 shard 세트 추가

### 6.4 로컬 파일 저장 및 상태 등록
규칙:
- 모든 shard를 `output/shards/`에 저장
- manifest를 `output/manifests/`에 저장
- SQLite DB에 초기 상태 `pending` 등록
- 미등록 shard가 없어야 한다

### 6.5 주기 batch 실행 (수동 또는 node-cron)
배치 절차:
1. `pending` 또는 `retry` 상태 shard 선택
2. 현재 offset 기준 단어 N개 로드
3. quota / free-tier 예산 점검
4. Google Ads API 직접 요청 (google-ads-node)
5. 응답 정규화
6. SQLite DB에 결과 저장
7. offset 갱신
8. shard 끝이면 `done`

### 6.6 응답 정규화
필수 필드:
- word
- avg_monthly_searches
- competition
- competition_index
- monthly_searches_raw
- collected_at
- api_status
- retry_count

원칙:
- 입력 단어와 결과를 1:1 추적 가능하게 유지
- 실패도 상태와 코드가 남아야 한다

### 6.7 결과 저장
원칙:
- 결과는 SQLite DB에 저장
- JSON 백업을 `data/backups/`에 저장
- Google Drive는 선택적 원본 보관용
- batch 저장 직후 offset과 결과 건수 일관성 검증

### 6.8 최종 집계 및 export
출력:
- `output/exports/keyword_metrics_YYYY-MM-DD.csv`
- `output/exports/keyword_metrics_YYYY-MM-DD.xlsx`

원칙:
- shard 결과 병합
- 컬럼 순서 고정
- CSV 우선 보존
- XLSX 실패 시 CSV는 유지한 채 재시도 가능

### 6.9 결과 배포
배포 순서:
1. 날짜 포함 파일명으로 export 생성
2. Google Drive 업로드
3. Google Sheets 반영
4. Drive/Sheets 성공 여부 기록
5. 건수 대조
6. 실패 경로만 재시도 큐 등록
7. backfill 검증

### 6.10 QA
원칙:
- 실제 사용자 파이프라인 사용
- 별도 QA 전용 앱 금지
- 소량 입력 사용
- 문서/코드/설정 변경 후 실행

## 7. 상태 모델
### shard 상태
- pending
- running
- retry
- done
- failed

### 전이
```text
pending -> running
running -> done
running -> retry
retry -> running
retry -> failed
```

## 8. 설계상 강제 제약
- 생산 런타임은 LLM 비의존 구조여야 한다.
- 입력 단어 변형 금지
- 상태 저장은 batch/shard 중심
- Google Sheets는 원본 저장소가 아니다
- QA는 반드시 최종 결과물을 기준으로 판정한다

## 9. 참조 관계
- 실행 환경 설정: `setup.md`
- 운영/실패 처리: `operations.md`
- 테스트 기준: `qa-plan.md`
- 한도/과금 방지: `limits.md`
- 세부 구현 규칙: `docs/references/*.md`
