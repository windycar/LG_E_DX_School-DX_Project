# MOMent - 임산부 맞춤 케어 DX 프로젝트

MOMent는 임산부와 보호자가 함께 사용하는 임신 케어 웹앱입니다. 임산부의 오늘 상태, 일기, 감정, 날씨, 온습도, 커뮤니티 데이터를 기반으로 맞춤 추천과 보호자 미션, 가전 제어 추천, 신뢰 임신 정보, 관리자용 데이터 분석 화면을 제공합니다.

## 프로젝트 한줄 설명

임산부의 일상 데이터를 모아 AI 추천, 보호자 미션, 가전 제어, 커뮤니티 분석까지 연결한 DX School 최종 프로젝트입니다.

## 주요 기능

- 회원가입/로그인: 임산부와 보호자 계정을 분리하고 연결코드로 가족을 연결합니다.
- 오늘의 상태체크: 임산부가 현재 기분과 증상을 입력하면 보호자에게 맞춤 미션이 생성됩니다.
- 일기/감정 분석: 일기 내용, 감정, 스트레스, 날씨, 온습도 데이터를 저장하고 AI 분석 및 가전 추천에 활용합니다.
- AI 맞춤 추천: 임신 주차별 추천 식품, 권장 활동, 주의사항, 스트레칭 영상을 제공합니다.
- 신뢰 정보: 영양, 운동, 정신건강, 태아발달, 수면 정보를 공신력 있는 자료 중심으로 보여줍니다.
- 커뮤니티: 임신 시기별 게시글과 댓글을 통해 사용자 경험 데이터를 모읍니다.
- 스몰토크: 부부가 하루 질문에 답하고 서로의 상태를 확인할 수 있습니다.
- 공유 캘린더: 임산부와 보호자가 병원 일정과 주요 일정을 함께 관리합니다.
- 가전 제어 추천: 온도, 습도, 감정 데이터를 기반으로 에어컨, 가습기, 제습기, 공기청정기, 무드등 설정을 추천합니다.
- 관리자 화면: admin 계정에서 회원, 커뮤니티, 댓글, 오늘 접속자, 평균 온습도, 평균 가전 설정, Kiwi 워드클라우드 분석을 확인합니다.
- PWA 배포: Vercel 배포 후 휴대폰 홈 화면에 앱처럼 설치해 시연할 수 있습니다.

## 기술 스택

- Frontend: React, Vite, TypeScript, Tailwind CSS, lucide-react, Recharts
- Backend: FastAPI, SQLAlchemy, PyMySQL, Pydantic
- Database: MySQL
- AI/Data: 일기 감정 분석, Kiwi 형태소 분석, 커뮤니티 워드클라우드
- Deploy: Vercel(frontend), Render(backend, AI chat)
- Device Demo: Arduino UNO, ULN2003, DC 모터, RGB LED, 가습기 모듈, I2C LCD

## 로컬 실행 방법

### 백엔드 실행

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

로컬 실행은 `backend/database.py`의 기본 MySQL 접속값을 사용하므로 `backend/.env`가 없어도 됩니다. 접속정보를 바꿀 때만 아래 값을 작성합니다.

```env
DB_USERNAME=아이디
DB_PASSWORD=비밀번호
DB_HOST=호스트
DB_PORT=포트
DB_NAME=DB명
BACKEND_ALLOWED_ORIGINS=http://localhost:5173
API_PUBLIC_BASE_URL=http://localhost:8000
WEATHER_API_KEY=나중에_입력
OPENAI_API_KEY=나중에_입력
```

### 프론트엔드 실행

```bash
cd Project
npm install
npm run dev
```

프론트는 로컬 API 주소를 기본값으로 가지고 있으므로 `Project/.env`가 없어도 됩니다. 주소를 바꿀 때만 작성합니다.

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_AI_CHAT_URL=http://localhost:8100
```

### 빌드 확인

```bash
cd Project
npm run build
```

## 배포 방법

### Render 백엔드

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment Variables: `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `BACKEND_ALLOWED_ORIGINS`, `API_PUBLIC_BASE_URL`, 필요한 API 키

### Vercel 프론트엔드

- Framework Preset: `Vite`
- Root Directory: `Project`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Environment Variables: `VITE_API_BASE_URL`, `VITE_AI_CHAT_URL`

## 관리자 계정 사용법

DB의 `USERS` 테이블에서 다음 중 하나를 만족하면 관리자 화면으로 진입합니다.

- `role` 값이 `ADMIN`
- `email` 값이 `admin`
- `name` 값이 `admin`

