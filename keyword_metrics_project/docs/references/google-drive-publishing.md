# google-drive-publishing.md

## 역할
날짜별 CSV/XLSX 최종 산출물을 사용자가 직접 열람하고 다운로드할 수 있도록 Google Drive에 업로드한다.

## 왜 Drive를 쓰는가
- 날짜별 파일 보관에 적합
- 파일 열람 및 다운로드가 쉬움
- QA에서 실제 최종 산출물을 판정하기 좋음

## 파일명 규칙
- `keyword_metrics_YYYY-MM-DD.csv`
- `keyword_metrics_YYYY-MM-DD.xlsx`

## 폴더 구조
- 지정된 Drive 폴더 ID에 업로드
- 파일 ID를 D1 `publish_jobs`에 저장

## 업로드 방식 권장안
- 기본: multipart upload
- 대용량 확장 필요 시 resumable upload 검토

## 중복 파일 정책
기본 권장:
1. 같은 날짜 파일이 있으면 기존 파일 검색
2. overwrite 대신 새 버전 생성 또는 타임스탬프 suffix 부여
3. publish job에는 실제 배포된 file id 저장

## 필요한 메타데이터
- file id
- name
- mimeType
- parents
- createdTime 또는 modifiedTime

## 업로드 후 검증
- CSV/XLSX 둘 다 업로드 성공
- file id 저장 성공
- 파일명 규칙 일치
- QA가 이 file id로 최종 판정 가능해야 함

## QA 연계 절대 원칙
QA pass/fail은 Drive에 올라간 최종 파일 기준으로만 판정한다. 로컬 export 결과는 참고 자료일 뿐 최종 판정 근거가 아니다.

## 하지 말아야 할 구현
- Drive 업로드를 생략하고 QA 완료 처리
- CSV만 업로드하고 성공으로 간주
- 파일 ID 저장 없이 “업로드 성공” 로그만 남김
