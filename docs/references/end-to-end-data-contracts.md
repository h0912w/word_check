# end-to-end-data-contracts.md

## 1. 입력 계약
- 허용 형식: txt, csv
- UTF-8 기반
- 한 줄 한 단어 또는 지정 컬럼 한 단어
- 입력 batch는 `input_batch_id`로 추적

## 2. normalized_words 계약
- 파일: `output/prepared/normalized_words.txt`
- 공백 제거
- 빈 줄 제거
- 입력 순서 유지

## 3. shard manifest 계약
- 파일: `output/manifests/shard_manifest.json`
- 필드 예시: `input_batch_id`, `shard_id`, `row_count`, `checksum`, `file_path`

## 4. metrics record 계약
필수 컬럼:
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

## 5. row_key 규칙
권장 생성식:
```text
{input_batch_id}:{source_shard}:{source_offset}:{word}
```

## 6. export file 계약
- CSV/XLSX 파일명은 날짜 포함
- 컬럼 순서는 고정
- CSV와 XLSX는 동일한 데이터 계약을 따라야 함

## 7. publish report 계약
- `publish_id`
- `export_id`
- `drive_file_id_csv`
- `drive_file_id_xlsx`
- `source_record_count`
- `drive_record_count`
- `sheets_record_count`
- `status`

## 8. qa_result 계약
- `run_id`
- `status`
- `expected_row_count`
- `drive_row_count`
- `drive_file_id_csv`
- `drive_file_id_xlsx`
- `checked_at`
- `failure_reason`

## 9. LLM과 스크립트 분리 계약
- 설계/운영 판단/로그 해석: Claude Code 세션
- 데이터 처리/호출/저장/배포: 스크립트/Worker
- QA 판정은 실제 서버 + Drive 산출물 기준
