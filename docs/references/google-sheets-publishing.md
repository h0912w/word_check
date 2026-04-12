# google-sheets-publishing.md

## 1. 역할
결과 데이터를 웹에서 바로 확인 가능한 표 형태로 제공한다.

## 2. 사용하는 이유
- 필터/정렬/간단 검토에 유리하다.
- 사용자가 브라우저에서 즉시 확인 가능하다.

## 3. 원칙
- Google Sheets는 조회 계층이다.
- 최종 원본 보관소는 Google Drive다.
- append 후 반영 건수와 누락 여부를 반드시 검증한다.

## 4. 시트 구조 정책
권장:
- 일별 시트 또는 월별 시트 분리
- 단일 시트 무한 append 금지
- 시트명 규칙을 고정

예시:
- `2026-04-12`
- `2026-04`

## 5. API 사용
- 새 시트 생성: `spreadsheets.batchUpdate`
- 행 반영: `spreadsheets.values.append`
- 필요 시 중복 보정: update/upsert 흐름

## 6. row_key 규칙
각 행에 고유 `row_key`를 생성한다.
권장 구성:
```text
row_key = export_date + "|" + input_batch_id + "|" + source_shard + "|" + source_offset + "|" + word
```

## 7. append 요청 body 예시
```json
{
  "values": [
    ["row_key", "word", "avg_monthly_searches", "competition", "competition_index"]
  ]
}
```

## 8. valueInputOption
권장:
- `RAW`
이유:
- 숫자/문자 보존 우선
- 자동 해석으로 인한 변형 방지

## 9. 시트 헤더 규칙
헤더는 append 전에 보장한다.
- 새 시트 생성 시 첫 행에 헤더 작성
- 컬럼 순서는 export 파일과 동일하게 유지

## 10. 건수 검증 규칙
- source record count 기록
- append 성공 후 reported row count 기록
- Drive 원본 건수와 비교
- 불일치 시 backfill 리포트 생성

## 11. backfill pseudo-code
```ts
for (const record of sourceRecords) {
  if (!sheetHasRowKey(record.row_key)) {
    appendRecord(record);
  }
}
```

## 12. 검증 리포트 구조
- export_date
- sheet_tab_name
- source_record_count
- sheets_record_count
- missing_row_keys
- duplicated_row_keys
- verified_at

## 13. 권장 구현
- append 직후 건수 검증
- 주기적 backfill 실행
- Sheets는 편의용 뷰 계층으로 유지

## 14. 하지 말아야 할 구현
- row_key 없이 append
- 단일 거대 시트로 계속 누적
- 검증 없이 publish 완료 처리
