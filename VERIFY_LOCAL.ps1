$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'

Write-Host "`n=== Self-Portrait Studio Verification ===" -ForegroundColor Cyan

$required = @(
  (Join-Path $Backend 'package.json'),
  (Join-Path $Frontend 'package.json'),
  (Join-Path $Root 'database\selfportrait_studio.sql')
)
foreach ($item in $required) {
  if (-not (Test-Path $item)) {
    Write-Host "Missing required file: $item" -ForegroundColor Red
    exit 1
  }
}

if (-not (Test-Path (Join-Path $Backend '.env'))) {
  Write-Host 'backend/.env is missing. Run SETUP_LOCAL.ps1 first.' -ForegroundColor Red
  exit 1
}
if (-not (Test-Path (Join-Path $Backend 'node_modules')) -or -not (Test-Path (Join-Path $Frontend 'node_modules'))) {
  Write-Host 'Dependencies are missing. Run SETUP_LOCAL.ps1 first.' -ForegroundColor Red
  exit 1
}

$db = Test-NetConnection 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
if (-not $db.TcpTestSucceeded) {
  Write-Host 'MySQL is not running on port 3306.' -ForegroundColor Red
  exit 1
}

Write-Host "`n[1/4] Backend tests" -ForegroundColor Cyan
Push-Location $Backend
npm test
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }

Write-Host "`n[2/4] Database migrations" -ForegroundColor Cyan
npm run db:migrate
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }

Write-Host "`n[3/4] Database connection" -ForegroundColor Cyan
npm run db:check
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "`n[4/4] Frontend production build" -ForegroundColor Cyan
Push-Location $Frontend
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "`n========================================" -ForegroundColor Green
Write-Host 'VERIFICATION PASSED' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host 'You can start the app with .\START_LOCAL.ps1' -ForegroundColor Cyan
