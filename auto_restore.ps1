# Auto-Restore Script for BRG Live
# automatically starts server, tunnel, and updates GitHub
$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   BRG LIVE - AUTO RESTORE SYSTEM" -ForegroundColor Cyan
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

# 3. Start Cloudflare Tunnel
Write-Host "[3/5] Starting Network Tunnel..." -ForegroundColor Yellow
# Delete old log
if (Test-Path "tunnel_log.txt") { Remove-Item "tunnel_log.txt" }

# Start cloudflared hidden and redirect output
$tunnelJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    .\cloudflared.exe tunnel --url http://localhost:3000 > tunnel_log.txt 2>&1
} -ArgumentList (Get-Location).Path

Write-Host "      Waiting for secure connection..." -NoNewline

# 4. Extract URL
$maxRetries = 30
$foundUrl = $null

for ($i = 0; $i -lt $maxRetries; $i++) {
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline
    
    if (Test-Path "tunnel_log.txt") {
        # Try to find URL in log
        $content = Get-Content "tunnel_log.txt" -Raw -ErrorAction SilentlyContinue
        if ($content -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
            $foundUrl = $matches[0]
            break
        }
    }
}
Write-Host ""

if (-not $foundUrl) {
    Write-Host "ERROR: Could not get Tunnel URL. Check internet connection." -ForegroundColor Red
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
    $newJsContent | Set-Content $configFile -Encoding UTF8
    Write-Host "      Config updated locally." -ForegroundColor Green
}
else {
    Write-Host "      WARNING: Could not find URL pattern in config.js" -ForegroundColor Red
}

Write-Host "[5/5] Publishing to Internet (GitHub)..." -ForegroundColor Yellow


# Safe Git Sync - Only updates config.js, preserves matches.json and channels.json
# 1. Fetch latest from remote
git fetch origin 2>&1 | Out-Null

# 2. Stage ONLY config.js (don't touch other files like matches.json or channels.json)
git add js/config.js

# 3. Check if there are changes to commit
git diff --staged --quiet
if ($LASTEXITCODE -ne 0) {
    # 4. Commit the config change
    git commit -m "Auto-restore: Update tunnel URL"
    
    # 5. Pull and push (rebase to avoid merge commits)
    git pull --rebase origin main 2>&1 | Out-Null
    git push origin main
    Write-Host "      Config pushed to GitHub." -ForegroundColor Green
}
else {
    Write-Host "      No config changes to commit." -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SUCCESS! SYSTEM IS LIVE" -ForegroundColor Cyan
Write-Host "   URL: $foundUrl" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Do not close this window." -ForegroundColor Gray

# Monitor loop to keep script running
while ($true) {
    Start-Sleep -Seconds 60
}
