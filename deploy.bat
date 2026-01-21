@echo off
REM Deployment Script untuk Cloud-Native Consearch App (Windows)

setlocal enabledelayedexpansion

set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

echo %BLUE%========================================%NC%
echo %BLUE%Consearch App Cloud-Native Deployment%NC%
echo %BLUE%========================================%NC%

REM Check Docker
echo.
echo Checking prerequisites...
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Error: Docker is not installed%NC%
    exit /b 1
)
echo %GREEN%Docker is installed%NC%

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Error: Docker Compose is not installed%NC%
    exit /b 1
)
echo %GREEN%Docker Compose is installed%NC%

REM Generate SSL certificates if not exist
if not exist "ssl\cert.pem" (
    echo.
    echo Generating SSL certificates...
    if not exist "ssl" mkdir ssl
    
    REM Using openssl (needs to be installed on Windows)
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=ID/ST=State/L=City/O=Organization/CN=consearch-app"
    
    if errorlevel 1 (
        echo %YELLOW%Warning: Could not generate SSL certificates. Make sure OpenSSL is installed.%NC%
    ) else (
        echo %GREEN%SSL certificates generated%NC%
    )
)

REM Create .env file if not exist
if not exist ".env" (
    echo.
    echo Creating .env file...
    (
        echo POSTGRES_USER=consearch_user
        echo POSTGRES_PASSWORD=consearch_password_change_in_production
        echo POSTGRES_DB=consearch_db
        echo NODE_ENV=development
        echo LOG_LEVEL=info
        echo JWT_SECRET=your-jwt-secret-key-change-in-production
        echo SESSION_SECRET=your-session-secret-key-change-in-production
        echo GF_SECURITY_ADMIN_PASSWORD=admin
    ) > .env
    echo %GREEN%.env file created%NC%
)

REM Deploy with Docker Compose
echo.
echo %BLUE%Deploying with Docker Compose...%NC%

docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

echo.
echo %GREEN%Deployment completed!%NC%
echo.
echo %BLUE%Services are now running:%NC%
echo   - Backend API: http://localhost:3000
echo   - Frontend: http://localhost:80
echo   - Prometheus: http://localhost:9090
echo   - Grafana: http://localhost:3001 ^(admin/admin^)
echo   - AlertManager: http://localhost:9093
echo   - PostgreSQL: localhost:5432
echo.
