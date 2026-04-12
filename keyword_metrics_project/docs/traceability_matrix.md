# traceability_matrix.md

이 문서는 원본 설계서와 작성 지침의 핵심 요구가 누락 없이 반영되었는지 더블체크하기 위한 추적표다.

| 원본 요구 | 반영 위치 |
|---|---|
| 입력 단어 목록 업로드 후 서버 자동 진행 | `CLAUDE.md`, `docs/architecture.md` |
| 증분 업로드와 `input_batch_id` 관리 | `CLAUDE.md`, `docs/references/end-to-end-data-contracts.md` |
| Cloudflare Workers + Cron + R2 + D1 | `docs/architecture.md`, `docs/references/cloudflare-workers-cron.md`, `cloudflare-r2-storage.md`, `cloudflare-d1-state.md` |
| Google Ads historical metrics 수집 | `CLAUDE.md`, `docs/references/google-ads-historical-metrics.md` |
| 날짜별 CSV/XLSX export | `CLAUDE.md`, `docs/references/end-to-end-data-contracts.md` |
| Google Drive + Google Sheets 동시 배포 | `CLAUDE.md`, `docs/references/google-drive-publishing.md`, `google-sheets-publishing.md` |
| R2 원본 보관소 원칙 | `CLAUDE.md`, `docs/references/cloudflare-r2-storage.md` |
| GitHub에서 바로 실행 가능한 저장소 | `CLAUDE.md`, `docs/references/github-portable-repo.md` |
| README 생성 금지 | `CLAUDE.md` |
| LLM 처리/스크립트 처리 분리 명시 | `CLAUDE.md`, `docs/references/end-to-end-data-contracts.md` |
| 코드/문서 수정 후 QA 의무 | `CLAUDE.md`, `docs/qa-plan.md`, `.claude/agents/qa-executor/AGENT.md` |
| QA 전용 별도 소프트웨어 금지 | `CLAUDE.md`, `docs/qa-plan.md` |
| QA는 실제 서버 실행 후 실제 결과물로 판정 | `CLAUDE.md`, `docs/qa-plan.md` |
| 사용자 추가 요구: QA는 Google Drive 업로드 최종 출력물 기준 판정 | `CLAUDE.md`, `docs/qa-plan.md`, `.claude/agents/qa-executor/AGENT.md`, `scripts/run_qa.ts` |
| 참조문서 세트 생성 | `docs/references/*` |
| 누락 0% 더블체크 | 이 문서 자체 + `docs/validation_checklist.md` |
