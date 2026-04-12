# cloudflare-r2-storage.md

## 역할
입력 shard, 결과 shard, export 원본, publish/backfill 리포트를 보관한다.

## Source of truth 원칙
- 최종 원본 보관소는 R2다.
- Drive는 사용자 확인용 보관소다.
- Sheets는 열람 계층이다.

## 저장 대상
- input shards
- result shards
- daily exports
- publish reports
- backfill reports
- QA 관련 보조 산출물 가능

## object key 예시
- `inputs/{input_batch_id}/shards/shard_000001.txt`
- `results/{export_date}/records/shard_000001.ndjson`
- `exports/{export_date}/keyword_metrics_YYYY-MM-DD.csv`
- `exports/{export_date}/keyword_metrics_YYYY-MM-DD.xlsx`

## 구현 원칙
- 날짜와 batch id 포함
- overwrite 여부를 명시적으로 통제
- content-type 지정
