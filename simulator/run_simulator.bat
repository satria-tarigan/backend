@echo off
echo Starting Machine Data Streaming Simulator...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.

REM Check if backend is running
echo Checking backend connection...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: Backend server is not running on http://localhost:3000
    echo Please start the backend server first:
    echo   cd ..\src
    echo   npm run dev
    echo.
    echo Do you want to continue anyway? (y/n)
    set /p continue=
    if /i not "%continue%"=="y" exit /b 1
)

echo Starting simulator...
echo Press Ctrl+C to stop
echo.

REM Run simulator
python machine_simulator.py

echo.
echo Simulator stopped.
pause