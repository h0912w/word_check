# qa-plan.md

## 1. QA 목표
- 실제 사용자 파이프라인이 end-to-end로 동작하는지 검증한다.
- 문서와 코드가 일치하는지 확인한다.
- 결과 산출물이 사용자가 실제로 받는 형식과 동일한지 검증한다.

## 2. QA 절대 원칙
- QA 전용 별도 앱/서비스 금지
- 실제 사용자와 동일한 경로 사용
- 최종 산출물과 상태 기록을 기준으로 pass/fail 판정
- 코드나 문서 수정 후 QA 필수

## 3. QA 입력 크기
- 10개 단어로 고정
- 중복, 빈 줄, 특수 케이스 일부 포함

## 4. QA 절차
1. 신규 디렉터리에 저장소 clone/download
2. bootstrap 실행
3. 테스트 입력 파일 배치
4. 입력 정규화
5. shard 생성
6. storage bootstrap
7. Worker 실행
8. 결과 저장 확인
9. export 실행
10. Drive 업로드 / Sheets 반영
11. 건수 대조 및 row_key 검증
12. QA 리포트 생성

## 5. QA 산출물
- `output/qa/qa_report.md`
- `output/qa/qa_result.json`

## 6. QA 성공 기준
- 결과 CSV/XLSX 생성 성공
- 필수 컬럼 존재
- 적어도 1개 이상 성공 레코드 생성
- 실패 레코드가 있어도 상태 추적 가능
- export 파일이 실제로 열림
- Drive 업로드와 Sheets 반영 건수가 원본과 일치
- `row_key` 정상 생성
- 문서의 env/binding/table/file 규칙과 실제 코드가 일치

## 7. QA 실패 처리
- 문서만 수정: 경량 QA
- 코드/설정 변경: 전체 E2E QA
- 실패 시 배포 차단 가능
- 반복 실패 시 에스컬레이션

## 8. 문서 QA
다음도 함께 검증한다.
1. `docs/references/` 문서가 모두 존재하는가
2. 문서의 env/binding 이름과 코드가 일치하는가
3. 데이터 계약과 export 컬럼이 일치하는가
4. publish 절차와 실제 동작이 일치하는가
5. free-tier 중단 규칙이 코드와 일치하는가

## 9. 금지
- mock만으로 QA 완료 처리
- 최종 산출물 확인 없이 pass 처리
- 사용자 파이프라인과 다른 우회 경로 사용
