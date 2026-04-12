# qa-plan.md

## 1. QA 목적
실제 사용자 파이프라인이 끝까지 동작하는지 검증한다. QA는 실서버에서 작업을 실행하고 Google Drive에 업로드된 최종 출력물을 기준으로 pass/fail을 판정해야 한다.

## 2. 절대 규칙
1. QA 전용 별도 소프트웨어 금지
2. 실제 사용자 경로와 동일한 파이프라인 사용
3. 로컬 생성 파일만으로 pass 판정 금지
4. Google Drive 업로드 확인 없이 pass 금지
5. CSV/XLSX 둘 다 확인
6. 판정 근거는 파일 ID와 row count로 남김

## 3. QA 대상 흐름
1. 테스트 입력 파일 준비
2. normalize
3. shard build
4. R2 upload
5. D1 register
6. 실제 Worker/Cron 실행
7. 결과 저장
8. export 생성
9. Google Drive 업로드
10. Google Sheets 반영
11. Drive 업로드된 최종 파일 검증
12. `output/qa/qa_report.md`, `output/qa/qa_result.json` 기록

## 4. 테스트 입력 원칙
- 3~10개 단어
- 빈 줄 포함 케이스 1개
- 중복 단어 케이스 1개 가능
- 정상 단어 위주
- 비용 제어 목적의 소량 입력

## 5. PASS 조건
- 실제 서버 실행 성공
- export job 성공
- Google Drive에 CSV/XLSX 둘 다 업로드됨
- Drive row count가 기대 건수와 일치함
- 필수 컬럼이 유지됨
- 상태 전이가 정상임
- publish 결과와 QA 결과가 일치함

## 6. FAIL 조건
- Worker 실행 실패
- export 미생성
- Drive 업로드 실패
- Drive 파일은 있으나 row count mismatch
- CSV/XLSX 중 하나라도 누락
- QA 근거 파일 누락

## 7. QA 결과 파일 스키마
### qa_result.json
```json
{
  "run_id": "qa_2026_04_12_001",
  "status": "pass",
  "expected_row_count": 5,
  "drive_row_count": 5,
  "drive_file_id_csv": "...",
  "drive_file_id_xlsx": "...",
  "checked_at": "2026-04-12T10:00:00Z",
  "failure_reason": null
}
```

### qa_report.md 최소 항목
- 실행 환경
- 입력 파일
- Worker 실행 결과
- export 결과
- Drive 업로드 결과
- Sheets 반영 결과
- row count 비교 표
- 최종 판정

## 8. 자동 실행 트리거
- 코드 변경 후
- 문서 변경 후
- 배포 설정 변경 후
- export/publish/QA 로직 변경 후

## 9. 경량 QA vs 전체 QA
### 경량 QA
- 문서 오탈자, 비실행 문서 정리

### 전체 E2E QA
- 코드/설정/계약 변경
- publish 경로 변경
- 외부 API 인증 구조 변경

## 10. QA 승인 게이트
QA가 pass 되지 않으면 해당 변경은 완료로 보지 않는다.
