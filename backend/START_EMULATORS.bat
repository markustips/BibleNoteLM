@echo off
echo ========================================
echo Starting Firebase Emulators
echo ========================================
echo.
echo Emulator UI will open at: http://localhost:4000
echo Functions: http://localhost:5001
echo Firestore: http://localhost:8080
echo Auth: http://localhost:9099
echo Storage: http://localhost:9199
echo Hosting: http://localhost:5000
echo.
echo Press Ctrl+C to stop all emulators
echo.
cd /d "%~dp0"
firebase emulators:start
