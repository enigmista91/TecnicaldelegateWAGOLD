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
   - Assegnazione automatica delle **corsie preferenziali** (es. 3, 4, 5, 6 su piste a 6 corsie).
   - **Gestione corsie inagibili**: possibilità di specificare un sottoinsieme di corsie attive (es. `2,3,4,5,6` se la 1 è rotta) e ricalcolo automatico dell'algoritmo di assegnazione per privilegiare il centro.
4. **Seeding Automatico e Progressioni Concorsi (Regola TR 25 & TR 26.1)**
   - Algoritmo per **Random Draw** (sorteggio casuale consigliato per le qualificazioni).
   - Algoritmo a **Ordine Inverso** (i migliori SB saltano/lanciano per ultimi, ideale per le Finali).
   - **Validazione Progressioni (TR 26.1)** per Alto e Asta in tempo reale (incrementi di min 2cm/5cm senza mai aumentare).
5. **Calcolo del Timetable (Stima Durate)**
   - Stima automatica del **Timetable** per ogni gara in base agli iscritti, alle batterie necessarie e alla specialità (Velocità, Mezzofondo, Lanci, ecc.).
   - Ricalcolo dinamico della durata in base alle corsie attive o a modifiche manuali.
   - Tabella riassuntiva nella Home Page con il calcolo del tempo totale di svolgimento del meeting.
6. **Intervento Manuale e Persistenza**
    - Possibilità di spostare manualmente un atleta da una batteria all'altra tramite un pratico menu a tendina.
    - Tutte le serie generate e modificate vengono **salvate in cache (LocalStorage)** per non perdere i dati.
7. **Materiale per Giudici e Segreteria (Stampe)**
    - Fogli Gara formattati per i salti in estensione e lanci (3+3 prove).
    - Fogli Gara dinamici per Alto/Asta con griglia basata sulle progressioni inserite.
    - **Fogli Contagiri Cartacei** (800m-10000m) con griglia vuota per permettere ai giudici di segnare a penna i pettorali a ogni giro fino all'arrivo.
    - Integrazione diretta (pulsante) con la **Web App Contagiri Elettronico**.
    - Stampe pulite (i menu scompaiono automaticamente su carta).
7. **Controllo Scarpe (Regola TR 5)**
    - Strumento rapido integrato per consultare il database ufficiale *WA Shoe CertCheck*.
    - Riepilogo sempre aggiornato degli spessori massimi ammessi in pista e pedana.

## 🚀 Come Utilizzare il Progetto

### Primo Avvio (Installazione)
1. Assicurati di avere [Node.js](https://nodejs.org/it) installato sul tuo computer.
2. Fai doppio clic sul file **`Install_Requisiti.bat`**. Questo installerà automaticamente le librerie necessarie (Playwright) per far funzionare il programma. Questa operazione va fatta solo la prima volta.

### Utilizzo Quotidiano
1. Sul tuo Desktop o nella cartella del progetto, avvia il file **`Avvia Scraping FIDAL.bat`**.
2. Apparirà una finestra di dialogo. Incolla l'URL del meeting (va bene sia il link alla pagina degli iscritti `IndexPerGara.html`, sia il link generico del calendario). Il sistema normalizzerà l'URL **automaticamente**.
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

## 🤝 Contribuire
Le Pull Request (PR) sono ben accette e incoraggiate! Per mantenere l'ordine e la qualità del progetto, ti chiediamo di seguire queste due semplici regole:
1. Ogni Pull Request deve essere sempre corredata da una **Issue** aperta in precedenza, in modo da poterne discutere l'implementazione o segnalare il bug.
2. I merge delle PR verranno approvati ed effettuati **esclusivamente dal proprietario (owner)** del repository, dopo un'opportuna code review.

## ⚖️ Licenza e Disclaimer
Questo progetto è distribuito con licenza **[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/)**.

Puoi condividere e modificare il materiale, a patto di citare l'autore, non utilizzarlo per scopi commerciali e distribuire le modifiche con la stessa licenza.

*Questo software è un progetto non ufficiale, sviluppato esclusivamente come strumento di ausilio tecnico-decisionale. I dati prelevati pubblicamente dalla FIDAL restano proprietà intellettuale della Federazione (L. 633/1941) e non devono essere usati per scopi commerciali di terze parti o ripubblicazione non autorizzata.*
