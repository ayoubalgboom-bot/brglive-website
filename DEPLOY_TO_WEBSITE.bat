@echo off
title Deploy Channels & Matches to Website
echo Deploying your data to the live website...
PowerShell -NoProfile -ExecutionPolicy Bypass -File "deploy_data.ps1"
pause
