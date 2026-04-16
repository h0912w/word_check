# Google Cloud Run Deployment Guide

## 개요
Google Cloud Run에 프록시 서버를 배포하는 방법입니다.

## Cloud Run 무료 티어
- **월 200만 건 요청** 무료
- **180,000 vCPU-초** 무료 (컴퓨팅 시간)
- **1 GB 네트워크 수신** 무료
- **신용카드 불필요**
- **영원히 무료** (한도 내)

## 배포 절차

### 1단계: Google Cloud 프로젝트 생성

1. https://console.cloud.google.com/ 접속
2. **"프로젝트 만들기"** 클릭
3. 프로젝트 이름 입력 (예: `word-check-proxy`)
4. 조직 선택 (없으면 "조직 없음")
5. **"만들기"** 클릭

### 2단계: gcloud CLI 설치

#### Windows
```powershell
# PowerShell 관리자 권한으로 실행
winget install Google.CloudSDK

# 또는 다운로드
# https://cloud.google.com/sdk/docs/install
```

#### macOS/Linux
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### 3단계: Google Cloud 로그인

```bash
# 로그인 (브라우저 열림)
gcloud auth login

# 기본 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 프로젝트 ID는 Cloud Console의 대시보드에서 확인 가능
# 형식: word-check-proxy-123456
```

### 4단계: 필수 API 활성화

```bash
# Cloud Build (Docker 빌드용)
gcloud services enable cloudbuild.googleapis.com

# Cloud Run (서버less 호스팅)
gcloud services enable run.googleapis.com

# Artifact Registry (Docker 이미지 저장)
gcloud services enable artifactregistry.googleapis.com
```

### 5단계: 배포 스크립트 실행

#### Windows
```powershell
cd C:\Users\h0912\claude_project\Word_check
.\scripts\deploy-cloudrun.ps1
```

#### macOS/Linux
```bash
cd /path/to/Word_check
chmod +x scripts/deploy-cloudrun.sh
./scripts/deploy-cloudrun.sh
```

스크립트가 다음을 자동으로 수행합니다:
1. gcloud 로그인 확인
2. 프로젝트 설정
3. API 활성화
4. 환경변수 입력 (.env.local의 값들)
5. Docker 이미지 빌드
6. Cloud Run에 배포
7. 환경변수 설정

### 6단계: 배포 완료 후

배포가 완료되면 다음 URL이 표시됩니다:
```
https://word-check-proxy-XXXXX.a.run.app
```

### 7단계: .env.local 업데이트

```bash
# Cloud Run 서비스 URL
PROXY_SERVER_URL=https://word-check-proxy-XXXXX.a.run.app

# API_SECRET은 배포 시 입력한 값과 동일하게
PROXY_API_SECRET=your-api-secret-here
```

### 8단계: Worker 재배포

```bash
wrangler deploy
```

## 수동 배포 (스크립트 사용 안 할 경우)

### 1. Docker 이미지 빌드

```bash
# 프로젝트 ID 설정
export PROJECT_ID=your-project-id

# Docker 이미지 빌드
gcloud builds submit --config cloudbuild.yaml .
```

### 2. Cloud Run 서비스 배포

```bash
# 서비스 배포
gcloud run deploy word-check-proxy \
  --image=gcr.io/$PROJECT_ID/word-check-proxy:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=3001 \
  --memory=256Mi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0
```

### 3. 환경변수 설정

```bash
gcloud run services update word-check-proxy \
  --region=us-central1 \
  --set-env-vars="PORT=3001,NODE_ENV=production,GOOGLE_ADS_DEVELOPER_TOKEN=xxx,GOOGLE_ADS_CUSTOMER_ID=xxx,GOOGLE_ADS_CLIENT_ID=xxx,GOOGLE_ADS_CLIENT_SECRET=xxx,GOOGLE_ADS_REFRESH_TOKEN=xxx,API_SECRET=xxx,WORKER_DOMAIN=*.workers.dev,ALLOWED_ORIGINS=*.workers.dev"
```

## 배포 확인

### Health Check
```bash
# 서비스 URL 확인
gcloud run services describe word-check-proxy --region=us-central1 --format="value(status.url)"

# Health check 테스트
curl https://word-check-proxy-XXXXX.a.run.app/health
```

예상 응답:
```json
{
  "status": "ok",
  "service": "google-ads-server",
  "timestamp": "2026-04-13T..."
}
```

## 모니터링

### 로그 보기
```bash
# 실시간 로그
gcloud run services logs tail word-check-proxy --region=us-central1

# 최근 100줄
gcloud run services logs tail word-check-proxy --region=us-central1 --limit=100
```

### 메트릭 보기
```bash
gcloud run services describe word-check-proxy --region=us-central1
```

### Cloud Console
1. https://console.cloud.google.com/run
2. 프로젝트 선택
3. `word-check-proxy` 서비스 클릭
4. 로그, 메트릭, 설정 확인

## 트러블슈팅

### 1. "build failed" 에러
```bash
# Dockerfile 경로 확인
cat server/Dockerfile

# 수동 빌드 테스트
docker build -f server/Dockerfile -t test .
```

### 2. "permission denied" 에러
```bash
# 권한 확인
gcloud auth list

# IAM 권한 부여
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:your-email@gmail.com" \
  --role="roles/run.admin"
```

### 3. "service not found" 에러
```bash
# 서비스 목록 확인
gcloud run services list

# 리전 확인
gcloud config get-value run/region
```

### 4. 환경변수 적용 안 됨
```bash
# 환경변수 확인
gcloud run services describe word-check-proxy --region=us-central1 --format="value(spec.template.spec.containers[0].env)"

# 재설정
gcloud run services update word-check-proxy --region=us-central1 --update-env-vars="KEY=VALUE"
```

## 비용 모니터링

### 무료 한도 확인
```bash
# 현재 사용량
gcloud billing accounts list

# 상세 보고서
# https://console.cloud.google.com/billing
```

### 비용 알림 설정 (선택사항)
1. https://console.cloud.google.com/billing
2. 결제 계정 선택
3. "예산 및 알림" 설정
4. 월 $10 예산 알림 설정

## 보안 권장사항

1. **IAM 권한 최소화**: Cloud Run 관리자만 접근
2. **Secret Manager 사용**: 민감 정보를 Secret Manager에 저장
3. **VPC 연결**: 프라이빗 네트워크 사용 (선택사항)

## 재배포

### 코드 변경 후
```bash
# 자동 빌드 & 배포
gcloud builds submit --config cloudbuild.yaml .

# 또는 스크립트 재실행
.\scripts\deploy-cloudrun.ps1
```

## 삭제

```bash
# 서비스 삭제
gcloud run services delete word-check-proxy --region=us-central1

# 이미지 삭제
gcloud container images delete gcr.io/$PROJECT_ID/word-check-proxy:latest
```

## 참조

- Cloud Run 문서: https://cloud.google.com/run/docs
- Cloud Build 문서: https://cloud.google.com/build/docs
- 무료 한도: https://cloud.google.com/free/docs/free-cloud-features#cloud-run
