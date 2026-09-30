# CloudBase IDE - System & Environment Diagnostics Script
# Run with: powershell -ExecutionPolicy Bypass -File .\scripts\health-check.ps1

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  CLOUDBASE IDE - SYSTEM DIAGNOSTICS & HEALTH CHECK" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Operating System
$os = Get-CimInstance Win32_OperatingSystem
Write-Host "[1/5] Host OS Environment:" -ForegroundColor Yellow
Write-Host "  Caption: $($os.Caption)" -ForegroundColor White
Write-Host "  Build:   $($os.BuildNumber)" -ForegroundColor White
Write-Host "  Arch:    $($os.OSArchitecture)" -ForegroundColor White
Write-Host ""

# 2. Node.js & Tooling
Write-Host "[2/5] Runtime & Package Managers:" -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "  [PASS] Node.js: $(node -v)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Node.js is not found" -ForegroundColor Red
}
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "  [PASS] NPM: $(npm -v)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] NPM is not found" -ForegroundColor Red
}
Write-Host ""

# 3. Docker Engine & Named Pipes
Write-Host "[3/5] Docker Engine Connectivity:" -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "  Docker CLI: $(docker -v)" -ForegroundColor White
    $dockerOut = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] Docker daemon is running and responsive via WSL2/Windows pipe." -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Docker CLI is present, but daemon is not responding." -ForegroundColor Yellow
        Write-Host "         Please start Docker Desktop to enable full container isolation." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARN] Docker is not installed. CloudBase IDE will operate in local sandbox mode." -ForegroundColor Yellow
}
Write-Host ""

# 4. Ollama Local AI Service
Write-Host "[4/5] Ollama Offline AI Service (127.0.0.1:11434):" -ForegroundColor Yellow
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
    $modelCount = $res.models.Count
    Write-Host "  [PASS] Ollama service active! Installed models: $modelCount" -ForegroundColor Green
    foreach ($m in $res.models) {
        Write-Host "    - $($m.name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  [INFO] Ollama HTTP service is not reachable on port 11434." -ForegroundColor Yellow
    Write-Host "         To enable local AI models: run 'ollama serve'" -ForegroundColor Yellow
    Write-Host "         CloudBase IDE built-in heuristic assistant is standing by." -ForegroundColor White
}
Write-Host ""

# 5. Storage Guardian Directory Boundaries
Write-Host "[5/5] Storage Guardian Directories:" -ForegroundColor Yellow
$localAppData = [System.Environment]::GetFolderPath('LocalApplicationData')
$storageRoot = Join-Path $localAppData "CloudBaseIDE"
$projectsDir = Join-Path $storageRoot "Projects"
$dbFile = Join-Path $storageRoot "Database\cloudbase.sqlite"

Write-Host "  Storage Root: $storageRoot" -ForegroundColor White
if (Test-Path $storageRoot) {
    Write-Host "  [PASS] Storage Guardian directory structure verified." -ForegroundColor Green
} else {
    Write-Host "  [INFO] Storage folder will be automatically created on backend launch." -ForegroundColor White
}

if (Test-Path $dbFile) {
    Write-Host "  [PASS] SQLite database file active: $dbFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "Diagnostics complete." -ForegroundColor Cyan
