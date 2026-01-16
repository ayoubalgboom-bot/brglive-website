# Deploy Channels and Matches to Website
# Quick script to push your data files to GitHub after editing in admin panel

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   DEPLOY CHANNELS & MATCHES TO WEBSITE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if there are changes
$status = git status --short | Where-Object { $_ -match "channels.json|matches.json" }

if (-not $status) {
    Write-Host "✓ No changes to deploy." -ForegroundColor Green
    Write-Host "  (channels.json and matches.json are already up to date)" -ForegroundColor Gray
    Pause
    Exit
}

Write-Host "Changes detected:" -ForegroundColor Yellow
$status | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
Write-Host ""

# Show what changed
Write-Host "Channel count:" -ForegroundColor Cyan
$channelCount = (Get-Content channels.json | ConvertFrom-Json).channels.Count
Write-Host "  $channelCount channels" -ForegroundColor White
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Deploy these changes to the live website? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    Pause
    Exit
}

Write-Host ""
Write-Host "Deploying to GitHub..." -ForegroundColor Yellow

# Add files
git add channels.json matches.json

# Commit
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Update channels and matches - $timestamp"

# Push
git push

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "   ✓ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your changes will be live in 1-2 minutes at:" -ForegroundColor Cyan
Write-Host "  https://brglive.abrdns.com" -ForegroundColor White
Write-Host ""
Pause
