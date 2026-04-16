# Railway Proxy Server Deployment Guide

## 개요
Railway에 Google Ads API 프록시 서버를 배포하는 방법입니다.

## Railway 무료 티어
- 월 $5 크레딧 제공
- 신용카드 불필요
- 512MB RAM, 0.5 vCPU
- 1GB 스토리지
- 충분한 트래픽 허용

## 배포 절차

### 1. Railway 계정 생성
1. https://railway.app/ 접속
2. GitHub으로 로그인
3. 신용카드 등록 없이 진행 가능

### 2. 새 프로젝트 생성
1. Dashboard에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. 이 저장소 선택
4. "Add Variables"에서 환경변수 설정

### 3. 환경변수 설정 (Railway Dashboard)
Railway의 Variables 탭에서 다음을 설정:

```bash
# Google Ads API (Proxy Server용 credentials)
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_LOGIN_CUSTOMER_ID=9876543210  # 선택사항

# OAuth2 (Proxy Server가 Google Ads API 호출에 사용)
GOOGLE_ADS_CLIENT_ID=your-oauth-client-id
GOOGLE_ADS_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token

# 보안
API_SECRET=랜덤-문자열-생성  # openssl rand -hex 32

# CORS 허용
WORKER_DOMAIN=*.workers.dev
ALLOWED_ORIGINS=*.workers.dev,https://your-worker.workers.dev

# 포트
PORT=3001
```

**중요**: Worker와 Proxy Server는 별도의 Google Ads credentials를 사용합니다:
- **Worker**: Google Drive/Sheets OAuth2만 필요 (GOOGLE_OAUTH_CLIENT_ID, SECRET, REFRESH_TOKEN)
- **Proxy Server**: Google Ads API OAuth2 필요 (GOOGLE_ADS_CLIENT_ID, SECRET, REFRESH_TOKEN)

### 4. 배포 확인
1. Railway가 자동으로 배포 시작
2. "Deployments" 탭에서 로그 확인
3. 배포 완료 후 URL 확인: `https://your-app.up.railway.app`

### 5. health check
```bash
curl https://your-app.up.railway.app/health
```

응답:
```json
{
  "status": "ok",
  "service": "google-ads-server",
  "timestamp": "2026-04-13T..."
}
```

### 6. Worker 설정 업데이트

#### 6.1 .env.local 업데이트
```bash
# Proxy Server Configuration
PROXY_SERVER_URL=https://your-app.up.railway.app
PROXY_API_SECRET=랜덤-문자열-동일-값
```

#### 6.2 wrangler.jsonc 업데이트
```jsonc
{
  "vars": {
    "PROXY_SERVER_URL": "https://your-app.up.railway.app",
    "PROXY_API_SECRET": {
      "type": "secret",
      "value": "랜덤-문자열-동일-값"
    }
  }
}
```

또는 secret 레퍼런스 사용:
```jsonc
"PROXY_API_SECRET": "@PROXY_API_SECRET"
```

그리고:
```bash
echo "PROXY_API_SECRET=랜덤-문자열-동일-값" >> .dev.vars
```

### 7. Worker 재배포
```bash
wrangler deploy
```

### 8. 통합 테스트
```bash
npm run test-scheduled
```

## API Secret 생성 방법

### 방법 1: OpenSSL
```bash
openssl rand -hex 32
```

### 방법 2: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 방법 3: 온라인 생성기
https://www.uuidgenerator.net/api/guid (두 개 연결)

## 트러블슈팅

### 배포 실패
1. Railway 로그 확인
2. package.json의 build:server 스크립트 확인
3. tsconfig.json 경로 확인

### 401 Unauthorized
- API Secret 일치 확인
- Worker의 Authorization 헤더 확인

### 403 Forbidden
- CORS 설정 확인
- ALLOWED_ORIGINS에 Worker domain 포함 확인

### Google Ads API 에러
- Developer token 유효성 확인
- Customer ID 형식 확인 (하이픈 제거)
- API quota 확인

## 모니터링
- Railway Dashboard: 로그, 메트릭
- Health check: `/health` 엔드포인트
- Worker logs: `wrangler tail`

## 비용 주의사항
- Railway 무료 티어: 월 $5 크레딧
- 초과 시 자동 중단 (과금 없음)
- Cloudflare Workers 무료 티어: 일 100,000 요청
- Google Ads API: 기본 quota 내에서 사용

## 보안 체크리스트
- [ ] API Secret 랜덤 생성
- [ ] Railway Variables에만 credentials 저장 (소스코드 X)
- [ ] .env.local을 .gitignore에 포함
- [ ] CORS 설정으로 무단 접근 방지
- [ ] Worker와 Proxy 간 통신만 허용
