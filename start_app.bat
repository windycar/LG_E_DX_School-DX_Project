@echo off
chcp 65001 > nul
echo 🚀 프로젝트의 모든 서버(FastAPI, AI Chat, React)를 실행합니다...

echo ⚙️ 1. 백엔드(FastAPI) 서버를 시작합니다...
start "Backend Server" cmd /k "cd backend & call venv\Scripts\activate & uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo 🤖 2. AI 채팅 API 서버를 시작합니다...
:: 기존에 index.js를 실행해주던 명령어입니다.
start "AI Chat Server" cmd /k "cd Project & npm run dev"

echo 🖥️ 3. 프론트엔드(React/Vite) 웹 화면을 시작합니다...
:: 채팅 서버와 겹치지 않게 강제로 Vite 웹 화면을 띄워주는 명령어입니다.
start "Frontend Server" cmd /k "cd Project & npx vite"

echo ✅ 3개의 서버 실행이 모두 완료되었습니다!