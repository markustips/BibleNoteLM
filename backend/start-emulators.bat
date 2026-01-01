@echo off
cd /d "%~dp0"
echo Starting Firebase Emulators...
echo.
echo Emulator UI will be available at: http://localhost:4000
echo Functions: http://localhost:5001
echo Firestore: http://localhost:8080
echo Auth: http://localhost:9099
echo Storage: http://localhost:9199
echo.
echo Press Ctrl+C to stop emulators
echo.
firebase emulators:start --only functions,firestore,auth,storage --project demo-biblenotelm
