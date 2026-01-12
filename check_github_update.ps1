# GitHub Pages Update Monitor
# This script checks if GitHub Pages has updated to use the Serveo tunnel

$configUrl = "https://ayoubalgboom-bot.github.io/brglive-website/js/config.js?nocache=$([DateTimeOffset]::Now.ToUnixTimeSeconds())"
$expectedUrl = "98789a-41-103-220-197.serveousercontent.com"

Write-Host "`n🔍 Checking if GitHub Pages has updated..." -ForegroundColor Cyan
Write-Host "Expected proxy: $expectedUrl`n" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $configUrl -UseBasicParsing
    $content = $response.Content
    
    if ($content -match $expectedUrl) {
        Write-Host "✅ SUCCESS! GitHub Pages has been updated!" -ForegroundColor Green
        Write-Host "Your website should now be working at:" -ForegroundColor Green
        Write-Host "https://ayoubalgboom-bot.github.io/brglive-website/`n" -ForegroundColor Cyan
        exit 0
    }
    else {
        Write-Host "⏳ Still waiting... GitHub is still serving the old config." -ForegroundColor Yellow
        Write-Host "Current config still has the old LocalTunnel URL.`n" -ForegroundColor Gray
        Write-Host "Tip: Try again in 2-3 minutes." -ForegroundColor Gray
        exit 1
    }
}
catch {
    Write-Host "Error checking GitHub: $_" -ForegroundColor Red
    exit 1
}
