$logFile = "tunnel_cmd.log"
if (-not (Test-Path $logFile)) {
    Write-Host "Log file not found!"
    exit 1
}

$content = Get-Content $logFile -Raw
if ($content -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
    $url = $matches[0]
    Write-Host "Found URL: $url"
    
    $configFile = "js\config.js"
    $jsContent = Get-Content $configFile -Raw -Encoding UTF8
    $pattern = "const PRODUCTION_PROXY_URL = 'https://[^']+';"
    $replacement = "const PRODUCTION_PROXY_URL = '$url';"
    
    if ($jsContent -match $pattern) {
        $newJsContent = $jsContent -replace $pattern, $replacement
        $newJsContent | Set-Content $configFile -Encoding UTF8 -NoNewline
        Write-Host "Updated config.js"
        
        git add js/config.js
        git commit -m "Update tunnel URL manually"
        git push origin main --force
        Write-Host "Pushed to GitHub"
    }
    else {
        Write-Host "Pattern not found in config.js"
    }
}
else {
    Write-Host "URL not found in log"
}
