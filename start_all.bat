@echo off
title BRG Live Server & Tunnel
echo ===================================================
echo   STARTING BRG LIVE SERVER AND CLOUDFLARE TUNNEL
echo ===================================================
echo.

echo [1/2] Starting Node.js Server...
start "Node.js Server" cmd /k "node server.js"

echo [2/2] Starting Cloudflare Tunnel...
echo.
echo NOTE: Since we are using a Quick Tunnel, the URL might change if you restart.
echo Check the output window for the new URL if it changes.
echo.
start "Cloudflare Tunnel" cmd /k "cloudflared.exe tunnel --url http://localhost:3000"

echo.
echo ===================================================
echo   SYSTEM IS RUNNING
echo   Keep this window and the other two windows OPEN.
echo ===================================================
pause
