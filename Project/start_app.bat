@echo off
chcp 65001 > nul
echo 🚀 프로젝트 서버를 동시에 실행합니다...

echo ⚙️ 백엔드(FastAPI) 서버를 시작합니다...
start "Backend Server" cmd /k "cd backend && call .\venv\Scripts\activate && uvicorn main:app --reload"

echo 🖥️ 프론트엔드(React/Vite) 서버를 시작합니다...
start "Frontend Server" cmd /k "cd Project && npm run dev"

echo ✅ 실행 완료! 두 개의 검은 창이 열렸습니다. (창을 끄면 서버가 종료됩니다)