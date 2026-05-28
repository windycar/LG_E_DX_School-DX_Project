@echo off
chcp 65001 > nul
echo 🚀 프로젝트 서버를 동시에 실행합니다...

echo ⚙️ 백엔드(FastAPI) 서버를 시작합니다...
:: 🚀 && 대신 & 사용, activate 앞에 call 추가로 안정성 200% 확보
start "Backend Server" cmd /k "cd backend & if not exist venv\Scripts\activate (echo 🛠️ 백엔드 세팅 중... & python -m venv venv & call .\venv\Scripts\activate & pip install -r requirements.txt) else (call .\venv\Scripts\activate) & uvicorn main:app --reload"

echo 🖥️ 프론트엔드(React/Vite) 서버를 시작합니다...
:: 🚀 npm install 앞에 call을 붙여서 설치 후 튕기는 현상 완벽 방지!
start "Frontend Server" cmd /k "cd Project & if not exist node_modules (echo 🛠️ 프론트 패키지 세팅 중... & call npm install) & npm run dev"

echo ✅ 실행 완료! (처음 실행하는 PC에서는 설치하느라 창에서 시간이 조금 걸릴 수 있습니다)