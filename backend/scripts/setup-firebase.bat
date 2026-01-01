@echo off
REM Firebase Setup Script for BibleNoteLM (Windows)
REM This script helps you set up and deploy to Firebase

echo =========================================
echo BibleNoteLM Firebase Setup Script
echo =========================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firebase CLI is not installed!
    echo Install it with: npm install -g firebase-tools
    pause
    exit /b 1
)

echo [OK] Firebase CLI found
echo.

REM Check if logged in
firebase projects:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] You are not logged in to Firebase
    echo Logging in...
    firebase login
)

echo [OK] Logged in to Firebase
echo.

REM List available projects
echo Available Firebase Projects:
firebase projects:list
echo.

REM Ask for project ID
set /p PROJECT_ID="Enter your Firebase Project ID: "

if "%PROJECT_ID%"=="" (
    echo [ERROR] Project ID cannot be empty
    pause
    exit /b 1
)

REM Use the project
firebase use %PROJECT_ID%

echo [OK] Using project: %PROJECT_ID%
echo.

REM Check if .env file exists
if not exist "functions\.env" (
    echo [INFO] Creating functions/.env file...
    (
        echo # Stripe Configuration (for subscriptions^)
        echo # Get these from: https://dashboard.stripe.com/apikeys
        echo STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
        echo STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
        echo STRIPE_PRICE_ID_BASIC=price_your_basic_price_id_here
        echo STRIPE_PRICE_ID_PREMIUM=price_your_premium_price_id_here
        echo.
        echo # App Configuration
        echo APP_NAME=BibleNoteLM
        echo SUPPORT_EMAIL=support@biblenotelm.com
    ) > functions\.env
    echo [OK] Created functions/.env
    echo [WARNING] Please update functions/.env with your actual Stripe keys
) else (
    echo [OK] functions/.env already exists
)

echo.

REM Install dependencies
echo Installing dependencies...
cd functions
call npm install
cd ..

echo [OK] Dependencies installed
echo.

REM Build TypeScript
echo Building TypeScript functions...
cd functions
call npm run build
cd ..

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo [OK] Build successful
echo.

REM Ask if user wants to deploy
set /p DEPLOY="Do you want to deploy to Firebase now? (y/n): "

if /i "%DEPLOY%"=="y" (
    echo.
    echo Deploying to Firebase...
    firebase deploy

    if %ERRORLEVEL% EQU 0 (
        echo.
        echo =========================================
        echo [SUCCESS] Deployment successful!
        echo =========================================
        echo.
        echo Your Cloud Functions are now live at:
        echo https://us-central1-%PROJECT_ID%.cloudfunctions.net/
        echo.
        echo Next steps:
        echo 1. Configure your mobile app with Firebase
        echo 2. Update Stripe webhook URL in Stripe Dashboard
        echo 3. Test your functions in the Firebase Console
        echo.
    ) else (
        echo [ERROR] Deployment failed
        pause
        exit /b 1
    )
) else (
    echo.
    echo Deployment skipped.
    echo You can deploy later with: firebase deploy
)

echo.
echo Setup complete!
echo.
pause
