# limits.md

## 운영 제한과 기본값
- batch 크기는 보수적으로 시작하고 실측으로 조정한다.
- retry는 기본 2~3회 범위로 제한한다.
- Cron은 짧은 주기 반복 실행을 전제로 한다.
- 단일 실행이 Worker duration limit에 가까워지지 않도록 조기 종료 기준을 둔다.
- Google Ads API quota와 rate limit를 최우선 병목으로 본다.
- Sheets는 무한 단일 탭 append를 피하고 일별 또는 월별 탭 분리를 기본으로 한다.
- QA 입력은 소량으로 유지한다.
