# google-drive-publishing.md

## 1. 역할
날짜별 CSV/XLSX 결과 파일을 사용자가 직접 열람할 수 있도록 Google Drive에 업로드한다.

## 2. 사용하는 이유
- 날짜별 파일 보관 및 공유가 쉽다.
- 웹에서 바로 열람/다운로드가 가능하다.
- 프로젝트의 최종 원본 보관소 역할을 맡는다.

## 3. 파일명 규칙
- `keyword_metrics_YYYY-MM-DD.csv`
- `keyword_metrics_YYYY-MM-DD.xlsx`

## 4. 폴더 구조 권장
- Drive `/input/` 계층: shard 및 manifest
- Drive `/exports/YYYY/MM/` 계층: 날짜별 결과 파일
- Drive `/reports/YYYY/MM/` 계층: publish/backfill/free-tier 리포트

## 5. 업로드 방식
비교:
- simple upload: 작고 단순한 파일
- multipart upload: 메타데이터 + 파일 본문 동시 업로드
- resumable upload: 대용량/불안정 네트워크 대응

권장:
- 결과 CSV/XLSX는 기본 `multipart upload`
- 대형 파일 또는 불안정 환경이면 `resumable upload` 고려

## 6. 필수 메타데이터
- file name
- MIME type
- `parents` 폴더 ID
- 필요 시 export_date / export_batch_id 사용자 메타

## 7. MIME type 예시
- CSV: `text/csv`
- XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

## 8. multipart upload 예시 구조
```http
POST /upload/drive/v3/files?uploadType=multipart
Content-Type: multipart/related; boundary=...
```

메타데이터 예시:
```json
{
  "name": "keyword_metrics_2026-04-12.csv",
  "parents": ["DRIVE_FOLDER_ID"]
}
```

## 9. 응답에서 기록할 필드
- `id`
- `name`
- `mimeType`
- `parents`
- created timestamp
- optional web link

## 10. 같은 날짜 파일 존재 시 정책
권장:
- 기본은 날짜+시각 suffix 새 버전 생성
- overwrite가 필요하면 명시적 설정으로만 허용
- file id는 D1 publish_jobs에 기록

## 11. 실패 처리
- 일시 실패: 최대 3회 재시도
- Drive 성공 / Sheets 실패: Sheets만 재시도 큐 등록
- Drive 실패 / Sheets 성공: Drive만 재시도 큐 등록
- 반복 실패: 에스컬레이션

## 12. 코드 패턴
```ts
async function uploadExportToDrive(file: Uint8Array, meta: DriveMeta): Promise<DriveUploadResult> {
  // build multipart body
  // POST to Drive files.create
  // return file id and status
}
```

## 13. 검증
- 업로드 성공 응답 확인
- 파일명 패턴 검증
- D1에 file id 저장
- source record count와 publish 기록 연결

## 14. 하지 말아야 할 구현
- Drive 업로드 성공 여부 기록 생략
- 파일명 규칙 임의 변경
- Drive를 건너뛰고 Sheets만 반영