관리자 화면에서는 회원 대리접속, 회원 삭제, 커뮤니티 게시글/댓글 삭제, 커뮤니티 텍스트 분석, 평균 온습도와 평균 가전 설정 확인이 가능합니다.

## 커뮤니티 분석 사용법

관리자 화면의 `커뮤니티 분석` 탭에서 사용합니다.

1. 불용어 입력칸에 제외할 단어를 하나씩 입력합니다.
2. `추가` 버튼 또는 Enter로 불용어를 등록합니다.
3. `커뮤니티 전체 Kiwi 분석 실행` 버튼을 누릅니다.
4. 게시글과 댓글 전체를 형태소 분석한 결과가 워드클라우드와 키워드 분포로 표시됩니다.

`kiwipiepy`가 설치되어 있으면 Kiwi 형태소 분석을 사용하고, 설치 실패 시 기본 정규식 토큰화로 대체됩니다.

## 개발 일지

- 감정분석 초기 버전: 일기 텍스트를 기반으로 감정 분석 구조를 만들었습니다.
- 보호자 로그인 연동: 보호자 계정에서 연결된 임산부 정보와 주차를 볼 수 있게 했습니다.
- 스몰토크 기능 추가: 부부가 같은 질문에 답하고 서로의 답변을 확인하는 기능을 추가했습니다.
- 커뮤니티 기능 추가: 게시글 작성, 댓글, 본인 글 삭제 기능을 넣었습니다.
- 임신 주차 동기화: 커뮤니티와 추천 화면에서 임신 초기/중기/말기 태그가 맞도록 수정했습니다.
- 캘린더 연동: 임산부와 보호자가 병원 일정과 공유 일정을 함께 확인하도록 만들었습니다.
- 다이어리 데이터 확장: 감정, 온습도, 날씨 API 데이터를 일기에 함께 저장했습니다.
- 가전 제어 DB 연동: 추천된 가전 설정을 DB에 저장하고 오늘 상태체크와 연결했습니다.
- AI 추천 기능 추가: 임신 주차별 식품, 활동, 주의사항, 스트레칭 추천을 분리했습니다.
- 배포 세팅: 로컬 전용 구조를 Vercel/Render 배포 구조로 정리했습니다.
- 앱 시연 준비: PWA 설정을 추가해 휴대폰에서 앱처럼 설치할 수 있게 했습니다.
- 관리자 기능 추가: admin 계정 전용으로 회원, 커뮤니티, 분석 데이터를 확인하는 화면을 추가했습니다.
- 커뮤니티 분석 추가: Kiwi 형태소 분석과 불용어 처리, 워드클라우드, 평균 온습도/가전 설정 지표를 추가했습니다.

## 시연 흐름

1. 임산부 계정으로 로그인합니다.
2. 오늘의 상태체크를 입력합니다.
3. 보호자 계정에서 미션이 생성되는 것을 확인합니다.
4. 일기를 작성하고 감정/온습도 데이터가 누적되는 것을 보여줍니다.
5. AI 맞춤 추천에서 주차별 추천 정보를 확인합니다.
6. 가전 제어 화면에서 추천 설정을 확인하고 Arduino 시연 장치로 연결합니다.
7. 관리자 계정으로 접속해 회원, 커뮤니티, 커뮤니티 분석 워드클라우드를 보여줍니다.

## 개발 메모

- 현재 오늘 접속자는 별도 로그인 로그 테이블이 없어서 게시글, 댓글, 일기, 스몰토크, 상태체크를 남긴 오늘 활동자 기준입니다.
- 실제 로그인 접속자 수가 필요하면 `LOGIN_LOGS` 테이블을 추가하는 것이 맞습니다.
- 챗봇은 API 키를 환경변수에 넣으면 LangChain 또는 OpenAI API 기반 생성형 응답으로 확장할 수 있게 준비하는 방향입니다.
- Arduino 가전 제어는 `arduino/final/final.ino`와 `아두이노_가전제어_연동가이드.md`를 최종 기준으로 사용합니다.

## 최종 파일 기준

- 프론트엔드: `Project`
- 백엔드: `backend`
- Arduino 최종 스케치: `arduino/final/final.ino`
- Arduino 배선 및 실행 가이드: `아두이노_가전제어_연동가이드.md`
- 커뮤니티 시연 데이터: `tools/seed_demo_community.sql`
- 스몰토크 시연 데이터: `tools/seed_demo_smalltalk_20260612_20260625.sql`
- 데이터베이스 구조: `ERD.png`, `데이터베이스_요구사항_분석서.md`
