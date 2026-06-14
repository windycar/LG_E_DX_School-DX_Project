@echo off
chcp 65001 > nul
setlocal

set "ROOT=%~dp0"
set "VENV_PYTHON=%ROOT%backend\.venv\Scripts\python.exe"
set "ARDUINO_FQBN=arduino:avr:uno"
set "ARDUINO_SKETCH=%ROOT%arduino\final"

echo Starting MOMent local demo servers.
echo.
echo [1/6] Checking required programs and local environment files.
where node > nul 2> nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or is not in PATH.
  pause
  exit /b 1
)
where npm > nul 2> nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or is not in PATH.
  pause
  exit /b 1
)

if not exist "%ROOT%backend\.env" (
  echo [ERROR] backend\.env is missing.
  echo Copy backend\.env.example to backend\.env and enter the real MySQL password.
  pause
  exit /b 1
)
if not exist "%ROOT%Project\.env" (
  copy /Y "%ROOT%Project\.env.example" "%ROOT%Project\.env" > nul
  echo Created Project\.env from Project\.env.example.
)

echo.
echo [2/6] Releasing local demo ports and Arduino serial port holders.
echo Closing Arduino IDE if it is using the board serial port.
taskkill /F /T /IM "Arduino IDE.exe" > nul 2> nul
taskkill /F /T /IM "arduino-ide.exe" > nul 2> nul

echo Closing existing backend processes on port 8000.
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%P > nul 2> nul
)

echo Waiting for Windows to release the serial port.
timeout /t 2 /nobreak > nul

echo.
echo [3/6] Preparing a local Python virtual environment.
if not exist "%VENV_PYTHON%" (
  where py > nul 2> nul
  if not errorlevel 1 (
    py -3 -m venv "%ROOT%backend\.venv"
  ) else (
    where python > nul 2> nul
    if errorlevel 1 (
      echo [ERROR] Python 3 is not installed or is not in PATH.
      pause
      exit /b 1
    )
    python -m venv "%ROOT%backend\.venv"
  )
)
if not exist "%VENV_PYTHON%" (
  echo [ERROR] Failed to create backend\.venv.
  pause
  exit /b 1
)

cd /d "%ROOT%backend"
"%VENV_PYTHON%" -m pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo [ERROR] Backend package install failed.
  echo Python path: %VENV_PYTHON%
  pause
  exit /b 1
)

echo.
echo [4/6] Installing frontend packages when needed.
cd /d "%ROOT%Project"
if not exist "%ROOT%Project\node_modules" (
  call npm install
  if errorlevel 1 (
    echo [ERROR] Frontend package install failed.
    pause
    exit /b 1
  )
)

echo.
echo [5/6] Checking the final Arduino sketch.
where arduino-cli > nul 2> nul
if errorlevel 1 (
  echo arduino-cli was not found. Skipping the compile check.
  echo Upload this final sketch once from Arduino IDE:
  echo %ARDUINO_SKETCH%\final.ino
) else (
  echo Board: %ARDUINO_FQBN%
  arduino-cli compile --fqbn %ARDUINO_FQBN% "%ARDUINO_SKETCH%"
  if errorlevel 1 (
    echo [WARN] Final Arduino sketch compile failed. Continuing without upload.
  ) else (
    echo Final Arduino sketch compile succeeded.
    echo Upload is intentionally manual because the COM port can change.
  )
)

echo.
echo [6/6] Starting FastAPI backend and React frontend.
start "MOMent Backend API" cmd /k "cd /d ""%ROOT%backend"" && ""%VENV_PYTHON%"" -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo.
echo Starting React frontend and local AI Chat server.
cd /d "%ROOT%Project"
start "MOMent Frontend + AI Chat" cmd /k "npm run dev -- --host 127.0.0.1"

echo.
echo Done.
echo Use the Vite Local URL shown in the frontend terminal, for example http://localhost:5173 or http://localhost:5174
echo Backend Arduino status URL: http://127.0.0.1:8000/api/appliances/arduino/status
echo.
pause
