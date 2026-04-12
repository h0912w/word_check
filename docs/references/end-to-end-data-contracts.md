# end-to-end-data-contracts.md

## 1. 목적
입력, 중간 산출물, 최종 산출물 사이의 데이터 계약을 고정한다.

## 2. 입력 파일 계약
### txt
- UTF-8
- 한 줄 1단어

### csv
- 최소 1개 컬럼에 단어 포함
- 내부 표준화 과정에서 단일 단어 리스트로 정규화

## 3. normalized_words 계약
경로:
- `output/prepared/normalized_words.txt`

규칙:
- 빈 줄 제거
- 앞뒤 공백 제거
- UTF-8 유지
- 기본 중복 유지

## 4. shard manifest 계약
경로:
- `output/manifests/shard_manifest.json`

필드 예시:
```json
{
  "input_batch_id": "batch_20260412_001",
  "total_rows": 1000,
  "total_shards": 10,
  "shards": [
    {
      "shard_id": "shard_000001",
      "file_path": "output/shards/shard_000001.txt",
      "row_count": 100,
      "checksum": "..."
    }
  ]
}
```

## 5. metrics record 계약
필수 필드:
- word
- avg_monthly_searches
- competition
- competition_index
- monthly_searches_raw
- collected_at
- api_status
- retry_count
- source_shard
- source_offset
- input_batch_id
- export_date
- export_batch_id

## 6. CSV 컬럼 순서
```text
word,avg_monthly_searches,competition,competition_index,monthly_searches_raw,collected_at,api_status,retry_count,source_shard,source_offset,input_batch_id,export_date,export_batch_id
```

## 7. XLSX 규칙
- CSV와 같은 컬럼 순서
- 시트명은 날짜 또는 고정 export 규칙 기반
- 구조는 CSV 계약과 동일해야 한다

## 8. row_key 규칙
```text
row_key = export_date + "|" + input_batch_id + "|" + source_shard + "|" + source_offset + "|" + word
```

## 9. export_batch_id 규칙
- 동일 export job 내 레코드 집합을 식별하는 고유 값
- 날짜별 export와 연결 가능해야 한다

## 10. publish report 계약
예시 필드:
- publish_id
- export_id
- drive_status
- sheets_status
- source_record_count
- drive_record_count
- sheets_record_count
- verified_at

## 11. QA report 계약
- `qa_report.md`: 사람이 읽는 실행/검증 기록
- `qa_result.json`: pass/fail, counts, failed checks

## 12. reconciliation rule
- Drive 원본 건수 == export source_record_count
- Sheets 반영 건수 == Drive 원본 건수
- 불일치 시 publish 완료 처리 금지, backfill 필요

## 13. 금지
- export 컬럼 순서 임의 변경
- publish report 없이 완료 처리
- row_key 없이 Sheets 반영
