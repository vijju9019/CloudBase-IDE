# CloudBase IDE - Safe Shutdown Script
# Run with: powershell -ExecutionPolicy Bypass -File .\scripts\stop.ps1

Write-Host "Shutting down CloudBase IDE services..." -ForegroundColor Yellow

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "Stopping Backend service on port 3000..." -ForegroundColor Cyan
    Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
}

if ($port5173) {
    Write-Host "Stopping Frontend service on port 5173..." -ForegroundColor Cyan
    Stop-Process -Id $port5173.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "CloudBase IDE stopped safely." -ForegroundColor Green
