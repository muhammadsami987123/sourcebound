<#
Starts both the backend (FastAPI/Uvicorn) and frontend (static file server)
from a single terminal, in the background, and streams their logs here.

Usage (from the project root, in PowerShell):
    .\start-dev.ps1

Stop both servers with Ctrl+C.

First-time setup (run once, before using this script):
    cd backend
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    copy .env.example .env
    # then edit backend\.env and set OPENAI_API_KEY
#>

$ErrorActionPreference = "Continue"
$root = $PSScriptRoot
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

$venvPython = Join-Path $backendDir "venv\Scripts\python.exe"
$backendPython = if (Test-Path $venvPython) { $venvPython } else { "python" }

if (-not (Test-Path (Join-Path $backendDir ".env"))) {
    Write-Host "Warning: backend\.env not found. Copy backend\.env.example to backend\.env and set OPENAI_API_KEY first." -ForegroundColor Yellow
}

Write-Host "Starting backend  -> http://127.0.0.1:8000 (docs at /docs)" -ForegroundColor Cyan
$backendJob = Start-Job -Name "backend" -ScriptBlock {
    param($py, $dir)
    Set-Location $dir
    & $py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
} -ArgumentList $backendPython, $backendDir

Write-Host "Starting frontend -> http://127.0.0.1:5500/index.html" -ForegroundColor Cyan
$frontendJob = Start-Job -Name "frontend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    python -m http.server 5500
} -ArgumentList $frontendDir

Write-Host ""
Write-Host "Both servers are starting. Press Ctrl+C to stop them." -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        Receive-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue 2>&1 | ForEach-Object { Write-Host $_ }
        if ($backendJob.State -in @("Failed", "Completed", "Stopped") -and $frontendJob.State -in @("Failed", "Completed", "Stopped")) {
            Write-Host "Both servers have stopped. See output above for details." -ForegroundColor Red
            break
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue | Out-Null
}
