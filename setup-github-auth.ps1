# ArquiNorma - GitHub Authentication Setup
# This script helps you set up GitHub authentication for pushing code

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "GitHub Authentication Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "To push to GitHub, you need a Personal Access Token.`n" -ForegroundColor Yellow

Write-Host "Step 1: Create a Personal Access Token" -ForegroundColor Green
Write-Host "  1. Go to: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "  2. Click 'Generate new token' → 'Generate new token (classic)'" -ForegroundColor White
Write-Host "  3. Give it a name: 'ArquiNorma Deployment'" -ForegroundColor White
Write-Host "  4. Select expiration: '90 days' (or 'No expiration' for convenience)" -ForegroundColor White
Write-Host "  5. Select scope: Check 'repo' (Full control of private repositories)" -ForegroundColor White
Write-Host "  6. Click 'Generate token'" -ForegroundColor White
Write-Host "  7. COPY THE TOKEN IMMEDIATELY (you won't see it again!)`n" -ForegroundColor Red

Write-Host "Step 2: Configure Git to use the token`n" -ForegroundColor Green

$token = Read-Host "Paste your Personal Access Token here"

if ($token) {
    # Update the remote URL to include the token
    $remoteUrl = "https://$token@github.com/oriolj-stack/arquinorma-frontend.git"
    
    Write-Host "`nUpdating remote URL with token..." -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
    
    Write-Host "✓ Remote URL updated" -ForegroundColor Green
    Write-Host "`nAttempting to push..." -ForegroundColor Yellow
    
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "`nNote: The token is stored in the remote URL." -ForegroundColor Yellow
        Write-Host "For better security, consider using Git Credential Manager.`n" -ForegroundColor Yellow
    } else {
        Write-Host "`n✗ Push failed. Please check:" -ForegroundColor Red
        Write-Host "  - Repository exists at: https://github.com/oriolj-stack/arquinorma-frontend" -ForegroundColor White
        Write-Host "  - Token has 'repo' scope" -ForegroundColor White
        Write-Host "  - Token is not expired" -ForegroundColor White
    }
} else {
    Write-Host "`nNo token provided. Exiting.`n" -ForegroundColor Red
}

