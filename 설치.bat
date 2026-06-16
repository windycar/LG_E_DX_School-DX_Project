@echo off
chcp 65001 > nul
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%Project"
set "AI_CHAT_DIR=%ROOT%Project\AI_Chat"
set "VENV_DIR=%BACKEND_DIR%\venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"

echo ========================================
echo MOMent first-time installer
echo ========================================
echo Root: %ROOT%
echo.

where python > nul 2> nul
if errorlevel 1 (
  where py > nul 2> nul
  if errorlevel 1 (
    echo [ERROR] Python is not installed or not added to PATH.
    echo Install Python first, then run this file again.
    pause
    exit /b 1
  )
)

where node > nul 2> nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not added to PATH.
  echo Install Node.js first, then run this file again.
  pause
  exit /b 1
)

where npm > nul 2> nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not added to PATH.
  echo Reinstall Node.js with npm included, then run this file again.
  pause
  exit /b 1
)

echo [1/6] Preparing backend Python virtual environment.
if not exist "%VENV_PYTHON%" (
  python -m venv "%VENV_DIR%" 2> nul
  if errorlevel 1 (
    py -3 -m venv "%VENV_DIR%"
  )
)

if not exist "%VENV_PYTHON%" (
  echo [ERROR] Failed to create backend virtual environment.
  pause
  exit /b 1
)

echo [2/6] Installing backend Python packages.
"%VENV_PYTHON%" -m pip install --upgrade pip
if errorlevel 1 goto install_failed

"%VENV_PYTHON%" -m pip install -r "%BACKEND_DIR%\requirements.txt"
if errorlevel 1 goto install_failed

if exist "%BACKEND_DIR%\diary_emotion_ai\requirements.txt" (
  "%VENV_PYTHON%" -m pip install -r "%BACKEND_DIR%\diary_emotion_ai\requirements.txt"
  if errorlevel 1 goto install_failed
)

echo [3/6] Preparing backend environment file.
if not exist "%BACKEND_DIR%\.env" (
  if exist "%BACKEND_DIR%\.env.example" (
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" > nul
    echo Created backend\.env from backend\.env.example.
  )
)

echo [4/6] Installing frontend npm packages.
cd /d "%FRONTEND_DIR%"
if exist "package-lock.json" (
  npm ci
) else (
  npm install
)
if errorlevel 1 goto install_failed

echo [5/6] Installing AI Chat npm packages.
cd /d "%AI_CHAT_DIR%"
if exist "package-lock.json" (
  npm ci
) else (
  npm install
)
if errorlevel 1 goto install_failed

echo [6/6] Preparing AI Chat environment file.
if not exist "%AI_CHAT_DIR%\.env" (
  if exist "%AI_CHAT_DIR%\.env.example" (
    copy "%AI_CHAT_DIR%\.env.example" "%AI_CHAT_DIR%\.env" > nul
    echo Created Project\AI_Chat\.env from Project\AI_Chat\.env.example.
  )
)

cd /d "%ROOT%"
echo.
echo ========================================
echo Installation complete.
echo ========================================
echo Next step:
echo   1. Put real keys in backend\.env and Project\AI_Chat\.env if needed.
echo   2. Run start_app.bat.
echo.
pause
exit /b 0

:install_failed
cd /d "%ROOT%"
echo.
echo [ERROR] Installation failed. Check the error message above.
pause
exit /b 1
