@echo off
title Safety Voice Board Server
cd /d "%~dp0"

echo ========================================================
echo   Starting Safety Voice Board on http://localhost:3000
echo ========================================================
echo.

start http://localhost:3000

call npm.cmd run dev

if %errorlevel% neq 0 (
    echo.
    echo Server failed to start.
    pause
)
