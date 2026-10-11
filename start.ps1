$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path '.venv/Scripts/python.exe')) {
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'Python virtual environment creation failed. Install Python 3.11 or newer with pip.' }
}
& ./.venv/Scripts/python.exe -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { throw 'Dependencies could not be installed. Check your internet connection.' }
Write-Host 'Open http://127.0.0.1:8000 to enter your study space.'
& ./.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
