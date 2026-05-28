## 📅 2026.05.27 개발 일지 (Development Log)

### 🤝 주요 구현 내용: 회원가입/로그인 및 가족 연동 시스템 완료
기존 UI 디자인과 레이아웃을 100% 유지하면서, 백엔드 DB와 프론트엔드 상태 관리를 유기적으로 연결하여 실시간 가족(보호자-임산부) 데이터 연동을 마쳤습니다.

---

### 1. 🖥️ Frontend (React / TypeScript)
- **UI 및 데이터 전송 분리 최적화:** `RegisterView` 및 `LoginView` 디자인을 해치지 않고 백엔드 API 규격에 맞게 전송 데이터(Body) 매핑 구조 보강.
- **보호자 대시보드 동적 연동 (`DashboardView`):** 보호자로 로그인 시, 하드코딩된 가짜 데이터를 제거하고 DB에서 연동된 임산부의 실제 이름과 태명이 실시간 출력되도록 바인딩.
- **실시간 임신 주차 자동 계산:** 가짜 '28주차' 문구를 제거하고, DB의 임신 시작일(`pregnancy_start_date`)과 현재 날짜를 비교하여 주차를 자동으로 계산해 주는 `getPregnancyWeek` 알고리즘 반영.
- **TypeScript 무결성 확보:** 백엔드 연동 데이터(`user_id`, `parent_user_id`, `connected_pregnant`) 처리를 위해 `AppUser` 인터페이스 구조 확장 및 타입 단언(`as AppUser`)을 통한 컴파일 에러 해결.

### 2. ⚙️ Backend (FastAPI / SQLAlchemy)
- **고유 인증 코드(Connection Code) 보안:** 임산부 가입 시 중복 검사를 수행하는 `while` 루프 재시도 로직을 적용하여 고유한 6자리 대문자/숫자 랜덤 코드 생성 기능 구현.
- **보호자 연동 로직 구현:** 보호자 가입 시 입력한 인증 코드로 `USERS` 테이블을 조회하여 매칭되는 임산부의 고유 ID를 보호자의 `parent_user_id` 컬럼에 자동 매핑.
- **로그인 API 확장:** 로그인 성공 시 유저 정보뿐만 아니라 연동된 임산부 객체(`connected_pregnant`)까지 조인(Join)하여 원패스로 프론트엔드에 응답하도록 로직 고도화.

### 3. 🗄️ Database (MySQL)
- **테이블 스키마 확장:** 가족 연동을 위한 `parent_user_id (INT)` 컬럼 추가.
- **데이터 무결성 확보:** `connection_code` 컬럼에 `UNIQUE` 제약 조건 및 인덱스를 부여하여 데이터 중복 생성 원천 차단.

---

### 🚨 오늘 해결한 트러블슈팅 (Troubleshooting)

#### 1) `sqlalchemy.exc.IntegrityError: (1062, "Duplicate entry...")`
- **문제:** 테스트 도중 동일한 이메일/아이디로 중복 가입을 시도하여 DB 단에서 충돌 발생.
- **해결:** MySQL Workbench의 Safe Update Mode 우회 조건을 활용하여 `DELETE FROM USERS WHERE user_id > 0;` 스크립트로 테스트 데이터를 깔끔하게 리셋하고 `AUTO_INCREMENT`를 초기화하여 해결.

#### 2) `sqlalchemy.exc.OperationalError: (1054, "Unknown column 'USERS.id'")`
- **문제:** DB는 `user_id`라는 컬럼명을 사용하나, SQLAlchemy 모델은 기본값인 `id`를 찾아 매핑 실패.
- **해결:** `models.py`에서 `id = Column("user_id", ...)`와 같이 구문을 수정하여 파이썬 속성명(`id`)과 실제 DB 컬럼명(`user_id`)을 명시적으로 매핑하여 해결.

#### 3) `TypeError: 'parent_user_id' is an invalid keyword argument for User`
- **문제:** 백엔드에서 객체를 생성할 때 `parent_user_id` 속성을 주입했으나, `models.py`에 해당 컬럼 정의가 누락되어 발생.
- **해결:** `models.py`에 `parent_user_id = Column(Integer, nullable=True)` 컬럼을 정식 등록하고 MySQL에 `ALTER TABLE` 명령어로 컬럼을 동기화하여 해결.

#### 4) `plugin:vite:react-babel: Unexpected token / TypeScript 컴파일 에러`
- **문제:** 프론트엔드로 연동 데이터를 넘겨주는 과정에서 끝자리에 오타(`connected_pregnantD`)가 발생하고, 확장된 데이터 포맷을 TypeScript의 `AppUser` 인터페이스가 인지하지 못해 빌드가 차단됨.
- **해결:** 인터페이스에 새 필드들을 명시하고, 오타 수정 및 컴파일러 지연 현상을 방지하기 위해 `as AppUser` 타입 단언을 적용하여 빌드 에러 완벽 해결.

---

### 🚀 Next Steps (다음 개발 계획)
- [ ] 회원가입 시 비밀번호 평문 저장 방식에서 `passlib` / `bcrypt`를 활용한 암호화(Hashing) 도입
- [ ] 로그인 성공 시 `JWT(JSON Web Token)` 발급 및 프론트엔드 Axios/Fetch 인터셉터 연동
- [ ] 연동된 임산부-보호자 간 실시간 '오늘의 상태 체크(불편 증상)' 및 '감정 일기(정신 케어)' 데이터 공유 API 개발