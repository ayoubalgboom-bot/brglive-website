@echo off
title BRG Live - FORCE START
color 0f
echo ==========================================
echo      BRG LIVE - FORCE START MODE
echo ==========================================
echo.
echo 1. Stopping old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

echo.
echo 2. Starting Server (New Window)...
start "BRG SERVER (DO NOT CLOSE)" cmd /k "color 0a & cls & echo Starting Server... & node server.js"

echo.
echo 3. Waiting 5 seconds for server to load...
timeout /t 5 >nul

echo.
echo 4. Starting Tunnel (New Window)...
start "BRG TUNNEL (DO NOT CLOSE)" cmd /k "color 0b & cls & echo Starting Tunnel... & cloudflared tunnel --url http://localhost:3000"

echo.
echo ==========================================
echo    SYSTEM ID STARTED!
echo    CHECK THE OTHER TWO WINDOWS:
echo    1. Green Window = Server (Must say 'Server running')
echo    2. Blue Window = Tunnel (Must show URL)
echo ==========================================
echo.
pause
