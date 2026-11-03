@echo off
rem Doppelklick startet den Projektraum. Fehlendes wird beim ersten Start automatisch eingerichtet.
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js ist nicht installiert. Bitte die LTS-Version von https://nodejs.org installieren und danach erneut starten.
  pause
  exit /b 1
)
node scripts\start.mjs
pause
