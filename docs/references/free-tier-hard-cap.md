# free-tier-hard-cap.md

## 1. 역할
무료 사용량을 넘기기 전에 조기 중단하여 추가 과금 위험과 예기치 않은 자원 고갈을 방지한다.

## 2. 왜 필요한가
- Google Ads quota가 실제 병목일 가능성이 높다.
- Worker 실행, Drive 업로드, Sheets append도 누적 비용/한도 리스크가 있다.
- 플랫폼 기본 동작이 차단/실패 쪽이더라도 내부 상한을 더 낮게 둬야 안전하다.

## 3. 검사 항목
- worker invocation budget
- ads request budget
- drive upload budget
- sheets append budget
- drive storage threshold

## 4. stop reason enum 예시
- `worker_budget_exceeded`
- `ads_budget_exceeded`
- `drive_budget_exceeded`
- `sheets_budget_exceeded`
- `drive_storage_threshold_reached`

## 5. pseudo-code
```ts
function freeTierGuard(state: BudgetState) {
  if (state.worker <= 0) return stop("worker_budget_exceeded");
  if (state.ads <= 0) return stop("ads_budget_exceeded");
  if (state.drive <= 0) return stop("drive_budget_exceeded");
  if (state.sheets <= 0) return stop("sheets_budget_exceeded");
  if (state.driveStorageBlocked) return stop("drive_storage_threshold_reached");
  return { ok: true };
}
```

## 6. 리포트 JSON 스키마 예시
```json
{
  "date": "2026-04-12",
  "stop_reason": "ads_budget_exceeded",
  "worker_budget_remaining": 120,
  "ads_budget_remaining": 0,
  "drive_budget_remaining": 30,
  "sheets_budget_remaining": 1,
  "drive_storage_state": "ok",
  "blocked_phase": "batch-start",
  "created_at": "2026-04-12T00:00:00Z"
}
```

## 7. 운영 규칙
- 공식 상한보다 낮은 내부 상한 사용
- 상한 도달 전 조기 종료
- batch 시작 전 검사
- publish 시작 전 검사
- 리포트 파일 생성
- 운영자가 stop reason으로 재시작 여부 판단

## 8. 금지
- 하드캡 없이 재시도만 늘리기
- 예산 부족 상태에서 batch 시작
- Drive 저장공간 문제 무시
