@echo off
echo ========================================
echo   VELOCITY.IO - Starting Game...
echo ========================================
echo.

REM Kill any existing node/vite processes on ports 3000 and 5173
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING 2^>nul') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do taskkill /PID %%p /F >nul 2>&1

echo Starting Backend Server...
start "Velocity Server" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 2 /nobreak >nul

echo Starting Frontend Dev Server...
start "Velocity Frontend" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Game is ready at http://localhost:5173
echo   Open multiple tabs for multiplayer!
echo ========================================
start http://localhost:5173
