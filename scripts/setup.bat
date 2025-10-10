@echo off
REM Setup script for Secure International Payments Portal (Windows)
echo 🚀 Setting up Secure International Payments Portal...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not installed. Please install PostgreSQL 13+ first.
    echo    You can download it from: https://www.postgresql.org/download/
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Create environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating environment file...
    copy env.example .env
    echo ✅ Environment file created. Please edit .env with your configuration.
) else (
    echo ✅ Environment file already exists
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist logs mkdir logs
if not exist certs mkdir certs
if not exist security-reports mkdir security-reports
if not exist scout-reports mkdir scout-reports

echo ✅ Directories created

REM Generate SSL certificates for development
echo 🔐 Generating SSL certificates for development...
where openssl >nul 2>&1
if %errorlevel% equ 0 (
    scripts\generate-ssl-certs.bat
    echo ✅ SSL certificates generated
) else (
    echo ⚠️  OpenSSL not found. SSL certificates not generated.
    echo    Please install OpenSSL or generate certificates manually.
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Set up PostgreSQL database:
echo    createdb secure_payments_portal
echo 3. Run database migrations:
echo    npm run db:migrate
echo 4. Start the development server:
echo    npm run dev
echo.
echo The application will be available at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3001
echo - HTTPS: https://localhost:3443
echo.
echo For production deployment, see README.md
