@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing Callboard...
  call npm.cmd install
)
echo.
echo Callboard — http://localhost:3200
echo Demo artist: nova@callboard.app / callboard
echo Admin: /admin  password callboard
echo.
call npm.cmd run dev
