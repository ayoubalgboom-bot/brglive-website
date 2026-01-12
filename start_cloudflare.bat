@echo off
echo Starting Cloudflare Tunnel...
.\cloudflared.exe tunnel --url http://localhost:3000 > cloudflare_output.txt 2>&1
pause
