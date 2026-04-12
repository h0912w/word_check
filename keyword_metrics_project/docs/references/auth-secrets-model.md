# auth-secrets-model.md

## 목적
외부 서비스 인증 및 secrets 저장 원칙을 고정한다.

## 필요한 secrets 범주
- Google Ads credentials
- Google Drive credentials
- Google Sheets credentials
- Cloudflare bindings/environment values

## 저장 위치
- 로컬: `.env.local`
- 배포: Cloudflare Worker secrets

## 저장소에 절대 커밋 금지
- 실제 토큰
- 실제 client secret
- 실제 refresh token
- 실제 서비스 계정 비밀값

## `.env.example`에는 placeholder만 둔다
- key 이름은 실제와 일치
- 값은 비어 있거나 예시 문자열

## self-check 원칙
bootstrap 또는 preflight에서 필수 secret 누락을 감지해야 한다.
