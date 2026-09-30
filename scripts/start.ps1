# CloudBase IDE - Startup Script
# Run with: powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  STARTING CLOUDBASE IDE (LOCAL-FIRST DEV ENVIRONMENT)" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Check if ports are already in use
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "Notice: Port 3000 is already active. Terminating previous backend..." -ForegroundColor Yellow
    Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
}

if ($port5173) {
    Write-Host "Notice: Port 5173 is already active. Terminating previous frontend..." -ForegroundColor Yellow
    Stop-Process -Id $port5173.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting CloudBase Backend Service on http://127.0.0.1:3000..." -ForegroundColor Green
$backendProc = Start-Process -FilePath "npx" -ArgumentList "tsx watch src/index.ts" -WorkingDirectory "$PSScriptRoot\..\backend" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

Write-Host "Starting CloudBase Frontend IDE on http://localhost:5173..." -ForegroundColor Green
$frontendProc = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$PSScriptRoot\..\frontend" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "CloudBase IDE is running!" -ForegroundColor Cyan
Write-Host "  -> Web IDE Interface:  http://localhost:5173" -ForegroundColor White
Write-Host "  -> Backend API Service: http://127.0.0.1:3000" -ForegroundColor White
Write-Host "  -> Storage Root:        %LOCALAPPDATA%\CloudBaseIDE" -ForegroundColor White
Write-Host ""
Write-Host "Opening your browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host "To stop the IDE, run: powershell -File .\scripts\stop.ps1" -ForegroundColor Gray
