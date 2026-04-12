# coverage-check.md

## 목적
원본 설계서와 작성 지침 대비, 생성된 `CLAUDE.md` + `docs/` 구조가 핵심 요구를 빠짐없이 포함하는지 점검한다.

## 작성 지침 반영 점검
- [x] `CLAUDE.md`는 사람 대상 소개문이 아니라 Claude Code 작업 기준서로 작성됨
- [x] README 별도 파일 생성하지 않음
- [x] 누락 위험이 있는 세부 내용은 `docs/`와 `docs/references/`로 분리
- [x] Agent/Skills 자동 생성 파일은 문서로만 정의하고 실제 생성물로 강제하지 않음
- [x] 코드/문서 수정 후 QA 필수 규칙 포함
- [x] QA 전용 별도 소프트웨어 금지 규칙 포함
- [x] "현재 실행 중인 Claude Code 세션이 직접 AI 판정을 수행" 규칙 포함
- [x] LLM 처리 영역과 스크립트 처리 영역 분리 항목을 `CLAUDE.md` 본문에 포함

## 원본 설계서 핵심 항목 반영 점검
### 목적/범위/비목표
- [x] 프로젝트 목적
- [x] 배경과 목표
- [x] 포함 범위
- [x] 제외 범위

### 입력/출력 계약
- [x] 초기 1회 업로드 + 증분 업로드
- [x] `input_batch_id` 관리
- [x] txt/csv 입력 허용
- [x] normalized/shard/manifest 중간 산출물
- [x] 날짜별 CSV/XLSX 최종 산출물
- [x] Google Drive + Google Sheets 동시 배포
- [x] Google Drive 원본 보관 기준
- [x] Sheets 조회 계층 + row_key 검증

### 제약조건
- [x] 입력 단어 변형 금지
- [x] 생산 런타임 비LLM
- [x] quota/rate limit 준수
- [x] 서버 기반 실행
- [x] 무료 사용량 하드캡
- [x] 저장소 즉시 실행 구조
- [x] 결제수단 등록이 필요한 유료형 저장소 기본 제외
- [x] Google Drive 저장공간 별도 관리

### 워크플로우
- [x] bootstrap
- [x] 입력 정규화
- [x] shard 분할
- [x] Drive 업로드 및 상태 등록
- [x] Cron batch 실행
- [x] Google Ads API 호출 및 정규화
- [x] 결과 저장
- [x] export
- [x] publish
- [x] backfill/검증
- [x] QA

### 상태/실패/운영
- [x] shard 상태 목록
- [x] 상태 전이 규칙
- [x] 자동 재시도
- [x] 에스컬레이션
- [x] 스킵 + 로그
- [x] 운영 병목 및 한도 관리

### 구현 스펙/저장소 구조
- [x] 필수 루트 파일
- [x] 필수 디렉터리
- [x] bootstrap 원칙
- [x] package scripts 기준
- [x] D1 테이블 개요
- [x] 참조문서 세트
- [x] portable repo 원칙

### QA
- [x] 실제 사용자 파이프라인 기준 QA
- [x] 소량 입력 원칙
- [x] export/publish 포함 검증
- [x] 문서와 코드 일치성 검증
- [x] 신규 clone 환경 재현 테스트

## 비고
- 원본 설계서에 나온 Agent/Skill 파일 경로 예시는 실제 자동 생성 결과물이 아니라 구조적 참조 정보로 해석해, `CLAUDE.md`와 `docs/`에 행동 기준으로 반영했다.
- 설계서의 세부 서비스별 구현 정보는 `docs/references/` 하위 문서로 분리했다.
