$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$SqlFile = Join-Path $Root 'database\selfportrait_studio.sql'

Write-Host "`n=== Self-Portrait Studio Local Setup ===" -ForegroundColor Cyan

function Find-MySqlClient {
  $candidates = @(
    'C:\xampp\mysql\bin\mysql.exe',
    'D:\xampp\mysql\bin\mysql.exe',
    'E:\xampp\mysql\bin\mysql.exe'
  )
  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) { return $candidate }
  }
  foreach ($drive in (Get-PSDrive -PSProvider FileSystem)) {
    $candidate = Join-Path $drive.Root 'xampp\mysql\bin\mysql.exe'
    if (Test-Path $candidate) { return $candidate }
  }
  return $null
}

$Mysql = Find-MySqlClient
if (-not $Mysql) {
  Write-Host 'XAMPP MySQL client was not found.' -ForegroundColor Red
  Write-Host 'Install XAMPP or place it in C:\xampp, D:\xampp, or E:\xampp.' -ForegroundColor Yellow
  exit 1
}
Write-Host "MySQL client: $Mysql" -ForegroundColor Green

$port = Test-NetConnection 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
if (-not $port.TcpTestSucceeded) {
  Write-Host 'MySQL is not listening on port 3306.' -ForegroundColor Red
  Write-Host 'Start MySQL in XAMPP, then run this script again.' -ForegroundColor Yellow
  exit 1
}
Write-Host 'MySQL is running on port 3306.' -ForegroundColor Green

$envPath = Join-Path $Backend '.env'
if (-not (Test-Path $envPath)) {
  $secret = ([guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N'))
  @"
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
STUDIO_TIME_ZONE=Asia/Manila

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=selfportrait_studio
DB_USER=root
DB_PASS=
DB_AUTO_SYNC=false

JWT_SECRET=$secret
JWT_EXPIRES_IN=7d
"@ | Set-Content $envPath -Encoding UTF8
  Write-Host 'Created backend/.env with a random local JWT secret.' -ForegroundColor Green
} else {
  Write-Host 'backend/.env already exists; it was not overwritten.' -ForegroundColor DarkGray
}

$dbExists = & $Mysql -u root -N -B -e "SHOW DATABASES LIKE 'selfportrait_studio';" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Could not connect to MySQL as root with a blank password.' -ForegroundColor Red
  Write-Host 'If your XAMPP root user has a password, update backend/.env and import the SQL manually in phpMyAdmin.' -ForegroundColor Yellow
  exit 1
}

if (-not $dbExists) {
  Write-Host 'Importing fresh selfportrait_studio database...' -ForegroundColor Yellow
  $cmd = '"' + $Mysql + '" -u root < "' + $SqlFile + '"'
  cmd.exe /c $cmd
  if ($LASTEXITCODE -ne 0) { throw 'Fresh SQL import failed.' }
  Write-Host 'Fresh database imported.' -ForegroundColor Green
} else {
  $appTables = & $Mysql -u root -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='selfportrait_studio' AND table_name IN ('users','appointments','studio_settings');"
  if ([int]$appTables -eq 0) {
    Write-Host 'Database exists but app tables are missing. Importing fresh schema...' -ForegroundColor Yellow
    $cmd = '"' + $Mysql + '" -u root < "' + $SqlFile + '"'
    cmd.exe /c $cmd
    if ($LASTEXITCODE -ne 0) { throw 'Fresh SQL import failed.' }
    Write-Host 'Fresh database imported.' -ForegroundColor Green
  } else {
    Write-Host 'Existing database detected. It will NOT be overwritten.' -ForegroundColor Green
  }
}

Write-Host "`nInstalling backend dependencies..." -ForegroundColor Cyan
Push-Location $Backend
npm install
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
npm run db:migrate
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
npm run db:check
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Cyan
Push-Location $Frontend
npm install
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "`n========================================" -ForegroundColor Green
Write-Host 'SETUP COMPLETE' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host 'Admin demo : admin@selfportrait.studio / admin2026'
Write-Host 'Client demo: maria@gmail.com / client2026'
Write-Host "`nNext: powershell -ExecutionPolicy Bypass -File .\START_LOCAL.ps1" -ForegroundColor Cyan
