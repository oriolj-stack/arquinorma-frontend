# ArquiNorma - Git Installation Checker
# This script checks if Git is installed and provides installation instructions

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ArquiNorma - Git Installation Checker" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Git is installed
$gitInstalled = $false
$gitPath = $null

# Try to find Git in common locations
$possiblePaths = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "$env:ProgramFiles\Git\cmd\git.exe",
    "$env:ProgramFiles(x86)\Git\cmd\git.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $gitPath = $path
        $gitInstalled = $true
        break
    }
}

# Also try to run git command
if (-not $gitInstalled) {
    try {
        $gitVersion = & git --version 2>$null
        if ($gitVersion) {
            $gitInstalled = $true
            Write-Host "✓ Git is installed!" -ForegroundColor Green
            Write-Host "  Version: $gitVersion" -ForegroundColor Gray
        }
    } catch {
        # Git not found in PATH
    }
}

if ($gitInstalled) {
    Write-Host "`n✓ Git is already installed on your system!" -ForegroundColor Green
    Write-Host "`nYou can proceed with deployment. Run these commands:`n" -ForegroundColor Yellow
    
    Write-Host "  cd `"$PSScriptRoot`"" -ForegroundColor White
    Write-Host "  git init" -ForegroundColor White
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m `"Initial commit`"" -ForegroundColor White
    Write-Host "  git remote add origin https://github.com/YOUR_USERNAME/arquinorma-frontend.git" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
    
    Write-Host "`nSee DEPLOYMENT_GUIDE.md for complete instructions.`n" -ForegroundColor Cyan
} else {
    Write-Host "✗ Git is NOT installed on your system.`n" -ForegroundColor Red
    
    Write-Host "To install Git:" -ForegroundColor Yellow
    Write-Host "  1. Download Git for Windows from: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "  2. Run the installer with default settings" -ForegroundColor White
    Write-Host "  3. IMPORTANT: Restart your PowerShell/terminal after installation" -ForegroundColor White
    Write-Host "  4. Run this script again to verify installation`n" -ForegroundColor White
    
    Write-Host "Alternative: Use GitHub Desktop (easier for beginners)" -ForegroundColor Yellow
    Write-Host "  Download from: https://desktop.github.com/`n" -ForegroundColor White
    
    # Ask if user wants to open download page
    $response = Read-Host "Would you like to open the Git download page? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        Start-Process "https://git-scm.com/download/win"
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

