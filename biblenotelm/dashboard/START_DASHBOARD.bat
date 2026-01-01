@echo off
echo ========================================
echo Starting BibleNoteLM Dashboard (Preview)
echo ========================================
echo.
echo Dashboard will open at: http://localhost:4173
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0"
npm run preview
