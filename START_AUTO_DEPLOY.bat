@echo off
title BRG Live - Auto Deploy Monitor
echo Starting Safe Auto-Deploy Monitor...
echo This will automatically push your changes to the website.
echo.
PowerShell -NoProfile -ExecutionPolicy Bypass -File "AUTO_DEPLOY.ps1"
pause
