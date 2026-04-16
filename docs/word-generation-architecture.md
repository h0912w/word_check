# word-generation-architecture.md

## 1. 기능 정의
이 기능은 사용자가 요청할 때만 **Claude Code 세션 내에서** SaaS 제목용 영어 단어를 생성하고, 중복을 방지하며 20만개 규모로 빠르게 생성하는 **단어 생성 시스템**이다.

## 2. 설계 원칙
- **런타임 비LLM 유지**: 생산 런타임에서는 LLM API를 호출하지 않는다. 단어 생성은 Claude Code 세션에서만 수행한다.
- **비임시 저장**: 생성된 단어는 `input/generated/`에 영구 저장된다.
- **중복 방지**: 기존 단어와 비교하여 중복을 허용하지 않는다.
- **SaaS 제标题용**: SaaS 서비스 제목에 적합한 단어만 생성한다.
- **다중 에이전트 구조**: 여러 전문화된 에이전트가 병렬로 단어를 생성한다.
- **QA 에이전트**: 생성된 단어의 품질을 검증하는 별도 QA 에이전트를 운영한다.

## 3. 범위
### 포함
- Claude Code 세션 내 단어 생성
- SaaS 제목용 영어 단어 생성
- 중복 검증 및 제거
- 다중 에이전트 병렬 생성
- QA 에이전트 품질 검증
- 생성된 단어 input/ 경로에 저장

### 제외
- 런타임 LLM API 호출 구조
- 단어 의미 해석
- 동의어/파생어 자동 생성
- SEO 점수화

## 4. 시스템 구성요소
- Claude Code: 단어 생성 세션 실행 환경
- Word Generation Agents: 카테고리별 단어 생성 에이전트들
- Word Collector: 인터넷 실제 SaaS 단어 수집기
- QA Agent: 생성된 단어 품질 검증
- Deduplication Engine: 중복 단어 제거
- Input Storage: `input/generated/` 디렉터리

## 5. 인터넷 단어 수집 방법론

### 5.1 수집 원칙
- **실제 사용 단어**: 인터넷에서 실제 사용되는 SaaS 제품/서비스 이름 수집
- **다양성 확보**: 카테고리, 규모, 지역별 다양한 단어 수집
- **품질 우선**: 검증된 소스에서 고품질 단어 수집
- **저작권 준수**: 단어 자체는 저작권 대상 아님, 출처 명시

### 5.2 수집 대상 소스

#### 5.2.1 SaaS 마켓플레이스/디렉터리
- **G2**: g2.com/categories
- **Capterra**: capterra.com/categories
- **Software Advice**: softwareadvice.com
- **GetApp**: getapp.com/categories
- **TrustRadius**: trustradius.com

#### 5.2.2 실제 SaaS 제품/서비스
- **CRM**: Salesforce, HubSpot, Zoho, Pipedrive
- **Marketing**: Marketo, Pardot, Mailchimp, Constant Contact
- **Project Management**: Asana, Trello, Monday, Jira
- **Communication**: Slack, Teams, Zoom, Discord
- **Analytics**: Tableau, PowerBI, Google Analytics, Amplitude
- **Infrastructure**: AWS, Azure, GCP, Docker, Kubernetes
- **Payment**: Stripe, PayPal, Braintree, Square
- **E-commerce**: Shopify, WooCommerce, Magento, BigCommerce

#### 5.2.3 기술 용어/플랫폼
- **Cloud Platforms**: AWS, Azure, GCP, Heroku, DigitalOcean
- **DevOps**: GitHub, GitLab, Jenkins, CircleCI, Docker
- **Databases**: PostgreSQL, MongoDB, Redis, Elasticsearch
- **Frameworks**: React, Vue, Angular, Next.js, Nuxt.js
- **Languages**: JavaScript, TypeScript, Python, Go, Rust

#### 5.2.4 지역별 서비스 (한국)
- **플랫폼**: Naver, Kakao, Line, Daum, NHN
- **결제**: KakaoPay, NaverPay, SamsungPay, LGPay
- **커머스**: Coupang, TMON, Wemakeprice, 11Street
- **금융**: Toss, Bank Salad, KakaoBank, Hana Bank

### 5.3 수집 방법

#### 5.3.1 Claude Code 세션 내 수집
```
사용자 요청
→ WebSearch로 SaaS 관련 검색
→ 실제 제품/서비스 이름 추출
→ 카테고리별 분류
→ 중복 제거
→ QA 검증
→ 저장
```

#### 5.3.2 검색 키워드 전략
1. **카테고리별 검색**: "SaaS CRM platforms list 2026"
2. **디렉터리 검색**: "best [category] software g2 capterra"
3. **실제 제품 검색**: "[competitor] alternatives similar"
4. **기술 스택 검색**: "[technology] stack tools platforms"

