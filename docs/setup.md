# 로컬 실행 환경 설정

## 개요
이 프로젝트는 로컬 PC에서 Node.js 스크립트로 실행됩니다. 배포 불필요, `npm run` 명령어로 즉시 실행 가능합니다.

## 사전 요구사항

### 필수
- **Node.js** v18 이상
- **npm** (Node.js 설치 시 포함)

### 선택사항
- **Git** (버전관리용)

## 1단계: 저장소 Clone 또는 다운로드

```bash
git clone <repository-url>
cd Word_check
```

또는 ZIP 다운로드 후 압축 해제.

## 2단계: 의존성 설치

```bash
npm install
```

## 3단계: 환경변수 설정

### 3.1 .env.local 파일 생성

```bash
cp .env.example .env.local
```

### 3.2 필수 환경변수 설정

.env.local 파일을 열고 다음을 채웁니다:

```bash
# Google Ads API (필수)
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_LOGIN_CUSTOMER_ID=9876543210  # 선택사항

# Google OAuth (필수)
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token

# Google Drive (필수)
GOOGLE_DRIVE_EXPORT_FOLDER_ID=your-export-folder-id
GOOGLE_DRIVE_INPUT_FOLDER_ID=your-input-folder-id  # 선택사항

# Google Sheets (필수)
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# 실행 설정 (선택사항)
BATCH_SIZE=10
MAX_RETRY_COUNT=3
```

### 3.3 Google Ads credentials 얻기

1. **Google Ads 계정**: https://ads.google.com/
2. **Developer Token**: Google Ads API Center에서 신청
3. **OAuth 2.0 credentials**: Google Cloud Console에서 생성
4. **Customer ID**: Google Ads 계정의 고객 ID

### 3.4 테스트 모드 사용 (API 승인 대기 중인 경우)

Google Ads API 승인이 아직 완료되지 않은 경우, **테스트 모드(Mock API)**를 사용할 수 있습니다.

#### 테스트 모드 활성화 방법

`.env.local` 파일에 다음 설정을 추가합니다:

```bash
# 테스트 모드 활성화
USE_MOCK_API=true
```

#### 테스트 모드 특징

- 실제 Google Ads API를 호출하지 않습니다
- 미리 정의된 가짜 데이터를 반환합니다
- API 키/승인 없이 전체 파이프라인을 테스트할 수 있습니다
- 반환되는 데이터는 무작위로 생성됩니다:
  - avg_monthly_searches: 1000~100000 사이 값
  - competition: LOW, MEDIUM, HIGH
  - competition_index: 10, 50, 90

#### 테스트 모드 실행

```bash
# 테스트 모드로 메트릭 수집
npm run collect-metrics

# 전체 파이프라인 실행 (테스트 모드)
npm run run-all
```

#### 실제 API 전환

API 승인이 완료되면 `.env.local`에서 다음 설정을 변경합니다:

```bash
# 실제 API 사용
USE_MOCK_API=false
```

그리고 실제 Google Ads credentials를 설정합니다:

```bash
GOOGLE_ADS_DEVELOPER_TOKEN=your-approved-developer-token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_CLIENT_ID=your-oauth-client-id
GOOGLE_ADS_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token
```

### 3.5 실제 테스트 계정 사용 (TEST Developer Token)

**Mock API 대신 실제 Google Ads 테스트 계정을 사용하는 방법입니다.**

TEST 상태 Developer Token으로도 **테스트 계정**에서는 실제 API를 호출할 수 있습니다.

#### 테스트 계정 권한 설정

테스트 계정이 접근 가능한 계정 목록에 없으면(403 권한 오류), 다음 단계로 권한을 설정합니다:

**단계 1: Google Ads 테스트 계정 접속**
```
https://ads.google.com/
```
테스트 계정(예: 890-341-2348)으로 로그인

**단계 2: 사용자 권한 추가**
1. 왼쪽 메뉴에서 **도구 및 설정** (톱니바퀴 아이콘) 클릭
2. **액세스 및 보안** > **사용자 관리** 또는 **계정 액세스**
3. **사용자 추가** 또는 **초대** 버튼 클릭

