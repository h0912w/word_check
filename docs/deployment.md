# deployment.md

## 1. 배포 목표
- GitHub 저장소 clone/download 직후 Claude Code CLI가 바로 문맥을 이해할 수 있어야 한다.
- bootstrap 1회로 초기 준비가 끝나야 한다.
- 사용자가 직접 해야 하는 일은 계정 생성, 로그인, 비밀값 입력 정도로 제한한다.

## 2. 필수 저장소 구조
```text
/project-root
├── CLAUDE.md
├── src/
├── scripts/
├── config/
├── docs/
├── docs/references/
├── input/
├── output/prepared/
├── output/shards/
├── output/exports/
├── output/qa/
├── logs/
├── temp/
├── .env.example
├── wrangler.jsonc
├── package.json
└── tsconfig.json
```

## 3. 필수 루트 파일 역할
- `CLAUDE.md`: Claude Code 작업 기준서
- `package.json`: bootstrap, build, test, qa, export, publish 명령 정의
- `wrangler.jsonc`: Cloudflare Worker/Cron/D1 바인딩 설정
- `.env.example`: 로컬 개발/부트스트랩용 placeholder
- `tsconfig.json`: TypeScript 컴파일 기준

## 4. bootstrap 규칙
권장 명령:
```bash
npm install
npm run bootstrap
```

`bootstrap`이 해야 하는 일:
1. 필수 디렉터리 생성/검증
2. `.env.example` 기반 초기 로컬 파일 복사 지원
3. 필수 placeholder 파일 보장
4. self-check 출력
5. 실행 전 체크리스트 출력

## 5. 권장 scripts
```json
{
  "scripts": {
    "bootstrap": "tsx scripts/bootstrap_project.ts",
    "prepare-input": "tsx scripts/prepare_input.ts",
    "build-shards": "tsx scripts/build_shards.ts",
    "bootstrap-storage": "tsx scripts/bootstrap_storage.ts",
    "dev": "wrangler dev",
    "test-scheduled": "wrangler dev --test-scheduled",
    "build": "tsc -p tsconfig.json",
    "export": "tsx scripts/export_results.ts",
    "publish": "tsx scripts/publish_results.ts",
    "backfill-sheets": "tsx scripts/backfill_sheets.ts",
    "qa": "tsx scripts/run_qa.ts"
  }
}
```

## 6. Cloudflare 배포 구성
구성 요소:
- Worker
- Cron trigger
- D1 binding
- Worker secrets

원칙:
- scheduled handler와 fetch handler를 분리한다.
- Cron은 orchestration만 수행한다.
- quota/free-tier 검사 후 조기 종료를 허용한다.

## 7. 사용자가 준비해야 할 계정/권한
- Cloudflare 계정
- Google Ads 계정 + developer token
- Google Drive / Google Sheets 접근 권한
- OAuth 관련 credential
- Wrangler 로그인 및 배포 권한

## 8. secrets 원칙
민감정보는 저장소에 두지 않는다.

필요한 secret 범주:
- Google Ads 인증 정보
- Google Drive / Sheets 인증 정보
- 환경별 설정값
- 배포 환경 binding 값

자세한 모델은 `docs/references/auth-secrets-model.md` 참고.

## 9. 즉시 실행 보장 기준
다음이 모두 만족해야 한다.
1. 신규 환경에서 clone 후 bootstrap 가능
2. 필수 디렉터리 누락 없음
3. 명령 체계가 루트 기준으로 고정
4. env template 존재
5. QA가 신규 디렉터리 재현 테스트를 통과

## 10. 금지
- 사용자가 수동으로 폴더를 여러 개 만들어야 하는 구조
- README 의존 구조
- 비밀값을 코드에 하드코딩
- 특정 IDE 수동 설정을 필수 단계로 만드는 것
