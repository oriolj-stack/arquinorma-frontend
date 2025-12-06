# ArquiNorma - Push to GitHub Script
# This script will help you push your code to GitHub

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ArquiNorma - Push to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$repoName = "arquinorma-frontend"
$username = "oriolj-stack"
$repoUrl = "https://github.com/$username/$repoName"

# Check if remote is configured
Write-Host "Checking Git remote..." -ForegroundColor Yellow
$currentRemote = git remote get-url origin 2>$null
if ($currentRemote) {
    Write-Host "Remote is configured: $currentRemote" -ForegroundColor Green
} else {
    Write-Host "Adding remote..." -ForegroundColor Yellow
    git remote add origin "https://github.com/$username/$repoName.git"
    Write-Host "Remote added" -ForegroundColor Green
}

# Check for authentication
Write-Host ""
Write-Host "Setting up authentication..." -ForegroundColor Yellow
Write-Host "GitHub requires a Personal Access Token for authentication." -ForegroundColor Yellow
Write-Host ""

Write-Host "To get a token:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "  2. Click Generate new token -> Generate new token (classic)" -ForegroundColor White
Write-Host "  3. Name: ArquiNorma Deployment" -ForegroundColor White
Write-Host "  4. Expiration: 90 days (or No expiration)" -ForegroundColor White
Write-Host "  5. Scopes: Check repo (Full control)" -ForegroundColor White
Write-Host "  6. Generate and COPY the token" -ForegroundColor White
Write-Host ""

$token = Read-Host "Paste your Personal Access Token here" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$tokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if (-not $tokenPlain) {
    Write-Host ""
    Write-Host "No token provided. Exiting." -ForegroundColor Red
    Write-Host ""
    exit
}

# Update remote URL with token
Write-Host ""
Write-Host "Configuring remote with token..." -ForegroundColor Yellow
$remoteWithToken = "https://$tokenPlain@github.com/$username/$repoName.git"
git remote set-url origin $remoteWithToken

# Try to push
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Go to Vercel: https://vercel.com" -ForegroundColor White
    Write-Host "  2. Import your repository: $repoName" -ForegroundColor White
    Write-Host "  3. Add environment variables" -ForegroundColor White
    Write-Host "  4. Deploy!" -ForegroundColor White
    Write-Host ""
    
    # Remove token from remote URL for security
    Write-Host "For security, updating remote URL to remove token..." -ForegroundColor Yellow
    git remote set-url origin "https://github.com/$username/$repoName.git"
    Write-Host "Remote URL updated (token removed)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: For future pushes, you may need to enter your token again," -ForegroundColor Yellow
    Write-Host "or set up Git Credential Manager for automatic authentication." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Push failed. Please check:" -ForegroundColor Red
    Write-Host "  - Repository exists: $repoUrl" -ForegroundColor White
    Write-Host "  - Token has repo scope" -ForegroundColor White
    Write-Host "  - Token is valid and not expired" -ForegroundColor White
    Write-Host "  - You have push access to the repository" -ForegroundColor White
    Write-Host ""
}
