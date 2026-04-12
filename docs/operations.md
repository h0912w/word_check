# operations.md

## 1. 운영 목표
- batch/shard 상태를 안정적으로 진행
- quota 초과 없이 Google Ads API를 호출
- export와 publish 성공 여부를 추적
- 누락 시 backfill 수행
- QA 판정 근거를 남김

## 2. 운영 체크포인트
- pending/running/retry/done/failed shard 수
- 최근 batch 성공률
- API 오류율
- export 일자별 생성 상태
- Drive 업로드 상태
- Sheets 반영 상태
- R2/Drive/Sheets 건수 일치 여부

## 3. 재시도 정책
### 자동 재시도
- 네트워크 오류
- 일시적 API 오류
- 저장소 timeout
- 일시적 Google API 실패

### 즉시 에스컬레이션
- 응답 구조 변화
- 반복적 schema mismatch
- 상태 전이 꼬임
- Drive 업로드 결과와 QA 판정 불일치

## 4. publish 검증 원칙
- R2 원본 record count 확보
- Drive 업로드된 CSV/XLSX 식별자 확보
- Sheets append row count 확보
- 3중 대조 수행
- 불일치 시 publish job 완료 처리 금지

## 5. backfill 원칙
- Sheets 누락은 row_key 기준으로 복구
- Drive 파일은 날짜별 파일 기준으로 존재 여부 확인
- R2는 source of truth로 유지

## 6. QA 연계 원칙
운영 중 문서/코드/설정이 바뀌면 QA를 수행한다.
특히 아래 변경은 전체 E2E QA가 필요하다.
- Google Ads 호출 로직 변경
- export 컬럼 변경
- publish 로직 변경
- Drive/Sheets credential 구조 변경
- D1 schema 변경

## 7. 운영 로그 최소 항목
- run_id
- shard_id
- batch_size
- batch_start_offset
- processed_count
- api_status
- export_id
- publish_id
- drive_file_id_csv
- drive_file_id_xlsx
- sheets_tab_name
- reconcile_status
- qa_status
