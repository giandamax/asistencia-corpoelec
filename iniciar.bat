@echo off
echo Iniciando Corpoelec Asistencia Digital...
cd /d "%~dp0"

:: Inicia el backend Python en una nueva ventana
start "Backend API - Puerto 8000" cmd /k "python server.py"

:: Espera 2 segundos para que el backend levante
timeout /t 2 /nobreak >nul

:: Inicia el frontend Vite en otra ventana
start "Frontend Vite - Puerto 5173" cmd /k "npm run dev"

echo.
echo Servidores iniciados. Abre tu navegador en:
echo   http://localhost:5173      (desde esta PC)
echo   http://192.168.0.183:5173  (desde otros dispositivos)
echo.
pause
