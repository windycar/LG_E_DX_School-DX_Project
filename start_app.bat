@echo off
chcp 65001 > nul
setlocal

set "ROOT=%~dp0"
set "PYTHON_EXE=%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe"
set "FRONTEND_URL=http://127.0.0.1:5173"

if not exist "%PYTHON_EXE%" (
  if exist "%ROOT%backend\venv\Scripts\python.exe" (
    set "PYTHON_EXE=%ROOT%backend\venv\Scripts\python.exe"
  ) else (
    set "PYTHON_EXE=python"
  )
)

echo ========================================
echo MOMent local demo startup
echo ========================================
echo Python: %PYTHON_EXE%
echo Frontend: %FRONTEND_URL%
echo.

if not exist "%ROOT%Project\node_modules\vite\bin\vite.js" (
  echo [ERROR] Project\node_modules is missing.
  echo Run npm install once in the Project folder.
  pause
  exit /b 1
)

echo [1/3] Closing existing local servers.
for %%P in (8000 5173) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%I > nul 2> nul
  )
)
taskkill /F /T /IM "Arduino IDE.exe" > nul 2> nul
taskkill /F /T /IM "arduino-ide.exe" > nul 2> nul
timeout /t 1 /nobreak > nul

echo [2/3] Starting FastAPI backend.
start "MOMent Backend API" cmd /k "cd /d ""%ROOT%backend"" && ""%PYTHON_EXE%"" -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [3/3] Starting React frontend and AI Chat.
start "MOMent Frontend + AI Chat" cmd /k "cd /d ""%ROOT%Project"" && npm run dev"

echo.
echo Waiting for the frontend server...
timeout /t 5 /nobreak > nul
start "" "%FRONTEND_URL%"

echo.
echo Open this address:
echo %FRONTEND_URL%
echo Backend:
echo http://127.0.0.1:8000
echo.
pause
