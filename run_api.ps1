param(
  [string]$ApiHost = "127.0.0.1",
  [int]$ApiPort = 8000,
  [bool]$Reload = $true
)

$ErrorActionPreference = "Stop"

try {
  $root    = Split-Path -Parent $MyInvocation.MyCommand.Path
  $apiPath = Join-Path $root "bongbi-api"
  if (-not (Test-Path $apiPath)) { throw "API directory not found: $apiPath" }

  # 프로젝트 루트 .venv 우선 사용
  $venvPython = Join-Path $root ".venv\Scripts\python.exe"
  $python = "python"
  if (Test-Path $venvPython) { $python = $venvPython }

  Push-Location $apiPath
  $env:PYTHONPATH = $apiPath

  $args = @("app.main:app", "--host", $ApiHost, "--port", "$ApiPort")
  if ($Reload) { $args += "--reload" }

  Write-Host ("Starting API → http://{0}:{1} (reload={2})" -f $ApiHost, $ApiPort, $Reload) -ForegroundColor Cyan
  & $python -m uvicorn @args
  if ($LASTEXITCODE) { exit $LASTEXITCODE }
}
catch {
  Write-Error $_
  exit 1
}
finally {
  Pop-Location | Out-Null
}
