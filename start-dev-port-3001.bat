@echo off
echo Starting Risk Management Application on Port 3001...
echo.
echo Port 3000 is already in use, using port 3001 instead
echo.
set PORT=3001
npm run dev
pause