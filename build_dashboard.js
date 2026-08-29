const fs = require('fs');

const data = JSON.parse(fs.readFileSync('iscritti_meeting.json', 'utf8'));
let meetingInfo = { name: "WA Gold TD Dashboard" };
if (fs.existsSync('meeting_info.json')) {
    meetingInfo = JSON.parse(fs.readFileSync('meeting_info.json', 'utf8'));
}

const html = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${meetingInfo.name} - TD Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; padding-top: 20px; }
        .sidebar { background: #fff; padding: 20px; border-right: 1px solid #ddd; min-height: 100vh; }
        .race-card { cursor: pointer; transition: 0.2s; }
        .race-card:hover { background-color: #e9ecef; }
        .anomaly { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 sidebar d-print-none">
                <h4 class="text-primary fw-bold">🥇 TD Dashboard</h4>
                <p class="text-muted small">${meetingInfo.name}</p>
                <hr>
                <div class="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                    <button class="nav-link active text-start mb-2" onclick="showOverview()" type="button">Panoramica Meeting</button>
                    <div id="race-list"></div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="col-md-9 p-4" id="main-content">
                <!-- Content injected here -->
            </div>
        </div>
    </div>

    <script>
        const data = ${JSON.stringify(data)};
        
        function timeToSeconds(t) {
            if (!t) return 999999;
            t = t.trim();
            if (t.includes(':')) {
                const parts = t.split(':');
                return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
            }
            return parseFloat(t) || 999999;
        }

        function isFieldEvent(name) {
            const lower = name.toLowerCase();
            return ['salto', 'lungo', 'alto', 'asta', 'triplo', 'peso', 'disco', 'martello', 'giavellotto', 'vortex'].some(k => lower.includes(k));
        }
        
        function isMiddleDistance(name) {
            const lower = name.toLowerCase();
            return ['600', '800', '1000', '1200', '1500', '2000', '3000', '5000', '10000', 'siepi', 'marcia'].some(k => lower.includes(k));
        }

        function getLaps(name) {
            const lower = name.toLowerCase();
            if (lower.includes('600')) return 2;
            if (lower.includes('800')) return 2;
            if (lower.includes('1000')) return 3;
            if (lower.includes('1200')) return 3;
            if (lower.includes('1500')) return 4;
            if (lower.includes('2000')) return 5;
            if (lower.includes('3000')) return 8;
            if (lower.includes('siepi')) return 8;
            if (lower.includes('5000')) return 13;
            if (lower.includes('10000')) return 25;
            if (lower.includes('marcia 5')) return 13;
            if (lower.includes('marcia 10')) return 25;
            return 15;
        }

        function initSidebar() {
            const list = document.getElementById('race-list');
            const groups = { 'Corse': [], 'Salti': [], 'Lanci': [] };
            
            data.forEach((race, index) => {
                const lower = race.nome_gara.toLowerCase();
                let cat = 'Corse';
                if (['salto', 'lungo', 'alto', 'asta', 'triplo'].some(k => lower.includes(k))) cat = 'Salti';
                else if (['peso', 'disco', 'martello', 'giavellotto', 'vortex'].some(k => lower.includes(k))) cat = 'Lanci';
                groups[cat].push({race, index});
            });
            
            for (const [groupName, races] of Object.entries(groups)) {
                if (races.length === 0) continue;
                
                const header = document.createElement('h6');
                header.className = 'mt-3 mb-2 text-primary fw-bold border-bottom pb-1';
                header.textContent = groupName;
                list.appendChild(header);
                
                races.forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'nav-link text-start mb-1 btn btn-sm w-100 text-truncate';
                    btn.style.fontSize = '0.85rem';
                    btn.textContent = item.race.nome_gara;
                    btn.onclick = () => showRace(item.index, btn);
                    list.appendChild(btn);
                });
            }
            
            const toolsHeader = document.createElement('h6');
            toolsHeader.className = 'mt-4 mb-2 text-primary fw-bold border-bottom pb-1';
            toolsHeader.textContent = 'Strumenti TD';
            list.appendChild(toolsHeader);
            
            const shoeBtn = document.createElement('button');
            shoeBtn.className = 'nav-link text-start mb-1 btn btn-sm w-100 text-truncate text-success fw-bold';
            shoeBtn.innerHTML = '👟 Controllo Scarpe';
            shoeBtn.onclick = () => showShoeControl(shoeBtn);
            list.appendChild(shoeBtn);
        }

        function showOverview() {
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            document.querySelector('.nav-link').classList.add('active'); // The first one
            
            let total = 0;
            let anomaliesCount = 0;
            let html = \`<h2>Panoramica Generale Meeting</h2><hr>\`;
            
            let table = \`<table class="table table-striped mt-4">
                <thead class="table-dark"><tr><th>Gara</th><th>Iscritti</th><th>Tipo</th><th>Anomalie (No SB)</th></tr></thead><tbody>\`;
                
            data.forEach(r => {
                total += r.numero_iscritti;
                const field = isFieldEvent(r.nome_gara);
                const anomalies = r.iscritti.filter(i => !i.accredito.trim()).length;
                if (anomalies > 0) anomaliesCount++;
                
                table += \`<tr>
                    <td>\${r.nome_gara}</td>
                    <td>\${r.numero_iscritti}</td>
                    <td>\${field ? 'Concorsi' : 'Corse'}</td>
                    <td class="\${anomalies > 0 ? 'anomaly' : ''}">\${anomalies}</td>
                </tr>\`;
            });
            table += \`</tbody></table>\`;
            
            html += \`<div class="row mb-4">
                <div class="col-md-4"><div class="card bg-primary text-white"><div class="card-body"><h4>Totale Gare</h4><h2>\${data.length}</h2></div></div></div>
                <div class="col-md-4"><div class="card bg-success text-white"><div class="card-body"><h4>Totale Atleti</h4><h2>\${total}</h2></div></div></div>
                <div class="col-md-4"><div class="card \${anomaliesCount>0?'bg-danger':'bg-info'} text-white"><div class="card-body"><h4>Gare con Anomalie</h4><h2>\${anomaliesCount}</h2></div></div></div>
            </div>\`;
            
            if (anomaliesCount > 0) {
                html += \`<div class="alert alert-warning"><strong>Attenzione:</strong> Alcune gare hanno atleti senza accredito. Verranno considerati "No Time / No Mark" in fase di sorteggio/composizione.</div>\`;
            }
            
            html += table;
            document.getElementById('main-content').innerHTML = html;
        }

        function showShoeControl(btn) {
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            if(btn) btn.classList.add('active');
            
            let html = \`
            <h2>👟 Controllo Scarpe (Shoe Compliance TR 5)</h2>
            <hr>
            <div class="row">
                <div class="col-md-7">
                    <div class="card mb-4 border-success shadow-sm">
                        <div class="card-header bg-success text-white fw-bold">
                            Portale Ufficiale World Athletics
                        </div>
                        <div class="card-body">
                            <p>Utilizza il database ufficiale di World Athletics per verificare istantaneamente se il modello di scarpa utilizzato dall'atleta è approvato per la competizione.</p>
                            <a href="https://certcheck.worldathletics.org/" target="_blank" class="btn btn-lg btn-success w-100 mb-3 fw-bold shadow">
                                🔍 Apri WA Shoe CertCheck
                            </a>
                            <p class="text-muted small mb-0">Il portale WA si aprirà in una nuova scheda sicura del browser, permettendoti di effettuare la verifica in tempo reale direttamente dal campo o in Call Room.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card border-info shadow-sm">
                        <div class="card-header bg-info text-white fw-bold">
                            Regole Spessori (Sintesi TR 5)
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush small">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <strong>Gare su Pista (tutte)</strong>
                                    <span class="badge bg-primary rounded-pill">Max 20 mm</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <strong>Salto Triplo</strong>
                                    <span class="badge bg-primary rounded-pill">Max 25 mm</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <strong>Altri Concorsi (Lungo, Alto, Asta)</strong>
                                    <span class="badge bg-primary rounded-pill">Max 20 mm</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <strong>Strada e Cross</strong>
                                    <span class="badge bg-primary rounded-pill">Max 40 mm</span>
                                </li>
                            </ul>
                            <div class="p-2 bg-light border-top">
                                <small class="text-muted"><i class="fw-bold text-warning">Nota:</i> Dal 1 Novembre 2024 è in vigore la regola armonizzata a 20mm per tutte le gare su pista (velocità e mezzofondo).</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mt-2 shadow-sm border-secondary">
                <div class="card-header bg-secondary text-white fw-bold">
                    Anteprima Database WA (Se supportato dal browser)
                </div>
                <div class="card-body p-0 bg-light" style="min-height: 500px">
                    <iframe src="https://certcheck.worldathletics.org/" width="100%" height="600px" style="border:none;"></iframe>
                </div>
            </div>
            \`;
            
            document.getElementById('main-content').innerHTML = html;
        }

        function showRace(index, btn) {
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const race = data[index];
            const field = isFieldEvent(race.nome_gara);
            const middleDist = isMiddleDistance(race.nome_gara);
            
            let html = \`<h2>\${race.nome_gara}</h2><hr>\`;
            
            if (race.numero_iscritti === 0) {
                html += \`<div class="alert alert-info">Nessun iscritto a questa gara.</div>\`;
                document.getElementById('main-content').innerHTML = html;
                return;
            }

            if (field) {
                html += \`
                <div class="card p-3 mb-4 d-print-none">
                    <h5>Impostazioni Pedana (WA TR 25)</h5>
                    <div class="mb-3">
                        <label class="form-label">Criterio Ordine di Partenza:</label>
                        <select id="field-order-\${index}" class="form-select">
                            <option value="inverse">Ordine Inverso di Accredito (Consigliato Finali)</option>
                            <option value="random">Ordine Casuale (Consigliato Qualificazioni)</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="generateField(\${index})">Genera Start List</button>
                </div>
                <div id="results-\${index}"></div>
                \`;
            } else {
                html += \`
                <div class="card p-3 mb-4 d-print-none">
                    <h5>Impostazioni Batterie/Serie (WA TR 20)</h5>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Corsie disponibili / Max per serie:</label>
                            <input type="number" id="lanes-\${index}" class="form-control" value="\${middleDist ? 12 : 6}">
                            <small class="text-muted">\${middleDist ? 'Massimo consigliato per mezzofondo: 12-15' : 'Es. 6 o 8 corsie per la velocità'}</small>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="generateTrack(\${index}, \${middleDist})">Genera Serie (Zig-Zag)</button>
                </div>
                <div id="results-\${index}"></div>
                \`;
            }
            
            document.getElementById('main-content').innerHTML = html;
            
            const cached = localStorage.getItem('race_' + index);
            if (cached) {
                document.getElementById(\`results-\${index}\`).innerHTML = cached + \`<div class="alert alert-secondary mt-2 small d-print-none">💾 Risultati recuperati dalla memoria locale. Se modifichi le impostazioni, clicca nuovamente su "Genera" per sovrascrivere.</div>\`;
            }
        }

        function generateField(index) {
            const race = data[index];
            const method = document.getElementById(\`field-order-\${index}\`).value;
            const lower = race.nome_gara.toLowerCase();
            const isVertical = lower.includes('alto') || lower.includes('asta');
            
            let iscritti = [...race.iscritti].map(i => ({...i, val: parseFloat(i.accredito) || -1}));
            
            if (method === 'inverse') {
                iscritti.sort((a, b) => a.val - b.val); // lowest to highest (highest jumps last)
            } else {
                iscritti.sort(() => Math.random() - 0.5);
            }
            
            let html = \`<div class="d-flex justify-content-between align-items-center mb-2 d-print-none">
                <h4>Foglio Gara (Start List)</h4>
                <button class="btn btn-outline-secondary btn-sm" onclick="window.print()">🖨 Stampa</button>
            </div>
            <table class="table table-bordered table-sm" style="font-size: 0.85rem;">
                <thead class="table-light">\`;
                
            if (isVertical) {
                html += \`<tr><th width="5%">Ord</th><th width="5%">Pett</th><th width="20%">Atleta</th><th width="15%">Società</th><th width="5%">SB</th>
                <th width="5%"></th><th width="5%"></th><th width="5%"></th><th width="5%"></th><th width="5%"></th><th width="5%"></th><th width="5%"></th><th width="5%"></th>
                <th width="5%">Mis.</th><th width="5%">Pos</th></tr></thead><tbody>\`;
            } else {
                html += \`<tr><th width="5%">Ord</th><th width="5%">Pett</th><th width="20%">Atleta</th><th width="15%">Società</th><th width="5%">SB</th>
                <th width="7%">1°</th><th width="7%">2°</th><th width="7%">3°</th><th width="7%">4°</th><th width="7%">5°</th><th width="7%">6°</th>
                <th width="5%">Mis.</th><th width="5%">Pos</th></tr></thead><tbody>\`;
            }
            
            iscritti.forEach((a, i) => {
                const athleteName = a.fidal_link ? \`<a href="\${a.fidal_link}" target="_blank" class="text-decoration-none text-dark fw-bold">\${a.nominativo}</a>\` : \`<span class="fw-bold">\${a.nominativo}</span>\`;
                html += \`<tr><td>\${i+1}</td><td>\${a.pettorale}</td><td>\${athleteName}</td><td><small>\${a.societa.substring(0,20)}</small></td><td>\${a.accredito}</td>\`;
                
                if (isVertical) {
                    html += \`<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>\`;
                } else {
                    html += \`<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>\`;
                }
            });
            html += \`</tbody></table>\`;
            
            document.getElementById(\`results-\${index}\`).innerHTML = html;
            localStorage.setItem('race_' + index, html);
        }

        function generateTrack(index, isMiddle) {
            const race = data[index];
            const maxLanes = parseInt(document.getElementById(\`lanes-\${index}\`).value) || 6;
            
            let iscritti = [...race.iscritti].map(i => ({...i, val: timeToSeconds(i.accredito)}));
            iscritti.sort((a, b) => a.val - b.val); // fastest first
            
            const total = iscritti.length;
            const heatsCount = Math.ceil(total / maxLanes);
            
            const heats = Array.from({length: heatsCount}, () => []);
            let dir = 1;
            let current = 0;
            
            // Zig zag distribution
            iscritti.forEach(a => {
                heats[current].push(a);
                if (dir === 1) {
                    if (current < heatsCount - 1) current++;
                    else dir = -1;
                } else {
                    if (current > 0) current--;
                    else dir = 1;
                }
            });
            
            const raceData = { heats, isMiddle, maxLanes };
            localStorage.setItem('race_data_' + index, JSON.stringify(raceData));
            
            renderTrackHeats(index);
        }

        function moveAthlete(index, fromHeat, pettorale, toHeatSelect) {
            const toHeat = parseInt(toHeatSelect.value);
            if (fromHeat === toHeat) return;
            
            let raceData = JSON.parse(localStorage.getItem('race_data_' + index));
            let heats = raceData.heats;
            
            // Find athlete
            let athleteIndex = heats[fromHeat].findIndex(a => a.pettorale === pettorale);
            if (athleteIndex > -1) {
                const athlete = heats[fromHeat].splice(athleteIndex, 1)[0];
                heats[toHeat].push(athlete);
                
                localStorage.setItem('race_data_' + index, JSON.stringify(raceData));
                renderTrackHeats(index);
            }
        }

        function renderTrackHeats(index) {
            const race = data[index];
            const raceDataStr = localStorage.getItem('race_data_' + index);
            if (!raceDataStr) return;
            
            const raceData = JSON.parse(raceDataStr);
            const heats = raceData.heats;
            const isMiddle = raceData.isMiddle;
            const maxLanes = raceData.maxLanes;
            const heatsCount = heats.length;
            
            let html = \`<div class="d-flex justify-content-between align-items-center mb-2 d-print-none">
                <h4>Composizione Serie (\${heatsCount} Serie Generate)</h4>
                <button class="btn btn-outline-secondary btn-sm" onclick="window.print()">🖨 Stampa</button>
            </div>\`;
            
            // Preferred lanes for standard sprint
            const pref6 = [3, 4, 5, 6, 2, 1];
            const pref8 = [4, 5, 3, 6, 2, 7, 1, 8];
            const pref = maxLanes === 6 ? pref6 : (maxLanes === 8 ? pref8 : Array.from({length: maxLanes}, (_,i)=>i+1));
            
            heats.forEach((h, i) => {
                html += \`<div class="mt-4" style="page-break-inside: avoid;">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5>Serie \${i+1}</h5>
                    </div>
                    <table class="table table-bordered table-sm">
                    <thead class="table-light"><tr><th>\${isMiddle ? 'Pos' : 'Corsia'}</th><th>Pett</th><th>Atleta</th><th>Società</th><th>SB</th><th width="15%">Risultato</th><th width="5%">Pos</th><th class="d-print-none" width="10%">Sposta</th></tr></thead><tbody>\`;
                
                if (!isMiddle) {
                    // Assign lanes
                    h.forEach((a, j) => {
                        a.lane = pref[j] || '-';
                    });
                    h.sort((a,b) => (a.lane === '-' ? 99 : a.lane) - (b.lane === '-' ? 99 : b.lane));
                } else {
                    h.forEach((a, j) => {
                        a.lane = j + 1;
                    });
                }
                
                h.forEach(a => {
                    const athleteName = a.fidal_link ? \`<a href="\${a.fidal_link}" target="_blank" class="text-decoration-none text-dark fw-bold">\${a.nominativo}</a>\` : \`<span class="fw-bold">\${a.nominativo}</span>\`;
                    
                    // Heat selector
                    let selectHtml = \`<select class="form-select form-select-sm" onchange="moveAthlete(\${index}, \${i}, '\${a.pettorale}', this)">\`;
                    for(let x=0; x<heatsCount; x++) {
                        selectHtml += \`<option value="\${x}" \${x===i ? 'selected' : ''}>S \${x+1}</option>\`;
                    }
                    selectHtml += \`</select>\`;
                    
                    html += \`<tr><td><strong>\${a.lane}</strong></td><td>\${a.pettorale}</td><td>\${athleteName}</td><td><small>\${a.societa.substring(0,20)}</small></td><td>\${a.accredito}</td><td></td><td></td><td class="d-print-none">\${selectHtml}</td></tr>\`;
                });
                
                html += \`</tbody></table></div>\`;
            });
            
            if (isMiddle) {
                const numLaps = getLaps(race.nome_gara);
                html += \`<div style="page-break-before: always;" class="mt-5"></div>
                <div class="d-flex justify-content-between align-items-center mb-2 d-print-none">
                    <h4 class="mt-4 text-primary">Foglio Contagiri (\${race.nome_gara})</h4>
                    <button class="btn btn-outline-primary btn-sm mt-4" onclick="window.print()">🖨 Stampa Contagiri</button>
                </div>
                <h4 class="mt-4 d-none d-print-block">Foglio Contagiri - \${race.nome_gara}</h4>
                \`;
                
                heats.forEach((h, i) => {
                    if (h.length === 0) return;
                    html += \`<div class="mt-4" style="page-break-inside: avoid;">
                        <h5>Contagiri - Serie \${i+1}</h5>
                        <table class="table table-bordered table-sm text-center" style="font-size: 0.8rem;">
                        <thead class="table-light"><tr><th width="5%">Pett</th><th width="15%">Atleta</th>\`;
                    for(let lap=numLaps; lap>=1; lap--) {
                        html += \`<th>-\${lap}</th>\`;
                    }
                    html += \`</tr></thead><tbody>\`;
                    
                    h.forEach(a => {
                        html += \`<tr><td><strong>\${a.pettorale}</strong></td><td class="text-start text-truncate" style="max-width: 150px;">\${a.nominativo}</td>\`;
                        for(let lap=1; lap<=numLaps; lap++) {
                            html += \`<td></td>\`;
                        }
                        html += \`</tr>\`;
                    });
                    
                    html += \`</tbody></table></div>\`;
                });
            }
            
            document.getElementById(\`results-\${index}\`).innerHTML = html;
            localStorage.setItem('race_' + index, html);
        }

        // Init
        initSidebar();
        showOverview();
    </script>
</body>
</html>
`;

fs.writeFileSync('td_dashboard.html', html);
console.log('Dashboard created successfully: td_dashboard.html');
