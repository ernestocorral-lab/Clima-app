@echo off
setlocal
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-dev-environment.ps1"
if errorlevel 1 (
  echo.
  echo La configuracion fallo. Lee los mensajes de arriba.
  pause
  exit /b 1
)
echo.
pause
