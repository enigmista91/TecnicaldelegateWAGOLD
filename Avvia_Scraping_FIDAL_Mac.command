#!/bin/bash
cd "$(dirname "$0")"
clear
echo "========================================================"
echo "       WA GOLD - TECHNICAL DELEGATE DASHBOARD"
echo "              Aggiornamento Dati (Mac)"
echo "========================================================"
echo "Avvio del pannello di controllo..."

# Chiedi URL con AppleScript GUI (popup grafico nativo Mac)
URL=$(osascript -e 'Tell application "System Events" to display dialog "Inserisci il link (URL) della pagina iscritti o del calendario FIDAL:" default answer "" with title "WA Gold TD Dashboard" buttons {"Annulla", "Ok"} default button "Ok"' -e 'text returned of result' 2>/dev/null)

if [ -z "$URL" ]; then
    echo "Operazione annullata o nessun URL inserito. Uscita in corso..."
    sleep 2
    exit 1
fi

echo ""
echo "URL ricevuto: $URL"
echo "Connessione al portale FIDAL in corso (Playwright)..."
node scrape_main.js "$URL"

echo ""
echo "Generazione della nuova Dashboard HTML..."
node build_dashboard.js

echo ""
echo "Fatto! Apertura interfaccia nel browser..."
open td_dashboard.html

echo ""
echo "Puoi chiudere questa finestra."
sleep 3
