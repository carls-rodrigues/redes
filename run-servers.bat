@echo off
REM Script para executar ambos os servidores (Backend + Frontend) - Windows
REM Redes Chat - Execucao Simultanea

echo [INFO] Iniciando servidores do Chat...
echo ====================================

REM Obter IP da maquina para rede do laboratorio
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do (
    for /f "tokens=1 delims= " %%j in ("%%i") do set IP_ADDRESS=%%j
)

if "%IP_ADDRESS%"=="" (
    set IP_ADDRESS=0.0.0.0
)

echo [INFO] IP da maquina: %IP_ADDRESS%
echo.

REM Cores para output (Windows CMD)
set RED=[ERROR]
set GREEN=[OK]
set YELLOW=[WARN]

REM Verificar se Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED% Node.js nao esta instalado.
    echo    Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se npm esta instalado
npm --version >nul 2>&1
if errorlevel 1 (
    echo %RED% npm nao esta instalado.
    echo    Geralmente vem com Node.js
    pause
    exit /b 1
)

echo %GREEN% Node.js e npm encontrados
echo.

REM Verificar portas (simplificado para Windows)
netstat -an | findstr ":5000" >nul
if %errorlevel% equ 0 (
    echo %YELLOW% Porta 5000 pode estar em uso
)

netstat -an | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo %YELLOW% Porta 3000 pode estar em uso
)

echo.

REM Funcao para iniciar backend
echo %YELLOW% Iniciando Backend (porta 5000)...
cd nodejs

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo %YELLOW% Instalando dependencias do backend...
    npm install
    if errorlevel 1 (
        echo %RED% Falha ao instalar dependencias do backend
        cd ..
        pause
        exit /b 1
    )
)

REM Compilar TypeScript se necessario
if not exist "dist" (
    echo %YELLOW% Compilando TypeScript...
    npm run build
    if errorlevel 1 (
        echo %RED% Falha ao compilar TypeScript
        cd ..
        pause
        exit /b 1
    )
)

REM Iniciar servidor em background
echo %GREEN% Iniciando servidor backend...
start /b cmd /c "npm run dev > ..\backend.log 2>&1"

REM Aguardar um pouco para o servidor iniciar
timeout /t 3 /nobreak >nul

cd ..

REM Funcao para iniciar frontend
echo %YELLOW% Iniciando Frontend (porta 3000)...
cd chat_frontend

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo %YELLOW% Instalando dependencias do frontend...
    npm install
    if errorlevel 1 (
        echo %RED% Falha ao instalar dependencias do frontend
        cd ..
        pause
        exit /b 1
    )
)

REM Iniciar servidor em background
echo %GREEN% Iniciando servidor frontend...
start /b cmd /c "npm run dev > ..\frontend.log 2>&1"

REM Aguardar um pouco para o servidor iniciar
timeout /t 5 /nobreak >nul

cd ..

echo.
echo %GREEN% Ambos os servidores estao rodando!
echo ====================================
echo [ACCESS] Acesse de outros computadores na rede:
echo Frontend (Web App): http://%IP_ADDRESS%:3000
echo Backend (API/WebSocket): http://%IP_ADDRESS%:5000
echo.
echo [LOGS]
echo Backend logs: backend.log
echo Frontend logs: frontend.log
echo.
echo %YELLOW% Pressione Ctrl+C ou feche esta janela para parar os servidores
echo.

REM Aguardar indefinidamente
pause >nul

REM Quando o usuario pressionar uma tecla, matar os processos
echo.
echo %YELLOW% Parando servidores...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
echo %GREEN% Servidores parados
pause >nul