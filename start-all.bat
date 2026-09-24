@echo off
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0start-all.ps1" %*
pause
