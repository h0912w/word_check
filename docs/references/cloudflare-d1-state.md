# cloudflare-d1-state.md

## 1. 역할
D1은 shard 진행 상태, batch 실행 이력, export/publish 검증 상태를 저장한다.

## 2. D1을 쓰는 이유
- 구조화된 상태 질의가 필요하다.
- KV보다 상태 전이/관계 관리에 적합하다.
- batch/shard/export/publish 단위 인덱스가 필요하다.

## 3. 권장 테이블
### input_batches
- input_batch_id
- uploaded_at
- source_filename
- total_rows
- status
- normalized_path

### shards
- shard_id
- input_batch_id
- file_path
- total_rows
- status
- current_offset
- retry_count
- last_run_at
- completed_at

### batch_runs
- run_id
- shard_id
- batch_start_offset
- batch_size
- api_status
- processed_count
- created_at

### export_jobs
- export_id
- export_date
- started_at
- finished_at
- record_count
- status
- output_csv_path
- output_xlsx_path

### publish_jobs
- publish_id
- export_id
- drive_status
- sheets_status
- drive_file_id
- sheet_tab_name
- source_record_count
- drive_record_count
- sheets_record_count
- verified_at

## 4. schema 예시
```sql
CREATE TABLE shards (
  shard_id TEXT PRIMARY KEY,
  input_batch_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  status TEXT NOT NULL,
  current_offset INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TEXT,
  completed_at TEXT
);
```

## 5. 저장 순서 규칙
- batch 실행 시작 전 상태 조회
- 결과 저장 성공 후 offset 갱신
- shard 끝에 도달했을 때만 `done`
- publish는 Drive/Sheets 결과 기록 후 verified_at 반영

## 6. idempotency 고려
- 동일 batch 재실행 시 중복 결과를 허용하지 않도록 키 설계
- publish는 row_key/record count 기준 재검증
- 증분 업로드 시 기존 shard 수정 금지

## 7. 상태 전이 함수 pseudo-code
```ts
function transitionShardStatus(current: Status, next: Status) {
  const allowed = {
    pending: ["running"],
    running: ["done", "retry"],
    retry: ["running", "failed"]
  };
  if (!allowed[current]?.includes(next)) throw new Error("invalid transition");
}
```

## 8. D1 접근 패턴
```ts
await env.DB.prepare(sql).bind(...values).run();
```

## 9. 금지
- 키워드 1건마다 DB 쓰기
- 상태 전이 검증 없이 업데이트
- publish 결과를 D1에 기록하지 않기
