$base = "http://localhost:3000/api/channels"

Write-Host "1. Testing GET..."
$original = Invoke-RestMethod -Uri $base -Method Get
Write-Host "Count: $($original.channels.Count)"

Write-Host "`n2. Testing POST (Add)..."
$body = @{
    name      = "Test Channel PowerShell"
    category  = "Test"
    logo      = "assets/logo.png"
    streamUrl = "http://test.com/stream"
} | ConvertTo-Json
$response = Invoke-RestMethod -Uri $base -Method Post -Body $body -ContentType "application/json"
$newId = $response.channel.id
Write-Host "Created ID: $newId"

Write-Host "`n3. Testing PUT (Edit)..."
$editBody = @{
    name      = "Edited Channel PowerShell"
    category  = "Test"
    logo      = "assets/logo.png"
    streamUrl = "http://test.com/stream"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$base/$newId" -Method Put -Body $editBody -ContentType "application/json"
Write-Host "Edited."

Write-Host "`n4. Testing GET (Verify Edit)..."
$verify = Invoke-RestMethod -Uri $base -Method Get
$channel = $verify.channels | Where-Object { $_.id -eq $newId }
Write-Host "New Name: $($channel.name)"

if ($channel.name -eq "Edited Channel PowerShell") {
    Write-Host "`n5. Testing DELETE..."
    Invoke-RestMethod -Uri "$base/$newId" -Method Delete
    Write-Host "Deleted."
}
else {
    Write-Error "Edit failed!"
}

Write-Host "`n6. Final Verification..."
$final = Invoke-RestMethod -Uri $base -Method Get
if ($final.channels.Count -eq $original.channels.Count) {
    Write-Host "SUCCESS: Channel count matched original."
}
else {
    Write-Host "FAILURE: Count mismatch."
}
