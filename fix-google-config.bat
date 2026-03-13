@echo off
echo Fixing Google OAuth Configuration...
echo.

echo Step 1: Checking if .env files exist...
if not exist "backend\.env" (
    echo Creating backend\.env from template...
    copy "backend\.env.example" "backend\.env"
) else (
    echo backend\.env already exists
)

if not exist "frontend\.env" (
    echo Creating frontend\.env from template...
    copy "frontend\.env.example" "frontend\.env"
) else (
    echo frontend\.env already exists
)

echo.
echo Step 2: Please follow these steps:
echo 1. Go to: https://console.cloud.google.com/apis/credentials
echo 2. Create or copy your OAuth 2.0 Client ID
echo 3. Edit backend\.env and replace "your_google_client_id_here" with your actual Client ID
echo 4. Edit frontend\.env and replace "your_google_client_id_here" with the SAME Client ID
echo 5. Restart both servers
echo.

echo Current .env files:
echo - backend\.env
echo - frontend\.env
echo.
echo Templates available:
echo - backend\.env.example
echo - frontend\.env.example
echo.

pause
