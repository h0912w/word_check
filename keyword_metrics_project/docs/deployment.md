# deployment.md

## 1. 배포 목표
- 저장소를 clone/download한 뒤 bootstrap 1회로 로컬 준비를 끝낸다.
- Cloudflare Workers, R2, D1, Cron, Google APIs 연동이 가능한 상태를 만든다.
- QA가 실제 서버에서 실행할 수 있는 staging 또는 production-equivalent 환경을 유지한다.

## 2. 사용자가 준비할 것
- Cloudflare 계정
- Google Ads 계정 및 developer token
- Google Drive/Sheets API 사용 가능한 Google Cloud 프로젝트 또는 서비스 계정 자격
- Wrangler 로그인 권한
- 필요한 secrets 값

## 3. 저장소 bootstrap 기준
- `npm install`
- `.env.example` → `.env.local` 복사
- 필수 디렉터리 자동 점검
- 설정 파일 placeholder 유지
- `npm run bootstrap` 성공

## 4. 권장 배포 단계
1. Cloudflare 리소스 생성
   - Worker
   - R2 bucket
   - D1 database
   - Cron trigger
2. Google API 준비
   - Ads API 접근 준비
   - Drive API 활성화
   - Sheets API 활성화
3. secrets 입력
4. `wrangler deploy`
5. 초기 storage/bootstrap 스크립트 실행
6. 테스트 입력 업로드
7. 수동 export/publish 1회 점검
8. QA E2E 실행

## 5. 환경 분리
- local: 로컬 스크립트 점검용
- staging: QA 기본 환경
- production: 실제 운영 환경

권장 원칙:
- QA는 최소 staging 이상의 실제 서버 환경에서 실행한다.
- 로컬 전용 mock만으로 배포 승인하지 않는다.

## 6. 배포 후 확인
- Worker scheduled handler 동작 여부
- R2 접근 여부
- D1 write/read 여부
- Google Ads API 인증 성공 여부
- Google Drive 업로드 성공 여부
- Google Sheets append 성공 여부
- QA 결과 생성 여부

## 7. 배포 차단 조건
- 필수 secret 누락
- export는 성공했지만 Drive 업로드 실패
- Drive 업로드는 성공했지만 QA가 Drive 기준 검증 불가
- 데이터 계약 문서와 실제 코드 불일치
