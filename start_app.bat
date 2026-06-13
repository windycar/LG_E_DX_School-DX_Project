@echo off
chcp 65001 > nul
setlocal

set "ROOT=%~dp0"
set "PYTHON_EXE=%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe"
set "ARDUINO_FQBN=arduino:avr:uno"
set "ARDUINO_SKETCH=%ROOT%arduino\final"

if not exist "%PYTHON_EXE%" (
  set "PYTHON_EXE=python"
)

echo Starting MOMent local demo servers.
echo.
echo [1/5] Releasing local demo ports and Arduino serial port holders.
echo Closing Arduino IDE if it is using the board serial port.
taskkill /F /T /IM "Arduino IDE.exe" > nul 2> nul
taskkill /F /T /IM "arduino-ide.exe" > nul 2> nul

echo Closing existing backend processes on port 8000.
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%P > nul 2> nul
)

echo Closing stale Python/Uvicorn demo processes that may still hold the serial port.
taskkill /F /T /IM "uvicorn.exe" > nul 2> nul
taskkill /F /T /IM "python.exe" > nul 2> nul

echo Waiting for Windows to release the serial port.
timeout /t 2 /nobreak > nul

echo.
echo [2/5] Checking backend Python packages. pyserial is installed here too.
cd /d "%ROOT%backend"
"%PYTHON_EXE%" -m pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo [ERROR] Backend package install failed.
  echo Python path: %PYTHON_EXE%
  pause
  exit /b 1
)

"%PYTHON_EXE%" -m pip install pyserial
if errorlevel 1 (
  echo.
  echo [ERROR] pyserial install failed.
  echo Python path: %PYTHON_EXE%
  pause
  exit /b 1
)

echo.
echo [3/5] Checking the final Arduino sketch.
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
echo [4/5] Starting FastAPI backend. Arduino USB control runs through this server.
start "MOMent Backend API" cmd /k "cd /d ""%ROOT%backend"" && ""%PYTHON_EXE%"" -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo.
echo [5/5] Starting React frontend and local AI Chat server.
cd /d "%ROOT%Project"
start "MOMent Frontend + AI Chat" cmd /k "npm run dev -- --host 127.0.0.1"

echo.
echo Done.
echo Use the Vite Local URL shown in the frontend terminal, for example http://localhost:5173 or http://localhost:5174
echo Backend Arduino status URL: http://127.0.0.1:8000/api/appliances/arduino/status
echo.
pause
