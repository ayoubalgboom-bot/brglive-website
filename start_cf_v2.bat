@echo off
echo Starting New Cloudflare Tunnel...
.\cloudflared.exe tunnel --url http://localhost:3000 > tunnel_output_v2.txt 2>&1
pause
