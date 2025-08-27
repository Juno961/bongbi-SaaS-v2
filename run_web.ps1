param(
  [int]$Port = 5173,
  [string]$WebHost = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

try {
  $root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $webPath = Join-Path $root "bongbi-web"
  if (-not (Test-Path $webPath)) {
    throw "Web directory not found: $webPath"
  }

  Push-Location $webPath

  if (Test-Path "node_modules") {
    Write-Host "node_modules detected. Skipping install." -ForegroundColor Yellow
  } else {
    Write-Host "Installing dependencies (npm ci)..." -ForegroundColor Cyan
    npm ci
  }

  $env:VITE_PORT = "$Port"
  $env:HOST = $WebHost

  Write-Host ("Starting Vite dev server → http://{0}:{1}" -f $WebHost, $Port) -ForegroundColor Cyan
  npm run dev
}
catch {
  Write-Error $_
  exit 1
}
finally {
  Pop-Location | Out-Null
}


