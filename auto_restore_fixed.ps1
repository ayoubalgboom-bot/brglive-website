# Auto-Restore Script for BRG Live - FIXED VERSION
# Automatically starts server, tunnel, and updates GitHub
$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   BRG LIVE - AUTO RESTORE SYSTEM (FIXED)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Clean up old processes
Write-Host "[1/5] Cleaning up old processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -ErrorAction SilentlyContinue
Stop-Process -Name "cloudflared" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Start Node Server
Write-Host "[2/5] Starting Local Server..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Minimized
Write-Host "      Server running (PID: $($serverProcess.Id))" -ForegroundColor Green
Start-Sleep -Seconds 3

# 3. Start Cloudflare Tunnel
Write-Host "[3/5] Starting Network Tunnel..." -ForegroundColor Yellow

# Delete old log
if (Test-Path "tunnel_log.txt") { Remove-Item "tunnel_log.txt" }

# Start cloudflared as a background process (NOT a PowerShell job)
# This way the output goes directly to the file without PowerShell formatting
$tunnelProcess = Start-Process -FilePath ".\cloudflared.exe" `
    -ArgumentList "tunnel", "--url", "http://localhost:3000" `
    -RedirectStandardOutput "tunnel_log.txt" `
    -RedirectStandardError "tunnel_error.txt" `
    -WindowStyle Hidden `
    -PassThru

Write-Host "      Waiting for secure connection..." -NoNewline

# 4. Extract URL
$maxRetries = 30  
$foundUrl = $null

for ($i = 0; $i -lt $maxRetries; $i++) {
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline
    
    if (Test-Path "tunnel_log.txt") {
        # Read both stdout and stderr
        $content = ""
        if (Test-Path "tunnel_log.txt") {
            $content += Get-Content "tunnel_log.txt" -Raw -ErrorAction SilentlyContinue
        }
        if (Test-Path "tunnel_error.txt") {
            $content += Get-Content "tunnel_error.txt" -Raw -ErrorAction SilentlyContinue
        }
        
        # Match the URL pattern
        if ($content -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
            $foundUrl = $matches[0]
            break
        }
    }
}
Write-Host ""

if (-not $foundUrl) {
    Write-Host "ERROR: Could not get Tunnel URL. Check internet connection." -ForegroundColor Red
    Write-Host "Tunnel log contents:" -ForegroundColor Yellow
    if (Test-Path "tunnel_log.txt") { Get-Content "tunnel_log.txt" }
    if (Test-Path "tunnel_error.txt") { Get-Content "tunnel_error.txt" }
    Pause
    Exit
}

Write-Host "      Tunnel Active: $foundUrl" -ForegroundColor Green

# 5. Update Config & GitHub
Write-Host "[4/5] Updating Website Configuration..." -ForegroundColor Yellow
$configFile = "js\config.js"
$jsContent = Get-Content $configFile -Raw -Encoding UTF8

# Regex to replace the PRODUCTION_PROXY_URL const
$pattern = "const PRODUCTION_PROXY_URL = 'https://[^']+';"
$replacement = "const PRODUCTION_PROXY_URL = '$foundUrl';"

if ($jsContent -match $pattern) {
    $newJsContent = $jsContent -replace $pattern, $replacement
    $newJsContent | Set-Content $configFile -Encoding UTF8 -NoNewline
    Write-Host "      Config updated locally." -ForegroundColor Green
}
else {
    Write-Host "      WARNING: Could not find URL pattern in config.js" -ForegroundColor Red
}

Write-Host "[5/5] Publishing to Internet (GitHub)..." -ForegroundColor Yellow

# Robust Git Sync:
# 1. Fetch latest from remote to know what's there
git fetch origin 2>&1 | Out-Null

# 2. Reset local index to match remote (keeps your file changes in working dir)
git reset --mixed origin/main 2>&1 | Out-Null

# 3. Add the config file (which has the NEW url)
git add js/config.js

# 4. Commit and push
git commit -m "Auto-restore: Update tunnel URL to $foundUrl"
git push origin main --force

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SUCCESS! SYSTEM IS LIVE" -ForegroundColor Green
Write-Host "   Tunnel URL: $foundUrl" -ForegroundColor Cyan
Write-Host "   Website: https://brglive.abrdns.com/" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Waiting for GitHub Pages to update (2-3 minutes)..." -ForegroundColor Yellow
Write-Host "Do not close this window." -ForegroundColor Gray
Write-Host ""

# Monitor loop to keep script running
while ($true) {
    Start-Sleep -Seconds 60
    # Check if processes are still running
    if (-not (Get-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "WARNING: Server process died!" -ForegroundColor Red
    }
    if (-not (Get-Process -Id $tunnelProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "WARNING: Tunnel process died!" -ForegroundColor Red
    }
}
