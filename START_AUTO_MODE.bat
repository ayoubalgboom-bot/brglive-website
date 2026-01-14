@echo off
title BRG Live - Auto Start
echo Starting BRG Live Auto-Restore System...
PowerShell -NoProfile -ExecutionPolicy Bypass -File "auto_restore_fixed.ps1"
pause
