# github-portable-repo.md

## 1. 목표
GitHub 저장소를 내려받은 직후 Claude Code CLI에서 별도 추가조치 없이 바로 문맥을 이해하고 작업 가능한 저장소를 만든다.

## 2. 필수 파일
- `CLAUDE.md`
- `package.json`
- `.env.example`
- `wrangler.jsonc`
- `tsconfig.json`

## 3. 필수 디렉터리
- `input/`
- `output/`
- `logs/`
- `temp/`
- `docs/`
- `docs/references/`
- `scripts/`
- `src/`
- `config/`

## 4. `.gitkeep` 사용 이유
비어 있는 필수 폴더가 clone 직후에도 존재하도록 보장하기 위함이다.

## 5. bootstrap 명령
```bash
npm run bootstrap
```

## 6. bootstrap_project가 해야 하는 일
- 필수 폴더 생성/검증
- env template 복사 지원
- placeholder 파일 보장
- self-check
- 실행 체크리스트 출력

## 7. package scripts 기준
- `bootstrap`
- `prepare-input`
- `build-shards`
- `bootstrap-storage`
- `build`
- `export`
- `publish`
- `backfill-sheets`
- `qa`

## 8. 신규 환경 QA 체크
- 새 디렉터리 clone
- bootstrap 실행
- 입력 배치
- end-to-end 실행
- export/publish 확인

## 9. 금지
- README가 없으면 이해 불가한 구조
- 수동 폴더 생성 전제
- 숨겨진 수동 설정 절차
