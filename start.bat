@echo off
REM In das Verzeichnis der Batch-Datei wechseln
pushd "%~dp0"

REM Development-Server starten
call npm run tauri dev

REM Fenster offen halten, bis eine Taste gedrückt wird
pause

REM Zurück ins vorherige Verzeichnis
popd
