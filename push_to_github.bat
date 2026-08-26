@echo off
cd /d "%~dp0"

echo ========================================
echo   Pushing code to GitHub
echo ========================================
echo.

git push -u origin main

echo.
pause
