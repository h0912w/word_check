# cloudflare-d1-state.md

## 역할
shard 진행 상태, retry 상태, export 상태, publish 상태를 추적한다.

## 메인 상태 저장소로 D1을 쓰는 이유
- KV보다 구조화된 상태 관리가 쉽다.
- batch/shard 중심 상태 추적에 적합하다.
- export/publish/QA와의 연계가 명확하다.

## 권장 테이블
- `input_batches`
- `shards`
- `batch_runs`
- `export_jobs`
- `publish_jobs`
- 필요 시 `qa_runs`

## 핵심 컬럼 예시
### publish_jobs
- publish_id
- export_id
- drive_status
- sheets_status
- drive_file_id_csv
- drive_file_id_xlsx
- source_record_count
- drive_record_count
- sheets_record_count
- verified_at

### qa_runs
- qa_run_id
- publish_id
- expected_row_count
- drive_row_count
- drive_file_id_csv
- drive_file_id_xlsx
- status
- checked_at
- failure_reason

## 원칙
- 키워드 1건마다 상태 write 금지
- batch/shard 단위 갱신
- publish와 QA의 Drive file id를 저장
