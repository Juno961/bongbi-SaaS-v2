param(
  [string]$ApiHost = "127.0.0.1",
  [int]$ApiPort = 8001,
  [bool]$Reload = $true
)

$ErrorActionPreference = "Stop"

try {
  $root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $apiPath = Join-Path $root "bongbi-api"
  if (-not (Test-Path $apiPath)) {
    throw "API directory not found: $apiPath"
  }

  $venvScripts = Join-Path $apiPath "venv\Scripts"
  $pythonExe = Join-Path $venvScripts "python.exe"
  # 항상 python -m uvicorn 사용 (uvicorn.exe 런처 문제 회피)
  if (Test-Path $pythonExe) {
    $uvicornCmd = "$pythonExe -m uvicorn"
  } else {
    $uvicornCmd = "python -m uvicorn"
  }

  Push-Location $apiPath
  $env:PYTHONPATH = $apiPath
  $args = @("app.main:app", "--host", $ApiHost, "--port", "$ApiPort")
  if ($Reload) { $args += "--reload" }

  Write-Host ("Starting API → http://{0}:{1} (reload={2})" -f $ApiHost, $ApiPort, $Reload) -ForegroundColor Cyan
  # python -m uvicorn은 인자 문자열로 전달
  & powershell -NoProfile -Command "$uvicornCmd $($args -join ' ')"
}
catch {
  Write-Error $_
  exit 1
}
finally {
  Pop-Location | Out-Null
}


