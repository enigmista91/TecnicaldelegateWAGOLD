@echo off
title WA Gold TD Dashboard - Aggiornamento Dati
echo Avvio del pannello di controllo...
cd /d "c:\Users\matte\Desktop\analisi meeting"

for /f "delims=" %%I in ('cscript //nologo PromptURL.vbs') do set "URL=%%I"

echo.
echo Connessione al portale FIDAL in corso (Playwright)...
node scrape_main.js "%URL%"
echo.
echo Generazione della nuova Dashboard HTML...
node build_dashboard.js
echo.
echo Fatto! Avvio interfaccia...
start td_dashboard.html
