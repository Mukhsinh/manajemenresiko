@echo off
echo Starting Risk Management Application...
echo.
echo Checking for available ports...

REM Try different ports starting from 3001
set PORT=3001
node server.js

REM If that fails, the server will automatically find the next available port
pause