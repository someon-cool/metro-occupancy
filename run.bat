@echo off
cd /d "%~dp0"
set PYTHONUNBUFFERED=1
echo Starting Metro Occupancy YOLO Detection System...
".venv\Scripts\python.exe" -u "edge\src\main.py"
pause