#### 5.3.3 수집 프로세스
1. **검색**: WebSearch로 SaaS 관련 정보 검색
2. **추출**: 검색 결과에서 실제 제품/서비스 이름 추출
3. **정규화**: 소문자 변환, 공백/특수문자 제거
4. **분류**: 카테고리별 그룹핑
5. **검증**: 영어 단어 여부, SaaS 적합성 확인
6. **저장**: `input/generated/real_world_YYYY-MM-DD.txt`

### 5.4 수집 품질 기준

#### 5.4.1 단어 품질
- **실재성**: 실제 사용되는 단어
- **적합성**: SaaS 제목으로 사용 가능
- **유니크함**: 브랜드로서의 식별력
- **발음 가능성**: 입에 착 감기는 발음

#### 5.4.2 소스 신뢰성
- **공식 사이트**: 제품 공식 웹사이트
- **신뢰할 수 있는 디렉터리**: G2, Capterra 등
- **기술 문서**: 공식 문서, API 레퍼런스
- **커뮤니티**: GitHub, StackOverflow, Reddit

### 5.5 수집 결과 포맷

#### 5.5.1 파일 구조
```
input/generated/
├── real_world_YYYY-MM-DD.txt      # 실제 수집 단어
├── real_world_by_category.json    # 카테고리별 분류
├── collection_sources.json         # 수집 출처
└── collection_report.json          # 수집 리포트
```

#### 5.5.2 메타데이터
```json
{
  "word": "salesforce",
  "source": "https://www.salesforce.com",
  "category": "crm",
  "collected_at": "2026-04-16T10:00:00Z",
  "verified": true,
  "company": "Salesforce",
  "founded": 1999
}
```

### 5.6 수집 성과 지표
- **수집량**: 1회 세션당 5,000~10,000단어
- **품질**: QA 통과율 90% 이상
- **다양성**: 카테고리별 균형 있는 분포
- **신규성**: 기존 단어와 중복 10% 이하

## 5. 단어 생성 카테고리

### 5.1 SaaS 제标题용 카테고리
1. **비즈니스/운영**: analytics, dashboard, insights, metrics
2. **마케팅/성장**: growth, conversion, acquisition, retention
3. **프로덕트/개발**: platform, engine, framework, builder
4. **디자인/UX**: interface, experience, visual, creative
5. **데이터/AI**: intelligence, prediction, automation, smart
6. **커뮤니케이션**: messaging, collaboration, notification, chat
7. **보안/신뢰**: security, protection, verified, compliance
8. **파이낸스**: billing, payment, invoice, transaction
9. **HR/인사**: recruitment, onboarding, payroll, performance
10. **고객/지원**: support, helpdesk, ticket, satisfaction

### 5.2 단어 조합 패턴
1. **단일 명사**: analytics, dashboard, platform
2. **복합 명사**: workflow, workspace, marketplace
3. **동사+명사**: manage, track, optimize, analyze
4. **형용사+명사**: smart, intelligent, automated, cloud
5. **접두사/접미사**: auto-, self-, -ify, -ly

## 6. 다중 에이전트 구조

### 6.1 에이전트 유형
1. **Category Specialist Agent**: 특정 카테고리 전문 단어 생성
2. **Pattern Agent**: 단어 조합 패턴 기반 생성
3. **Variation Agent**: 기존 단어 변형 생성
4. **QA Agent**: 생성된 단어 품질 검증

### 6.2 에이전트 동작 방식
```
사용자 요청
→ Category Specialist Agents × 10 (카테고리별 병렬 생성)
→ Pattern Agent × 5 (패턴별 병렬 생성)
→ Variation Agent × 3 (변형별 병렬 생성)
→ Deduplication Engine (중복 제거)
→ QA Agent (품질 검증)
→ 최종 저장 (input/generated/)
```

## 7. 워크플로우

### 7.1 단어 생성 절차
1. **사용자 요청**: Claude Code 세션에서 단어 생성 요청
2. **카테고리 설정**: SaaS 제标题용 카테고리 선택
3. **병렬 생성**: 다중 에이전트가 동시에 단어 생성 시작
4. **중복 검증**: 기존 input/ 파일과 비교하여 중복 제거
5. **QA 검증**: 영어 단어 여부, SaaS 적합성 확인
6. **저장**: `input/generated/words_YYYY-MM-DD.txt`에 저장

### 7.2 중복 검증 로직 (생성 전 실시간 체크)

#### 7.2.1 실시간 중복 방지 원칙
- **생성 전 체크**: 단어 생성 즉시 기존 단어와 비교
- **전체 데이터베이스 비교**: 모든 input/ 파일과 input/generated/ 파일의 단어 확인
- **즉시 필터링**: 중복 단어는 생성 단계에서 제외

