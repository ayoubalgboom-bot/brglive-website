# Safe Auto-Deploy Monitor for BRG Live
# Automatically pushes changes to GitHub when you edit channels or matches

$ErrorActionPreference = "Continue"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   BRG LIVE - SAFE AUTO DEPLOY MONITOR" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Monitoring channels.json and matches.json..." -ForegroundColor Yellow
Write-Host "   Keep this window open to auto-deploy changes." -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

function Deploy-Changes {
    param($changedFiles)
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Change detected in: $changedFiles" -ForegroundColor Yellow
    Write-Host "   Waiting 5 seconds for other changes..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    Write-Host "   Deploying to GitHub..." -ForegroundColor Cyan
    
    # Add files
    git add channels.json matches.json
    
    # Commit
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "Auto-deploy: Update data - $timestamp" | Out-Null
    
    # Push
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [SUCCESS] Changes are live!" -ForegroundColor Green
        Write-Host "   Next check in 10 seconds..." -ForegroundColor Gray
    }
    else {
        Write-Host "   [ERROR] Push failed. Will try again next cycle." -ForegroundColor Red
    }
    Write-Host "------------------------------------------------" -ForegroundColor DarkGray
}

while ($true) {
    # Check git status for changes in our specific files
    $status = git status --short
    
    if ($status) {
        $hasSignificantChanges = $false
        $changedList = @()
        
        if ($status -match "channels.json") { 
            $hasSignificantChanges = $true 
            $changedList += "channels.json"
        }
        if ($status -match "matches.json") { 
            $hasSignificantChanges = $true 
            $changedList += "matches.json"
        }
        
        if ($hasSignificantChanges) {
            Deploy-Changes -changedFiles ($changedList -join ", ")
        }
    }
    
    Start-Sleep -Seconds 10
}
