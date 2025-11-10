@echo off
REM Script simples para executar ambos os servidores - Windows
REM Redes Chat - Comando unico

REM Obter IP da maquina para rede do laboratorio
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do (
    for /f "tokens=1 delims= " %%j in ("%%i") do set IP_ADDRESS=%%j
)

if "%IP_ADDRESS%"=="" (
    set IP_ADDRESS=0.0.0.0
)

echo [INFO] Iniciando Chat Servers...
echo IP da maquina: %IP_ADDRESS%
echo Backend: http://%IP_ADDRESS%:5000
echo Frontend: http://%IP_ADDRESS%:3000
echo.

REM Verificar se Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js nao esta instalado.
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

REM Iniciar backend em background
echo [INFO] Starting Backend...
cd nodejs
start /b cmd /c "npm run dev > ..\backend.log 2>&1"

REM Aguardar backend iniciar
timeout /t 3 /nobreak >nul
cd ..

REM Iniciar frontend em background
echo [INFO] Starting Frontend...
cd chat_frontend
start /b cmd /c "npm run dev > ..\frontend.log 2>&1"

REM Aguardar frontend iniciar
timeout /t 5 /nobreak >nul
cd ..

echo.
echo [OK] Servers started!
echo Acesse de outros computadores na rede:
echo    Frontend: http://%IP_ADDRESS%:3000
echo    Backend:  http://%IP_ADDRESS%:5000
echo.
echo Press Ctrl+C ou feche esta janela para parar
echo.

REM Manter script rodando
pause >nul

REM Quando o usuario pressionar uma tecla, parar servidores
echo.
echo [INFO] Stopping servers...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
echo [OK] Servidores parados
pause >nul