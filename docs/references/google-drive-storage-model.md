# google-drive-storage-model.md

## 1. 역할
Google Drive는 입력 shard, 결과 원본 파일, publish/backfill 리포트를 저장하는 최종 파일 보관소다.

## 2. 저장 대상
- 입력 shard
- shard manifest
- 결과 export CSV/XLSX
- publish report
- backfill report
- free-tier report

## 3. source of truth 원칙
- 결과 원본 기준은 Google Drive 파일이다.
- Sheets는 뷰 계층이다.
- D1은 상태/인덱스용이다.

## 4. 폴더 구조 권장
```text
/input/{input_batch_id}/
  manifest.json
  shard_000001.txt
/exports/{YYYY}/{MM}/
  keyword_metrics_YYYY-MM-DD.csv
  keyword_metrics_YYYY-MM-DD.xlsx
/reports/{YYYY}/{MM}/
  publish_report_YYYY-MM-DD.json
  sheets_backfill_report_YYYY-MM-DD.json
  free_tier_guard_report_YYYY-MM-DD.json
```

## 5. 파일명 규칙
- 날짜 포함
- 필요 시 batch id 또는 시각 suffix 포함
- 중간 결과와 최종 결과를 명확히 구분

## 6. 조회/list 패턴
- 특정 폴더 기준 list
- 날짜/월 기준 list
- 동일 날짜 중복 파일 탐지
- file id 기반 추적

## 7. overwrite 정책
권장:
- 기본은 새 버전 추가
- overwrite는 명시적 운영 설정일 때만 허용

## 8. 메타데이터 기록
D1 publish_jobs에 기록:
- drive_file_id
- output_csv_path
- output_xlsx_path
- source_record_count
- drive_record_count
- verified_at

## 9. 용량 관리
- Drive 저장공간은 API quota와 별개다.
- 중간 임시 파일 정리 정책 운영
- 일별 export 우선 보존
- 용량 임계치 도달 시 publish 전 중단

## 10. 금지
- Drive 없이 로컬에만 원본 저장
- 결과 원본과 리포트를 뒤섞어 저장
- 용량 관리 없이 무한 보관
