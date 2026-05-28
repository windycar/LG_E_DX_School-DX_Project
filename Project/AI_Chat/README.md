# AI_Chat

임산부용 `신뢰 정보 > 의학 정보 AI 상담` 화면에서 사용하는 LangChain 기반 챗봇 백엔드입니다.

## Structure

- `index.js`: Express API, 안전 분기, 공식 자료 검색, OpenAI 답변 생성
- `trusted-knowledge.json`: 공식 자료 기반 지식 문서와 출처 URL
- `SOURCE_VALIDATION.md`: 출처 검증 기준과 운영 전 확인 항목
- `.env.example`: OpenAI API 키와 모델 설정 예시
- `scenario-test.js`: 응급/주의/일반 질문 응답 시나리오 테스트

## Run From Project Root

이제 `Project` 폴더에서 한 번만 실행하면 Vite 프론트와 AI_Chat 백엔드가 같이 실행됩니다.

```powershell
cd Project
npm.cmd install
npm.cmd run dev
```

첫 실행에서 `AI_Chat/node_modules`가 없으면 루트 dev 스크립트가 `AI_Chat` 안에서 `npm install`을 자동으로 실행합니다.

## Enable OpenAI Answers

```powershell
cd Project\AI_Chat
Copy-Item .env.example .env
```

그 다음 `Project\AI_Chat\.env`에 본인 키를 넣습니다. `.env`는 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다.

```env
OPENAI_API_KEY=your_openai_api_key_here
ENABLE_AI_GENERATION=true
```

API 키가 없거나 `ENABLE_AI_GENERATION=false`이면 챗봇은 안전 분기와 `trusted-knowledge.json`의 공식 자료 기반 기본 답변만 사용합니다. API 키를 넣으면 검색된 공식 자료를 근거로 OpenAI 모델이 더 자연스러운 답변을 생성합니다.

## API

- `GET /api/health`: 서버 상태, 모델 설정, 검색 설정 확인
- `POST /api/chat`: `{ "message": "...", "history": [] }` 형식의 상담 요청 처리

## Supported Topics

- 인사와 사용 안내
- 복통, 진통, 출혈, 양수 의심, 태동 감소 같은 안전 분기
- 모호한 증상에 대한 확인 질문
- 임신성 당뇨 검사, 입덧, 조산, 산후 우울 등 기존 공식 자료 질문
- 엽산, 철분, 칼슘, 비타민 D, 비타민 C, 요오드, 비타민 B6/B12 등 영양 질문
- 생선과 수은, 카페인, 술, 피해야 할 음식, 리스테리아 등 생활/식품 안전 질문
- 임신 중 권장 백신, 변비, 다리 쥐, 어지러움, 골반통, 허리통증 등 흔한 불편감 질문

## Test

```powershell
cd Project\AI_Chat
npm.cmd test
```

## Safety Policy

- 이 챗봇은 진단, 처방, 복용 결정, 응급 여부 확정을 하지 않습니다.
- 출혈, 양수 의심, 규칙적이고 심해지는 통증, 태동 감소, 심한 두통/시야 이상/숨참/가슴통증 같은 위험 신호는 모델 답변보다 안전 분기가 먼저 작동합니다.
- 질문이 모호하면 바로 위험하다고 단정하지 않고, 통증 여부, 반복 간격, 출혈/양수 여부, 태동 변화 같은 핵심 정보를 먼저 묻습니다.
- OpenAI 답변은 검색된 공식 자료 범위 안에서만 생성하도록 제한합니다.
- 실제 서비스 배포 전에는 의료진 또는 의료 콘텐츠 책임자의 문구 검토가 필요합니다.
