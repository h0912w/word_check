# Proxy Server Deployment Quick Start

## 현재 상태
- ✅ Proxy server 코드 완료 (`server/google-ads-server.ts`)
- ✅ Worker client 코드 완료 (proxy server 호출)
- ✅ Railway 배포 설정 완료
- ⏳ Railway 배포 필요
- ⏳ 통합 테스트 필요

## 아키텍처 요약

```
┌─────────────────────────────────────────┐
│  Cloudflare Workers                     │
│  - Batch orchestration                  │
│  - D1 state management                  │
│  - Drive/Sheets publish                 │
│  - OAuth2 for Drive/Sheets              │
└─────────────────┬───────────────────────┘
                  │ HTTP (X-API-Secret)
┌─────────────────▼───────────────────────┐
│  Proxy Server (Railway)                 │
│  - Express.js server                    │
│  - google-ads-node (gRPC)               │
│  - OAuth2 for Google Ads API            │
└─────────────────┬───────────────────────┘
                  │ gRPC
┌─────────────────▼───────────────────────┐
│  Google Ads API                         │
└─────────────────────────────────────────┘
```

## OAuth2 Credentials 분리

| Component | 용도 | 필요한 Credentials |
|-----------|------|-------------------|
| **Worker** | Drive/Sheets API | GOOGLE_OAUTH_CLIENT_ID, SECRET, REFRESH_TOKEN |
| **Proxy Server** | Google Ads API | GOOGLE_ADS_CLIENT_ID, SECRET, REFRESH_TOKEN, DEVELOPER_TOKEN, CUSTOMER_ID |

## 배포 절차

### 1단계: Railway 배포

```bash
# Railway CLI 설치 (npm)
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 초기화
railway init

# 환경변수 설정
railway variables set GOOGLE_ADS_DEVELOPER_TOKEN="your-token"
railway variables set GOOGLE_ADS_CUSTOMER_ID="1234567890"
railway variables set GOOGLE_ADS_CLIENT_ID="your-client-id"
railway variables set GOOGLE_ADS_CLIENT_SECRET="your-secret"
railway variables set GOOGLE_ADS_REFRESH_TOKEN="your-refresh-token"
railway variables set API_SECRET="$(openssl rand -hex 32)"
railway variables set WORKER_DOMAIN="*.workers.dev"
railway variables set ALLOWED_ORIGINS="*.workers.dev"

# 배포
railway up

# 배포 상태 확인
railway status

# 로그 확인
railway logs
```

### 2단계: 배포 URL 확인

Railway Dashboard에서 배포된 URL을 확인:
```
https://your-app-name.up.railway.app
```

### 3단계: Worker 설정 업데이트

#### .env.local 업데이트
```bash
# Railway에서 생성한 API_SECRET과 동일하게 설정
PROXY_API_SECRET=same-as-railway-api-secret
PROXY_SERVER_URL=https://your-app-name.up.railway.app
```

#### .dev.vars 업데이트 (로컬 개발용)
```bash
PROXY_API_SECRET=same-as-railway-api-secret
PROXY_SERVER_URL=http://localhost:3001
```

### 4단계: 로컬에서 Proxy Server 테스트

```bash
# 로컬에서 proxy server 실행
npm run ads-server
```

별도 터미널에서 health check:
```bash
curl http://localhost:3001/health
```

### 5단계: Worker 통합 테스트

```bash
# Local test
npm run test-scheduled

# Deploy to Cloudflare
wrangler deploy
```

### 6단계: 전체 QA 실행

```bash
npm run qa
```

## API Secret 생성 방법

```bash
# OpenSSL
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Railway 변수 설정 시 자동 생성도 가능
railway variables set API_SECRET=$(openssl rand -hex 32)
```

## 트러블슈팅

### 1. Proxy Server 500 에러
```bash
# Railway 로그 확인
railway logs

# google-ads-node 버전 확인
npm list google-ads-node
```

### 2. Worker 401/403 에러
- API_SECRET 일치 확인
- CORS 설정 확인

### 3. Google Ads API 에러
- Developer token 유효성 확인
- Customer ID 형식 확인
- OAuth credentials 확인

## 검증 체크리스트

배포 후 다음을 확인:
- [ ] Railway health check 통과
- [ ] Worker가 proxy server에 연결 성공
- [ ] Google Ads API가 실제 데이터 반환
- [ ] D1에 데이터 저장 성공
- [ ] CSV/XLSX export 성공
- [ ] QA 통과

## 참조 문서
- 전체 배포 가이드: `docs/deployment-railway.md`
- Google Ads API: `docs/references/google-ads-historical-metrics.md`
- QA 계획: `docs/qa-plan.md`
