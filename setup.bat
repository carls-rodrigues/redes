@echo off
REM Colors and formatting for Windows
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   RedES Chat - Setup Automatico
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% instalado
echo.

REM Check Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Git nao encontrado!
    echo Baixe em: https://git-scm.com/
    pause
    exit /b 1
)

echo [OK] Git instalado
echo.

REM Setup Backend
echo Configurando Backend (Node.js)...
cd nodejs
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao configurar Backend
    pause
    exit /b 1
)
echo [OK] Backend pronto!
echo.

REM Setup Frontend
echo Configurando Frontend (Electron)...
cd ..\electron
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao configurar Frontend
    pause
    exit /b 1
)
echo [OK] Frontend pronto!
echo.

echo ========================================
echo   Setup completo!
echo ========================================
echo.

echo Proximos passos:
echo.
echo 1. Em um Terminal CMD, inicie o Backend:
echo    cd nodejs
echo    npm run dev
echo.
echo 2. Em outro Terminal CMD, inicie o Frontend:
echo    cd electron
echo    npm run dev
echo.
echo O app abrira automaticamente.
echo.
echo Para mais informacoes, veja: SETUP.md
echo.
pause
