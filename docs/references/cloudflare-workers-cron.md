# cloudflare-workers-cron.md

## 1. 역할
Cloudflare Workers와 Cron Triggers는 서버에서 자동으로 batch를 이어서 처리하는 실행 엔진이다.

## 2. 핵심 원칙
- 상시 장기 프로세스처럼 쓰지 않는다.
- 짧은 batch 반복 실행 구조로 쓴다.
- 체크포인트 저장 후 다음 scheduled 실행에서 이어받는다.

## 3. 핸들러 분리
- `fetch`: 운영 점검, 수동 트리거, health 용도
- `scheduled`: Cron orchestration 전용

## 4. 기본 패턴
```ts
export default {
  async scheduled(event, env, ctx) {
    await runScheduledBatch(event, env, ctx);
  },
  async fetch(request, env, ctx) {
    return new Response("ok");
  }
}
```

## 5. wrangler 설정 핵심
- D1 binding
- Cron schedule
- env vars / secrets
- optional compatibility flags

## 6. 로컬 테스트
권장:
```bash
wrangler dev --test-scheduled
```

## 7. Cron 설계
초기 권장:
- 1분 주기
- 실행당 quota-safe batch 여러 개
- duration limit 근접 전 조기 종료

## 8. scheduled 흐름
1. pending/retry shard 탐색
2. batch 로드
3. quota/free-tier 검사
4. Google Ads 호출
5. 결과 저장
6. offset 갱신
7. 다음 batch 반복 또는 종료

## 9. 조기 종료 조건
- quota 부족
- free-tier 예산 부족
- duration limit 근접
- 더 이상 처리할 shard 없음

## 10. 로그 규칙
- run id
- shard id
- batch start offset
- processed count
- api status
- stop reason
- created_at

## 11. 권장 구현
- Cron은 orchestration만 담당
- 실제 로직은 `batchRunner` 같은 별도 모듈로 분리
- fetch handler와 scheduled handler 역할 혼합 금지

## 12. 하지 말아야 할 구현
- 한 번의 scheduled 실행에서 과도하게 오래 버티기
- 상태 저장 없이 루프만 돌기
- fetch와 scheduled 경로를 뒤섞기
