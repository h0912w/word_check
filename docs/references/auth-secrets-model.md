# auth-secrets-model.md

## 1. 목적
외부 서비스 인증과 secret을 코드 저장소와 분리해 안전하게 관리한다.

## 2. 저장 위치
- 로컬 개발: `.env.local` 또는 동등한 비공개 파일
- 배포 환경: Cloudflare Worker secrets

## 3. 저장소에 커밋하면 안 되는 값
- access token
- refresh token
- client secret
- developer token
- service account private key
- API key
- 실제 spreadsheet id / private folder id가 민감한 경우 그 값

## 4. `.env.example` 에 포함할 placeholder 예시
- `GOOGLE_ADS_DEVELOPER_TOKEN=`
- `GOOGLE_ADS_CUSTOMER_ID=`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID=`
- `GOOGLE_OAUTH_CLIENT_ID=`
- `GOOGLE_OAUTH_CLIENT_SECRET=`
- `GOOGLE_REFRESH_TOKEN=`
- `GOOGLE_DRIVE_EXPORT_FOLDER_ID=`
- `GOOGLE_DRIVE_INPUT_FOLDER_ID=`
- `GOOGLE_SHEETS_SPREADSHEET_ID=`

## 5. 서비스별 구분
### Google Ads
- developer token
- OAuth credential
- customer id
- login customer id

### Google Drive / Google Sheets
- OAuth 또는 service credential
- target folder/spreadsheet id

### Cloudflare
- account/auth context
- D1 binding via wrangler config
- Worker secrets

## 6. 설정 로더 원칙
- 필수 값 누락 시 시작 전에 실패
- 런타임 중 secret 누락을 늦게 발견하지 않도록 bootstrap/self-check에서 검증
- naming convention을 문서와 코드에서 일치시킨다.

## 7. 누락 secret 감지 예시
```ts
const required = ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"];
for (const key of required) {
  if (!env[key]) throw new Error(`Missing secret: ${key}`);
}
```

## 8. 최소 권한 원칙
- 필요한 서비스 범위만 부여
- 편의상 광범위 권한 확대 금지
- secret rotation 가능 구조 유지

## 9. 금지
- secret 하드코딩
- 문서와 코드에서 다른 env 이름 사용
- placeholder 없이 실제 값을 예시에 넣기
