@echo off
cd /d "%~dp0"

echo ========================================================
echo   Starting Safety Voice Board + Cloudflare Tunnel
echo ========================================================
echo.

echo 1. Launching Next.js Server on port 3000...
start "Safety Voice Local Server" npm.cmd run dev

echo 2. Connecting to Cloudflare Tunnel...
echo    (Wait 3-5 seconds for the public https:// url to appear)
echo.

cloudflared.exe tunnel --url http://127.0.0.1:3000

echo.
pause
