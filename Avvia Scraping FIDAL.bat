@echo off
title WA Gold TD Dashboard - Aggiornamento Dati
echo Avvio del pannello di controllo...
cd /d "%~dp0"

for /f "delims=" %%I in ('cscript //nologo PromptURL.vbs') do set "URL=%%I"

if "%URL%"=="" (
    echo Nessun URL inserito. Uscita in corso...
    timeout /t 2 >nul
    exit /b
)

echo.
echo Connessione al portale FIDAL in corso (Playwright)...
node scrape_main.js "%URL%"
echo.
echo Generazione della nuova Dashboard HTML...
node build_dashboard.js
echo.
echo Fatto! Avvio interfaccia...
start td_dashboard.html
