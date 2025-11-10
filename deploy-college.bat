@echo off
REM Redes Chat Backend - College Quick Deploy Script (Windows)
REM Version 1.1.1 - November 10, 2025
REM Enhanced with real-time socket logging and configurable networking
REM
REM Changes in v1.1.1:
REM - Configurable PORT and HOST environment variables
REM - Network binding to all interfaces (0.0.0.0) by default
REM - Enhanced logging for socket interactions
REM - Real-time message flow tracking
REM - Professional logging format for professor demonstrations

REM Default configuration (can be overridden with environment variables)
if "%PORT%"=="" set PORT=5000
if "%HOST%"=="" set HOST=0.0.0.0

echo [INFO] Configuration:
echo    Port: %PORT%
echo    Host: %HOST%
echo.

REM Colors for output (Windows CMD doesn't support ANSI colors well, using plain text)
set RED=[ERROR]
set GREEN=[OK]
set YELLOW=[WARN]
set NC=

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED% Docker is not installed. Please install Docker first.
    echo    Visit: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo %RED% docker-compose is not available. Please install docker-compose.
        echo    Visit: https://docs.docker.com/compose/install/
        pause
        exit /b 1
    )
)

echo %GREEN% Docker environment ready
echo.

REM Create deployment directory
set DEPLOY_DIR=redes-chat-backend
if exist "%DEPLOY_DIR%" (
    echo %YELLOW% Deployment directory '%DEPLOY_DIR%' already exists.
    set /p choice="Remove and recreate? (y/N): "
    if /i "!choice!"=="y" (
        rmdir /s /q "%DEPLOY_DIR%"
    ) else (
        echo Deployment cancelled.
        pause
        exit /b 0
    )
)

echo Creating deployment directory...
mkdir "%DEPLOY_DIR%"

REM Copy docker-compose file
if exist "docker-compose.yml" (
    copy "docker-compose.yml" "%DEPLOY_DIR%\" >nul
    echo Copied docker-compose.yml
) else (
    echo [ERROR] docker-compose.yml not found in current directory
    pause
    exit /b 1
)

REM Copy nodejs directory
if exist "nodejs" (
    xcopy "nodejs" "%DEPLOY_DIR%\nodejs\" /e /i /h /y >nul
    echo Copied nodejs directory
) else (
    echo [ERROR] nodejs directory not found
    pause
    exit /b 1
)

echo.
echo %GREEN% Deployment files prepared in '%DEPLOY_DIR%' directory
echo.

cd "%DEPLOY_DIR%"

REM Set environment variables for the deployment
set PORT=%PORT%
set HOST=%HOST%

echo Starting Docker containers...
echo This may take a few minutes for the first run...
echo.

REM Start the services
if exist "docker-compose.yml" (
    docker-compose up -d
    if errorlevel 1 (
        echo %RED% Failed to start services with docker-compose
        echo Trying with 'docker compose'...
        docker compose up -d
        if errorlevel 1 (
            echo %RED% Failed to start services
            cd ..
            pause
            exit /b 1
        )
    )
) else (
    echo %RED% docker-compose.yml not found in deployment directory
    cd ..
    pause
    exit /b 1
)

echo.
echo %GREEN% Services started successfully!
echo.
echo [ACCESS URLs]
echo Backend API/WebSocket: http://localhost:%PORT%
echo.
echo [DOCKER COMMANDS]
echo View logs: docker-compose logs -f
echo Stop services: docker-compose down
echo Restart: docker-compose restart
echo.
echo [TROUBLESHOOTING]
echo If ports are in use, change PORT environment variable
echo Example: set PORT=5001
echo.

cd ..
echo %GREEN% Deployment completed successfully!
echo Press any key to exit...
pause >nul