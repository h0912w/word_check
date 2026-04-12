# limits.md

## 1. 목적
무료 사용량을 넘으면 코드 차원과 플랫폼 차원 모두에서 추가 과금보다 중단/실패를 우선하도록 설계한다.

## 2. 하드캡 원칙
- 공식 상한보다 낮은 내부 상한을 둔다.
- batch 실행 전 `free_tier_guard` 검사
- publish 실행 전 `free_tier_guard` 검사
- 상한 도달 시 다음 작업 시작 금지
- 중단 사유를 JSON 리포트로 남긴다.

## 3. 검사 항목
- Worker 실행 예산
- Google Ads 요청 예산
- Drive 업로드 예산
- Sheets append 예산
- Google Drive 저장공간 임계치

## 4. 중단 조건
- 광고 API 요청 예산 부족
- Drive/Sheets 반영 예산 부족
- Worker 실행 예산 부족
- Drive 저장공간 임계치 도달

## 5. 서비스별 해석
### Cloudflare Workers Free
무료 한도 초과 시 추가 과금 경로가 아니라 실패/차단 쪽을 우선하는 구성으로 사용한다.

### Cloudflare D1 Free
무료 한도 초과 시 더 이상 작업이 실패하는 방향을 전제로 사용한다.

### Google Drive API / Google Sheets API
API 쿼터 초과 시 요청 실패 처리로 본다.

### Google Drive 저장공간
API 과금과 별개다. 저장공간 초과로 업로드 실패할 수 있으므로 용량 관리 정책이 필요하다.

## 6. 운영 규칙
- 일일 export/publish 상한 분리
- 오래된 중간 산출물 정리 정책 운영
- 일별 export는 우선 보존
- 임시 파일은 자동 정리
- 중단 리포트 파일명에 날짜 포함

## 7. 권장 리포트 스키마
- date
- stop_reason
- worker_budget_remaining
- ads_budget_remaining
- drive_budget_remaining
- sheets_budget_remaining
- drive_storage_state
- blocked_phase
- created_at

## 8. 금지
- 하드캡 없이 quota만 믿고 계속 실행
- Google Drive 저장공간을 무한대로 가정
- 상한 도달 후에도 강행 실행
