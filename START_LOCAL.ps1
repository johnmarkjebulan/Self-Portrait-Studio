$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'

Write-Host "`n=== Starting Self-Portrait Studio ===" -ForegroundColor Cyan

$db = Test-NetConnection 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
if (-not $db.TcpTestSucceeded) {
  Write-Host 'MySQL is not running on port 3306. Start MySQL in XAMPP first.' -ForegroundColor Red
  exit 1
}
if (-not (Test-Path (Join-Path $Backend '.env'))) {
  Write-Host 'backend/.env is missing. Run .\SETUP_LOCAL.ps1 once.' -ForegroundColor Red
  exit 1
}
if (-not (Test-Path (Join-Path $Backend 'node_modules'))) {
  Write-Host 'Backend dependencies are missing. Run .\SETUP_LOCAL.ps1 once.' -ForegroundColor Red
  exit 1
}
if (-not (Test-Path (Join-Path $Frontend 'node_modules'))) {
  Write-Host 'Frontend dependencies are missing. Run .\SETUP_LOCAL.ps1 once.' -ForegroundColor Red
  exit 1
}

Write-Host 'Checking database migrations...' -ForegroundColor Cyan
Push-Location $Backend
npm run db:migrate
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

function Test-BackendHealth {
  try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/health' -Method Get -TimeoutSec 3
    return $health.status -eq 'ok'
  } catch {
    return $false
  }
}

$apiPort = Test-NetConnection 127.0.0.1 -Port 5000 -WarningAction SilentlyContinue
if ($apiPort.TcpTestSucceeded) {
  if (-not (Test-BackendHealth)) {
    Write-Host 'Port 5000 is already in use, but it is not the Self-Portrait Studio backend.' -ForegroundColor Red
    Write-Host 'Stop the process using port 5000, then run this script again.' -ForegroundColor Yellow
    exit 1
  }
  Write-Host 'Backend is already running on http://localhost:5000' -ForegroundColor DarkGray
} else {
  Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$Backend'; npm run dev"
  Write-Host 'Backend starting on http://localhost:5000' -ForegroundColor Green

  $healthy = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-BackendHealth) { $healthy = $true; break }
  }
  if (-not $healthy) {
    Write-Host 'Backend did not become healthy within 10 seconds. Check the backend PowerShell window for the error.' -ForegroundColor Yellow
  }
}

$webPort = Test-NetConnection 127.0.0.1 -Port 5173 -WarningAction SilentlyContinue
if (-not $webPort.TcpTestSucceeded) {
  Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$Frontend'; npm run dev"
  Write-Host 'Frontend starting on http://localhost:5173' -ForegroundColor Green
} else {
  Write-Host 'Frontend port 5173 is already in use. If this is not your Vite app, stop that process first.' -ForegroundColor DarkGray
}

Write-Host "`nOpen http://localhost:5173" -ForegroundColor Cyan
