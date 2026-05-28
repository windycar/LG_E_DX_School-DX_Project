@echo off
chcp 65001 > nul
echo 🚀 프로젝트 서버를 동시에 실행합니다...

echo ⚙️ 백엔드(FastAPI) 서버를 시작합니다...
:: 🚀 팀원 컴퓨터에 venv가 없으면 자동으로 만들고 requirements.txt를 설치합니다!
start "Backend Server" cmd /k "cd backend && if not exist venv\Scripts\activate (echo 🛠️ 가상환경이 없어서 새로 생성 및 설치합니다... && python -m venv venv && call .\venv\Scripts\activate && pip install -r requirements.txt) else (call .\venv\Scripts\activate) && uvicorn main:app --reload"

echo 🖥️ 프론트엔드(React/Vite) 서버를 시작합니다...
:: 🚀 팀원 컴퓨터에 node_modules가 없으면 자동으로 npm install을 진행합니다!
start "Frontend Server" cmd /k "cd Project && if not exist node_modules (echo 🛠️ 프론트 패키지가 없어서 새로 설치합니다... && npm install) && npm run dev"

echo ✅ 실행 완료! (처음 실행하는 PC에서는 설치하느라 창에서 시간이 조금 걸릴 수 있습니다)