#### 7.2.2 중복 체크 프로세스
```
1. 전체 기존 단어 로드
   - input/*.txt
   - input/*.csv
   - input/generated/*.txt
   - input/generated/*_passed.txt

2. 단어 생성 시 즉시 체크
   if (생성할 단어 in 기존 단어 목록) {
       생성 스킵 (중복 방지)
   } else {
       단어 생성 및 목록에 추가
   }

3. 최종 저장 시 재검증
   - 생성된 전체 목록 vs 기존 단어 목록
   - 중복 제거 후 최종 저장
```

#### 7.2.3 중복 체크 성능 최적화
- **Set 데이터구조 사용**: O(1) 검색 시간
- **메모리 캐싱**: 기존 단어 목록을 메모리에 유지
- **증분 갱신**: 새로 생성된 단어를 즉시 Set에 추가

## 8. 데이터 구조

### 8.1 생성된 단어 파일 포맷
```
input/generated/
├── words_YYYY-MM-DD.txt           # 최종 생성된 단어
├── words_by_category_YYYY-MM-DD.json  # 카테고리별 단어
├── generation_report_YYYY-MM-DD.json  # 생성 리포트
└── qa_report_YYYY-MM-DD.json         # QA 리포트
```

### 8.2 단어 메타데이터
```json
{
  "word": "analytics",
  "category": "business",
  "pattern": "single_noun",
  "generated_by": "category_specialist_agent",
  "generated_at": "2026-04-16T10:00:00Z",
  "is_duplicate": false,
  "qa_passed": true,
  "qa_score": 0.95
}
```

## 9. QA 에이전트 규칙

### 9.1 검증 항목
1. **영어 단어 여부**: a-z, A-Z, 0-9, 하이픈(-)만 허용
2. **길이 제한**: 3-20자
3. **SaaS 적합성**: 상업적 용도로 적절한 단어
4. **중복 여부**: 기존 단어와 중복되지 않음
5. **스팸 필터링**: 부적절한 단어 제거

### 9.2 QA 점수 산정
- 영어 단어 여부: 30%
- SaaS 적합성: 25%
- 길이 적절성: 15%
- 중복 방지: 20%
- 스팸 필터링: 10%

### 9.3 통과 기준
- QA 점수 0.7 이상
- 모든 필수 항목 통과

## 10. 실행 명령어

### 10.1 Claude Code 세션 내 실행
```typescript
// Claude Code가 직접 실행하는 방식
await generateWords({
  count: 200000,
  categories: ['business', 'marketing', 'product', 'data'],
  outputPath: 'input/generated/words_2026-04-16.txt'
});
```

### 10.2 npm 스크립트 (준비용)
```json
{
  "scripts": {
    "generate-words": "tsx scripts/generate_words.ts",
    "qa-words": "tsx scripts/qa_words.ts"
  }
}
```

## 11. 성능 목표
- 20만개 단어 생성: Claude Code 세션 내 약 30-60분
- 중복 검증: 1만개 단어당 약 10초
- QA 검증: 1만개 단어당 약 5초

## 12. 상태 관리
- 생성 진행률: 실시간 로그 출력
- 완료된 카테고리: 진행 상황 표시
- 중복 제거 건수: 리포트에 기록
- QA 통과率: 최종 리포트에 포함

## 13. 오류 처리
- 에이전트 실패 시: 다른 에이전트로 대체
- 중복 과다 시: 추가 카테고리 생성
- QA 실패 시: 해당 단어만 제외하고 계속 진행

## 14. CLAUDE.md 업데이트 사항
```markdown
## 단어 생성 기능 (런타임 비LLM 예외)

### 목적
사용자가 Claude Code 세션에서 요청할 때만 SaaS 제标题용 영어 단어를 생성한다.

### 실행 조건
- Claude Code 세션 내에서만 실행
- 사용자의 명시적 요청이 있을 때만 작동
- 생산 런타임에서는 LLM API를 호출하지 않음

### 워크플로우
1. 사용자가 Claude Code에 단어 생성 요청
2. Claude Code가 다중 에이전트 구조로 단어 생성
3. 중복 검증 및 QA 수행
4. input/generated/에 최종 단어 저장

### QA
- 생성된 단어에 대한 QA는 별도 QA 에이전트가 수행
- 코드 변경 시: 전체 E2E QA
- 카테고리 추가 시: 경량 QA
```

## 15. 참조 관계
- 전체 구조: `architecture.md`
- 실행 환경 설정: `setup.md`
- QA 기준: `qa-plan.md`
- 단어 생성 스크립트: `scripts/generate_words.ts`
- QA 스크립트: `scripts/qa_words.ts`
