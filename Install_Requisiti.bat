@echo off
title Installazione Requisiti - WA Gold TD Dashboard
color 0A

echo ========================================================
echo        WA GOLD - TECHNICAL DELEGATE DASHBOARD
echo             Installazione dei requisiti
echo ========================================================
echo.
echo Prima di continuare, assicurati di aver installato Node.js
echo Puoi scaricarlo da: https://nodejs.org/it
echo.
pause

echo.
echo Installazione delle librerie (Playwright) in corso...
call npm install

echo.
echo Requisiti installati con successo!
echo Ora puoi avviare l'applicazione facendo doppio clic su:
echo "Avvia Scraping FIDAL.bat"
echo.
pause
