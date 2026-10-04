Set-Location -Path $PSScriptRoot
$env:PYTHONUNBUFFERED = "1"
Write-Host "Starting Metro Occupancy YOLO Detection System..." -ForegroundColor Cyan
& "$PSScriptRoot\.venv\Scripts\python.exe" -u "$PSScriptRoot\edge\src\main.py"
