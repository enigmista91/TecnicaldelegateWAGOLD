# 🥇 WA Gold - Technical Delegate Dashboard

Un'applicazione locale stand-alone progettata per supportare i Delegati Tecnici di atletica leggera (livello World Athletics Gold) nella gestione delle competizioni, nell'applicazione del Regolamento Tecnico (TR 20 e TR 25) e nella creazione ottimizzata delle Start List.

## ✨ Funzionalità Principali

1. **Estrazione Dati (Scraping)** 
   Estrazione automatica degli iscritti da qualsiasi pagina indice di un meeting FIDAL. Nessun inserimento manuale richiesto!
2. **Supporto Decisionale Offline**
   La dashboard HTML generata è completamente nativa, stand-alone e *client-side*, permettendo al TD di prendere decisioni anche sul campo senza connessione a internet.
3. **Seeding Automatico Corse (Regola TR 20)**
   - Composizione del numero esatto di batterie (Heats) basato sulle corsie a disposizione.
   - Distribuzione degli atleti a "Zig-Zag" in base al Season Best (SB).
   - Assegnazione automatica delle **corsie preferenziali** (es. 3, 4, 5, 6 su piste a 6 corsie) alle teste di serie della relativa batteria.
4. **Seeding Automatico Concorsi (Regola TR 25)**
   - Algoritmo per **Random Draw** (sorteggio casuale consigliato per le qualificazioni).
   - Algoritmo a **Ordine Inverso** (i migliori SB saltano/lanciano per ultimi, ideale per le Finali).

## 🚀 Come Utilizzare il Progetto

1. Sul tuo Desktop o nella cartella del progetto, avvia il file **`Avvia Scraping FIDAL.bat`**.
2. Apparirà una finestra di dialogo grafica. Incolla l'URL della pagina `IndexPerGara.html` del meeting FIDAL che vuoi gestire. Se lasci vuoto, aggiornerà l'ultimo meeting in memoria.
3. Lo script aprirà Microsoft Edge in background per scaricare i dati aggiornati in pochi secondi.
4. Al termine, si aprirà istantaneamente la **TD Dashboard** nel tuo browser.

## 📸 Anteprima e Interfaccia (Dati Anonimizzati)

### 1. Panoramica del Meeting
Una vista immediata sui numeri del meeting per capire subito quante gare hanno atleti sprovvisti di Season Best (No Time / No Mark).
![Overview](assets/overview.png)

### 2. Gestione Corse e Velocità
Selezionando una gara su pista dal menu laterale, è possibile indicare le corsie dell'impianto per generare le Starting List perfette per la Call Room.
![Track Events](assets/track.png)

### 3. Gestione Concorsi (Salti e Lanci)
Possibilità di gestire l'ordine di partenza (pedana) con un semplice clic.
![Field Events](assets/field.png)

## 🛠 Requisiti Tecnici
- Sistema Operativo Windows
- Node.js installato
- Browser Chromium/Microsoft Edge 

## ⚖️ Note Legali e Disclaimer
Questo software è un progetto non ufficiale, sviluppato esclusivamente come strumento di ausilio tecnico-decisionale. I dati prelevati pubblicamente dalla FIDAL restano proprietà intellettuale della Federazione (L. 633/1941) e non devono essere usati per scopi commerciali di terze parti o ripubblicazione non autorizzata.
