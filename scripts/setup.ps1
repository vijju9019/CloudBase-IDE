# CloudBase IDE - Windows 11 Automated Setup Script
# Run with: powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  CLOUDBASE IDE - INSTALLATION & SETUP WIZARD" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js
Write-Host "[1/5] Verifying Node.js Runtime..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    Write-Host "  -> Node.js detected: $nodeVer" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "  Please install Node.js v20+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 2. Check Docker Desktop
Write-Host "[2/5] Verifying Docker Desktop..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVer = docker -v
    Write-Host "  -> Docker CLI detected: $dockerVer" -ForegroundColor Green
    
    # Check if daemon is responsive
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  -> Docker Engine is running and responsive." -ForegroundColor Green
    } else {
        Write-Host "  -> Note: Docker Desktop is installed, but the daemon is not currently running." -ForegroundColor Yellow
        Write-Host "     You can launch Docker Desktop from the Start Menu to enable container isolation." -ForegroundColor Yellow
    }
} else {
    Write-Host "  -> Docker CLI not found in PATH." -ForegroundColor Yellow
    Write-Host "     CloudBase IDE will use its isolated workspace sandbox fallback mode until Docker Desktop is installed." -ForegroundColor Yellow
}

# 3. Check Ollama
Write-Host "[3/5] Verifying Ollama Local AI Engine..." -ForegroundColor Yellow
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "  -> Ollama CLI detected." -ForegroundColor Green
} else {
    Write-Host "  -> Ollama is not installed in PATH." -ForegroundColor Yellow
    Write-Host "     To enable local neural coding models:" -ForegroundColor Yellow
    Write-Host "     1. Install Ollama: https://ollama.com/download" -ForegroundColor Yellow
    Write-Host "     2. Run: ollama pull qwen2.5-coder:1.5b" -ForegroundColor Yellow
    Write-Host "     (CloudBase IDE includes a built-in offline heuristic assistant in the meantime)" -ForegroundColor Yellow
}

# 4. Install Monorepo Dependencies
Write-Host "[4/5] Installing Backend & Frontend NPM Packages..." -ForegroundColor Yellow
npm install
npm --prefix backend install
npm --prefix frontend install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Package installation encountered issues." -ForegroundColor Red
    exit 1
}
Write-Host "  -> Dependencies successfully installed." -ForegroundColor Green

# 5. Build Projects
Write-Host "[5/5] Building CloudBase IDE Application Bundles..." -ForegroundColor Yellow
npm --prefix backend run build
npm --prefix frontend run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Build step failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE! CLOUDBASE IDE IS READY." -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application, run:" -ForegroundColor Cyan
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1" -ForegroundColor White
Write-Host "Or:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
