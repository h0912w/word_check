# cloudflare-workers-cron.md

## 역할
Cloudflare Workers가 Google Ads API 호출, 저장, export/publish orchestration을 수행하고 Cron Trigger가 이를 주기적으로 깨운다.

## 구현 원칙
- 상시 실행 프로세스로 쓰지 않는다.
- 짧은 batch 반복 실행 구조로 사용한다.
- scheduled handler와 일반 fetch handler 역할을 분리한다.

## scheduled handler 예시 구조
```ts
export default {
  async scheduled(event, env, ctx) {
    await runScheduledBatch(env);
  }
}
```

## 권장 구조
- `scheduled()`는 orchestration만 수행
- 실제 배치 로직은 `batchRunner.ts`로 분리
- quota 초과 예상 시 조기 종료

## 로컬 테스트
- `wrangler dev --test-scheduled`

## 주의점
- 단일 실행이 duration limit에 가까워지지 않도록 배치 수를 제한
- 상태 갱신 전후 순서를 고정
