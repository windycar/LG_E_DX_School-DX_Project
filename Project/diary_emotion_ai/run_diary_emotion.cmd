@echo off
chcp 65001 >nul
setlocal
set "APP_DIR=%~dp0"
set "PREDICT_SCRIPT=%APP_DIR%scripts\03_predict_diary_emotion.ps1"

if not exist "%PREDICT_SCRIPT%" (
  echo Prediction script was not found.
  pause
  exit /b 1
)

echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%PREDICT_SCRIPT%" -Loop