**단계 3: OAuth 계정 이메일 추가**
1. refresh token을 발급받은 Google 이메일 주소 입력
2. 적절한 권한 수준 선택 (권장: **표준 액세스** 이상)
3. **초대 보내기** 클릭

**단계 4: 초대 수락**
1. OAuth 계정 이메일로 전송된 초대 메일 열기
2. **수락** 버튼 클릭

**단계 5: 권한 확인**
```bash
# 접근 가능한 계정 목록 확인
curl -X GET "https://googleads.googleapis.com/v23/customers:listAccessibleCustomers" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "developer-token: YOUR_DEVELOPER_TOKEN"
```

테스트 계정 ID가 목록에 표시되어야 합니다.

#### 테스트 계정 설정

`.env.local` 파일에 테스트 계정 Customer ID를 설정합니다 (하이픈 제거):

```bash
# 테스트 계정 (현재 활성 - TEST Developer Token용)
GOOGLE_ADS_CUSTOMER_ID=8903412348

# 프로덕션 계정 (승인 후 사용을 위해 보관)
GOOGLE_ADS_CUSTOMER_ID_PRODUCTION=5398905405
```

#### 테스트 계정 실행

```bash
# 전체 파이프라인 테스트
npm run init-db
npm run prepare-input -- --input input/words.txt
npm run build-shards
npm run collect-metrics
npm run export
```

#### 승인 완료 후 전환

Developer Token이 APPROVED 상태로 변경되면:

```bash
# 프로덕션 계정으로 전환
GOOGLE_ADS_CUSTOMER_ID=5398905405  # 프로덕션 계정 ID
GOOGLE_ADS_CUSTOMER_ID_PRODUCTION=8903412348  # 테스트 계정 백업
```

---

**주의사항:**
- 테스트 계정은 Manager Account 내에서 생성하거나 추가해야 합니다
- 권한 설정 후 즉시 반영되지 않을 수 있으니 몇 분 후 다시 시도하세요
- 403 "The caller does not have permission" 오류가 계속되면 권한을 다시 확인하세요

## 4단계: 데이터베이스 초기화

```bash
npm run init-db
```

SQLite DB가 `data/word-check.db`로 생성됩니다.

## 5단계: 실행 명령어

### 5.1 개별 실행

```bash
# Google Ads 데이터 수집
npm run collect-metrics

# CSV/XLSX 내보내기
npm run export

# Google Drive/Sheets 배포
npm run publish

# QA 실행
npm run qa
```

### 5.2 전체 파이프라인 실행

```bash
npm run run-all
```

### 5.3 주기 실행 (선택사항)

```bash
# node-cron으로 매시간 실행
npm run schedule
```

## 6단계: 확인

### 6.1 Health Check

```bash
npm run health
```

### 6.2 데이터 확인

- **DB**: `data/word-check.db`
- **Shards**: `output/shards/*.txt`
- **Exports**: `output/exports/*.csv`, `output/exports/*.xlsx`
- **Logs**: `logs/`

## 트러블슈팅

### 1. "Cannot find module" 에러
```bash
npm install
```

### 2. "Google Ads API error"
- Developer token 확인
- Customer ID 형식 확인 (하이픈 제거)
- OAuth credentials 확인

### 3. "Database locked"
- 다른 프로세스가 DB 사용 중인지 확인
- `data/word-check.db` 삭제 후 `npm run init-db` 재실행

### 4. "Google Drive API error"
- OAuth token 갱신 필요
- Folder ID 확인

## 디렉토리 구조

```
Word_check/
├── data/               # SQLite DB 및 백업
├── input/              # 입력 파일
├── output/             # 출력 파일
│   ├── prepared/       # 정규화된 단어
│   ├── shards/         # 분할된 shard
│   ├── manifests/      # 메타데이터
│   ├── exports/        # CSV/XLSX
│   └── qa/             # QA 결과
├── logs/               # 실행 로그
├── config/             # DB 스키마
├── scripts/            # 실행 스크립트
├── src/                # 소스 코드
├── docs/               # 문서
└── .env.local          # 환경변수 (git에 포함 안 됨)
```

## 참조

- 전체 구조: `architecture.md`
- 운영 가이드: `operations.md`
- QA 가이드: `qa-plan.md`
