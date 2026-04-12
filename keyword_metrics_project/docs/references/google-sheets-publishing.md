# google-sheets-publishing.md

## 역할
사용자가 웹에서 결과를 빠르게 열람하고 필터/정렬할 수 있도록 Google Sheets에 반영한다.

## 원칙
- Sheets는 원본 저장소가 아니다.
- R2와 Drive가 원본 보관 계층이다.
- Sheets는 row_key 기반 검증과 backfill 대상이다.

## 운영 정책
- 단일 탭 무한 append 금지
- 일별 또는 월별 탭 분리를 기본으로 사용
- 헤더는 export 컬럼 계약과 동일하게 유지

## row_key 원칙
- 최소 구성: `input_batch_id + source_shard + source_offset + word`
- 재실행 시 idempotent 판정에 사용

## append 후 검증
- append row count 기록
- source record count와 비교
- 누락 시 backfill 큐 등록

## backfill 원칙
- R2 원본 기준으로 비교
- row_key 단위 누락만 보정
- 중복 생성 금지

## 하지 말아야 할 구현
- Sheets를 source of truth로 간주
- append 성공 응답만 보고 실제 건수 검증 생략
- row_key 없이 단순 누적
