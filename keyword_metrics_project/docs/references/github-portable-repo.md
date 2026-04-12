# github-portable-repo.md

## 목적
저장소를 GitHub에서 clone/download한 뒤 Claude Code CLI가 별도 수동 구조 보정 없이 바로 이해하고 실행할 수 있게 한다.

## 필수 파일
- `CLAUDE.md`
- `package.json`
- `.env.example`
- `wrangler.jsonc`
- `tsconfig.json`

## 필수 디렉터리
- `input/`
- `output/`
- `logs/`
- `temp/`
- `docs/`
- `config/`
- `scripts/`
- `src/`

## 원칙
- `.gitkeep`로 빈 디렉터리 유지
- bootstrap 명령 1회로 준비 완료
- README는 만들지 않음
- 사용자가 직접 해야 하는 것은 secrets 입력과 공식 로그인 정도로 제한

## QA 연계
- 새 디렉터리에 clone 후 bootstrap 후 실행까지 재현 테스트해야 함
