@echo off
cd /d "%~dp0"

echo ========================================
echo   Vercel Login and Deployment
echo ========================================
echo.
echo Step 1: Login to Vercel...
echo.

call npx.cmd vercel login

echo.
echo Step 2: Deploying to Vercel (Press Enter for prompts)...
echo.

call npx.cmd vercel --prod

echo.
echo ========================================
echo   Deployment Process Completed!
echo ========================================
echo.
pause
