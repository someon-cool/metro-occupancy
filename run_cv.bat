@echo off
echo ========================================================
echo   Starting Metro CV Pipeline on metro_video.mp4
echo   Primary: Visible In-Frame Count
echo   Secondary: Virtual Line Net-Flow Reference
echo.
echo   Press 'q' in the video window to quit at any time.
echo ========================================================
echo.
cd /d "%~dp0edge\src"
"%~dp0edge\src\.venv\Scripts\python.exe" main.py
echo.
pause
