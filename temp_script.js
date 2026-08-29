// 1. Database Setup
        const db = new Dexie('WAGoldDatabase');
        db.version(1).stores({
            meetings: 'id, name, date, data, resultsUrl',
            notes: 'meetingId',
            races: 'id, meetingId, name, scheduledTime, isCompleted'
        });

        // Global State
        let currentMeeting = null;
        let activeRaceIndex = null;
        let callRoomTimer = null;

        /* __INJECT_MEETING__ */

        // 2. Initialization
        async function init() {
            if (window.__INJECTED_MEETING__) {
                const m = window.__INJECTED_MEETING__;
                let mId = "default";
                let rUrl = "";
                if (m.info && m.info.url) {
                    const match = m.info.url.match(/(REG\d+|COD\d+)/i);
                    if (match) mId = match[0].toUpperCase();
                    rUrl = m.info.url.replace('/Iscrizioni/IndexPerGara.html', '/Risultati/IndexRisultatiPerGara.html');
                }
                
                await db.meetings.put({
                    id: mId,
                    name: m.info ? m.info.name : "Meeting Senza Nome",
                    date: new Date().toISOString(),
                    data: m.races,
                    resultsUrl: rUrl
                });
                
                // Also init races
                for (const race of m.races) {
                    const raceId = mId + '_' + race.nome_gara;
                    const existing = await db.races.get(raceId);
                    if (!existing) {
                        await db.races.put({
                            id: raceId,
                            meetingId: mId,
                            name: race.nome_gara,
                            scheduledTime: '',
                            isCompleted: 0
                        });
                    }
                }
            }
            
            await loadMeetingList();
        }

        async function loadMeetingList() {
            const meetings = await db.meetings.toArray();
            const sel = document.getElementById('meeting-selector');
            sel.innerHTML = '';
            
            if (meetings.length === 0) {
                sel.innerHTML = '<option>Nessun meeting caricato</option>';
                document.getElementById('main-content').innerHTML = '<div class="alert alert-info mt-4">Genera un meeting usando lo script di scraping per iniziare.</div>';
                return;
            }
            
            // Sort by date desc
            meetings.sort((a,b) => new Date(b.date) - new Date(a.date));
            
            meetings.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name;
                sel.appendChild(opt);
            });
            
            // If injected, select it
            if (window.__INJECTED_MEETING__) {
                const url = window.__INJECTED_MEETING__.info.url || "";
                const match = url.match(/(REG\d+|COD\d+)/i);
                if (match) {
                    sel.value = match[0].toUpperCase();
                } else {
                    // Fallback to "default" if no code is found
                    sel.value = "default";
                }
            }
            
            await switchMeeting();
        }

        async function switchMeeting() {
            const sel = document.getElementById('meeting-selector');
            if (!sel.value) return;
            
            currentMeeting = await db.meetings.get(sel.value);
            buildSidebar();
            showOverview();
        }

        // Helpers
        function isFieldEvent(name) {
            const lower = name.toLowerCase();
            return ['salto', 'lungo', 'alto', 'asta', 'triplo', 'peso', 'disco', 'martello', 'giavellotto', 'vortex'].some(k => lower.includes(k));
        }
        function isMiddleDistance(name) {
            const lower = name.toLowerCase();
            return ['800', '1000', '1500', 'miglio', '2000', '3000', 'siepi', '5000', '10000', 'marcia'].some(k => lower.includes(k));
        }
        function estimateDuration(nomeGara, iscrittiCount, isMiddle, heatsCount) {
            const lower = nomeGara.toLowerCase();
            if (isFieldEvent(nomeGara)) {
                if (lower.includes('asta')) return iscrittiCount * 3 + 15;
                if (lower.includes('alto')) return iscrittiCount * 2 + 10;
                return Math.ceil(iscrittiCount * 1.5) + 15;
            }
            let assumedHeats = heatsCount || Math.ceil(iscrittiCount / (isMiddle ? 12 : 6));
            if (lower.includes('10000') || lower.includes('marcia 10')) return assumedHeats * 40;
            if (lower.includes('5000') || lower.includes('marcia 5')) return assumedHeats * 22;
            if (lower.includes('3000') || lower.includes('siepi')) return assumedHeats * 15;
            if (lower.includes('1500') || lower.includes('miglio')) return assumedHeats * 8;
            if (lower.includes('800') || lower.includes('1000')) return assumedHeats * 6;
            if (lower.includes('400')) return assumedHeats * 5;
            return assumedHeats * 4;
        }

        // Sidebar
        function buildSidebar() {
            const list = document.getElementById('race-list');
            list.innerHTML = '';
            
            const groups = { 'Corse': [], 'Salti': [], 'Lanci': [] };
            currentMeeting.data.forEach((race, index) => {
                let cat = 'Corse';
                if (isFieldEvent(race.nome_gara)) {
                    cat = ['peso', 'disco', 'martello', 'giavellotto', 'vortex'].some(k => race.nome_gara.toLowerCase().includes(k)) ? 'Lanci' : 'Salti';
                }
                groups[cat].push({race, index});
            });
            
            for (const [groupName, races] of Object.entries(groups)) {
                if (races.length === 0) continue;
                const header = document.createElement('h6');
                header.className = 'mt-3 mb-2 text-warning fw-bold border-bottom pb-1';
                header.textContent = groupName;
                list.appendChild(header);
                
                races.forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'nav-link text-start mb-1 btn btn-sm w-100 text-truncate race-btn';
                    btn.style.fontSize = '0.85rem';
                    btn.textContent = item.race.nome_gara;
                    btn.onclick = () => showRace(item.index, btn);
                    list.appendChild(btn);
                });
            }
        }
        
        function clearActiveNav() {
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            if(callRoomTimer) clearInterval(callRoomTimer);
        }

        // Views
        function showOverview() {
            clearActiveNav();
            document.querySelectorAll('#nav-general .nav-link')[0].classList.add('active');
            
            let total = 0, anomaliesCount = 0, totalDurationMins = 0;
            let table = `<table class="table table-striped mt-4"><thead class="table-dark"><tr><th>Gara</th><th>Iscritti</th><th>Tipo</th><th>Stima Durata</th><th>Anomalie (No SB)</th></tr></thead><tbody>`;
            
            currentMeeting.data.forEach(r => {
                total += r.numero_iscritti;
                const field = isFieldEvent(r.nome_gara);
                const isMiddle = isMiddleDistance(r.nome_gara);
                const duration = estimateDuration(r.nome_gara, r.numero_iscritti, isMiddle, null);
                totalDurationMins += duration;
                const anomalies = r.iscritti.filter(i => !i.accredito.trim()).length;
                if (anomalies > 0) anomaliesCount++;
                
                table += `<tr>
                    <td>${r.nome_gara}</td><td>${r.numero_iscritti}</td><td>${field ? 'Concorsi' : 'Corse'}</td>
                    <td>${Math.round(duration)} min</td><td class="${anomalies > 0 ? 'anomaly' : ''}">${anomalies}</td>
                </tr>`;
            });
            table += `</tbody></table>`;
            
            const hours = Math.floor(totalDurationMins / 60);
            const mins = Math.round(totalDurationMins % 60);
            
            document.getElementById('main-content').innerHTML = `
                <h2>${currentMeeting.name} - Panoramica</h2><hr>
                <div class="row mb-4">
                    <div class="col-md-3"><div class="card bg-primary text-white"><div class="card-body"><h4>Totale Gare</h4><h2>${currentMeeting.data.length}</h2></div></div></div>
                    <div class="col-md-3"><div class="card bg-success text-white"><div class="card-body"><h4>Totale Atleti</h4><h2>${total}</h2></div></div></div>
                    <div class="col-md-3"><div class="card bg-info text-white"><div class="card-body"><h4>Stima Durata Tot.</h4><h2>${hours}h ${mins}m</h2></div></div></div>
                    <div class="col-md-3"><div class="card ${anomaliesCount>0?'bg-danger':'bg-secondary'} text-white"><div class="card-body"><h4>Gare con Anomalie</h4><h2>${anomaliesCount}</h2></div></div></div>
                </div>
                ${anomaliesCount > 0 ? '<div class="alert alert-warning"><strong>Attenzione:</strong> Alcune gare hanno atleti senza accredito (No Time / No Mark).</div>' : ''}
                ${table}
            `;
        }

        async function showNotes() {
            clearActiveNav();
            document.querySelectorAll('#nav-general .nav-link')[2].classList.add('active');
            
            const noteData = await db.notes.get(currentMeeting.id) || { meetingId: currentMeeting.id, text: '', orgChart: '', radioPlan: '', contactsOrg: '', contactsMed: '' };
            
            document.getElementById('main-content').innerHTML = `
                <h2>Appunti, Organigramma & Contatti</h2><hr>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Appunti e Decisioni del Delegato Tecnico</label>
                        <textarea id="td-notes" class="form-control" rows="8" placeholder="Scrivi qui gli appunti...">${noteData.text || ''}</textarea>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Organigramma e Giurie</label>
                        <textarea id="td-org" class="form-control" rows="8" placeholder="Es. Arbitro Pista: Mario Rossi...">${noteData.orgChart || ''}</textarea>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label fw-bold text-danger">Contatti Medico di Servizio</label>
                        <textarea id="td-med" class="form-control" rows="3" placeholder="Nome Medico e Telefono...">${noteData.contactsMed || ''}</textarea>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label fw-bold text-primary">Contatti Organizzatore</label>
                        <textarea id="td-org-contacts" class="form-control" rows="3" placeholder="Nome Organizzatore e Telefono...">${noteData.contactsOrg || ''}</textarea>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label fw-bold">Piano Radio e Comunicazioni</label>
                        <textarea id="td-radio" class="form-control" rows="3" placeholder="Es. CH 1: Direttore di Gara...">${noteData.radioPlan || ''}</textarea>
                    </div>
                </div>
                <button class="btn btn-success" onclick="saveNotes()">💾 Salva Modifiche</button>
                <span id="note-save-feedback" class="ms-3 text-success d-none">Salvato!</span>
            `;
        }

        window.saveNotes = async function() {
            await db.notes.put({
                meetingId: currentMeeting.id,
                text: document.getElementById('td-notes').value,
                orgChart: document.getElementById('td-org').value,
                radioPlan: document.getElementById('td-radio').value,
                contactsOrg: document.getElementById('td-org-contacts').value,
                contactsMed: document.getElementById('td-med').value
            });
            const fb = document.getElementById('note-save-feedback');
            fb.classList.remove('d-none');
            setTimeout(() => fb.classList.add('d-none'), 2000);
        }

        async function showCallRoom() {
            clearActiveNav();
            document.querySelectorAll('#nav-general .nav-link')[1].classList.add('active');
            
            const cr1 = localStorage.getItem('cr1_offset') || 30;
            const cr2 = localStorage.getItem('cr2_offset') || 20;
            const track = localStorage.getItem('track_offset') || 10;
            
            document.getElementById('main-content').innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h2>⏱ Call Room Live Dashboard</h2>
                    <button class="btn btn-primary fw-bold" onclick="syncWise()">🔄 Sincronizza Risultati WISE</button>
                </div>
                <hr>
                <div class="card mb-4 bg-light d-print-none">
                    <div class="card-body row align-items-end">
                        <div class="col-md-3">
                            <label class="form-label">Minuti CR1 Prima della Gara</label>
                            <input type="number" id="cr1-offset" class="form-control" value="${cr1}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Minuti CR2 Prima della Gara</label>
                            <input type="number" id="cr2-offset" class="form-control" value="${cr2}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Minuti Ingresso Pista</label>
                            <input type="number" id="track-offset" class="form-control" value="${track}">
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-secondary w-100" onclick="saveCallRoomSettings()">Salva Parametri</button>
                        </div>
                    </div>
                </div>
                
                <h4 class="mb-3">Tabellone Orari <span id="live-clock" class="badge bg-dark float-end"></span></h4>
                <div id="cr-table-container"></div>
            `;
            
            renderCallRoomTable();
            callRoomTimer = setInterval(() => {
                document.getElementById('live-clock').textContent = new Date().toLocaleTimeString('it-IT');
                renderCallRoomTable();
            }, 10000);
            document.getElementById('live-clock').textContent = new Date().toLocaleTimeString('it-IT');
        }

        window.saveCallRoomSettings = function() {
            localStorage.setItem('cr1_offset', document.getElementById('cr1-offset').value);
            localStorage.setItem('cr2_offset', document.getElementById('cr2-offset').value);
            localStorage.setItem('track_offset', document.getElementById('track-offset').value);
            renderCallRoomTable();
        }

        async function renderCallRoomTable() {
            const container = document.getElementById('cr-table-container');
            if (!container) return;
            
            const cr1 = parseInt(localStorage.getItem('cr1_offset') || 30);
            const cr2 = parseInt(localStorage.getItem('cr2_offset') || 20);
            const track = parseInt(localStorage.getItem('track_offset') || 10);
            
            const races = await db.races.where('meetingId').equals(currentMeeting.id).toArray();
            races.sort((a,b) => (a.scheduledTime || '23:59').localeCompare(b.scheduledTime || '23:59'));
            
            const now = new Date();
            const nowMins = now.getHours() * 60 + now.getMinutes();
            
            let html = '<table class="table table-bordered text-center align-middle"><thead class="table-dark"><tr><th>Orario Gara</th><th>Gara</th><th>Apertura CR1 (-'+cr1+')</th><th>Apertura CR2 (-'+cr2+')</th><th>Ingresso Pista (-'+track+')</th><th>Stato</th></tr></thead><tbody>';
            
            races.forEach(r => {
                if (!r.scheduledTime) return; // Skip races without time
                if (r.isCompleted) return; // Skip completed
                
                const [h, m] = r.scheduledTime.split(':').map(Number);
                const raceMins = h * 60 + m;
                
                const formatTime = (totalMins) => {
                    let mins = totalMins;
                    if(mins < 0) mins += 1440;
                    const hh = Math.floor(mins / 60).toString().padStart(2, '0');
                    const mm = (mins % 60).toString().padStart(2, '0');
                    return hh+':'+mm;
                };
                
                const cr1Mins = raceMins - cr1;
                const cr2Mins = raceMins - cr2;
                const trackMins = raceMins - track;
                
                let rowClass = "";
                let stato = "-";
                
                if (nowMins >= raceMins) {
                    rowClass = "table-success";
                    stato = "IN CORSO";
                } else if (nowMins >= trackMins) {
                    rowClass = "table-warning";
                    stato = "IN PISTA";
                } else if (nowMins >= cr2Mins) {
                    rowClass = "table-danger";
                    stato = "IN CR 2";
                } else if (nowMins >= cr1Mins) {
                    rowClass = "table-info";
                    stato = "IN CR 1";
                }
                
                html += `<tr class="${rowClass}">
                    <td class="fw-bold fs-5">${r.scheduledTime}</td>
                    <td class="text-start fw-bold">${r.name}</td>
                    <td>${formatTime(cr1Mins)}</td>
                    <td>${formatTime(cr2Mins)}</td>
                    <td>${formatTime(trackMins)}</td>
                    <td class="fw-bold">${stato}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        }

        window.syncWise = async function() {
            if (!currentMeeting.resultsUrl) {
                alert("URL Risultati non trovato per questo meeting.");
                return;
            }
            try {
                const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(currentMeeting.resultsUrl);
                const res = await fetch(proxyUrl);
                const json = await res.json();
                const htmlStr = json.contents;
                
                if (!htmlStr) throw new Error("Risposta vuota");
                
                // Parse HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlStr, "text/html");
                const links = Array.from(doc.querySelectorAll('a')).map(a => a.textContent.trim());
                
                const races = await db.races.where('meetingId').equals(currentMeeting.id).toArray();
                let completedCount = 0;
                
                for (let r of races) {
                    if (r.isCompleted) continue;
                    // Check if race name exists in the links text
                    if (links.some(l => l.includes(r.name) || r.name.includes(l) && l.length > 5)) {
                        r.isCompleted = 1;
                        await db.races.put(r);
                        completedCount++;
                    }
                }
                
                alert(`Sincronizzazione completata! ${completedCount} gare segnate come terminate.`);
                renderCallRoomTable();
                
            } catch(e) {
                console.error(e);
                alert("Errore durante la sincronizzazione WISE. Controlla la console.");
            }
        }

        async function showRace(index, btn) {
            clearActiveNav();
            if(btn) btn.classList.add('active');
            
            const race = currentMeeting.data[index];
            const field = isFieldEvent(race.nome_gara);
            const middleDist = isMiddleDistance(race.nome_gara);
            const estTime = estimateDuration(race.nome_gara, race.numero_iscritti, middleDist, null);
            
            const raceDb = await db.races.get(currentMeeting.id + '_' + race.nome_gara);
            const schedTime = raceDb ? raceDb.scheduledTime : '';
            
            let html = `<div class="d-flex justify-content-between align-items-center">
                <h2>${race.nome_gara}</h2>
                <div>
                    <span id="est-time-${index}" class="badge bg-info fs-6 me-2">⏱ Stima: ${Math.round(estTime)} min</span>
                    <div class="input-group input-group-sm d-inline-flex w-auto d-print-none">
                        <span class="input-group-text">Orario:</span>
                        <input type="time" class="form-control" id="sched-time-${index}" value="${schedTime}" onchange="saveRaceTime('${race.nome_gara}', this.value)">
                    </div>
                </div>
            </div><hr>`;
            
            if (race.numero_iscritti === 0) {
                html += `<div class="alert alert-info">Nessun iscritto a questa gara.</div>`;
                document.getElementById('main-content').innerHTML = html;
                return;
            }

            // Same generation logic as before... (omitted full logic for brevity, will inject via build_dashboard.js)
            html += `<div id="race-content-placeholder">Caricamento interfaccia gara...</div>`;
            document.getElementById('main-content').innerHTML = html;
            
            // Re-render tracks if data exists
            const savedData = localStorage.getItem('race_data_' + currentMeeting.id + '_' + index);
            if (savedData) {
                // To be implemented via the original build_dashboard logic
            }
        }

        window.saveRaceTime = async function(name, timeVal) {
            const r = await db.races.get(currentMeeting.id + '_' + name);
            if(r) {
                r.scheduledTime = timeVal;
                await db.races.put(r);
            }
        }

        function showShoeControl() {
            // Shoe control HTML...
        }

        // Boot
        window.onload = init;
    
// ====== LEGACY FUNCTIONS ======
        function generateField(index) {
            const race = data[index];
            const method = document.getElementById(`field-order-${index}`).value;
            const lower = race.nome_gara.toLowerCase();
            const isVertical = lower.includes('alto') || lower.includes('asta');
            
            let iscritti = [...race.iscritti].map(i => ({...i, val: parseFloat(i.accredito) || -1}));
            
            if (method === 'inverse') {
                iscritti.sort((a, b) => a.val - b.val); // lowest to highest (highest jumps last)
            } else {
                iscritti.sort(() => Math.random() - 0.5);
            }
            
            let html = `<div class="d-flex justify-content-between align-items-center mb-2 d-print-none">
                <h4>Foglio Gara (Start List)</h4>
                <button class="btn btn-outline-secondary btn-sm" onclick="window.print()">🖨 Stampa</button>
            </div>
            <table class="table table-bordered table-sm" style="font-size: 0.85rem;">
                <thead class="table-light">`;
                
            let progCols = 10;
            if (isVertical) {
                html += `<tr><th width="5%">Ord</th><th width="5%">Pett</th><th width="20%">Atleta</th><th width="15%">Società</th><th width="5%">SB</th>`;
                const progInput = document.getElementById(`progression-${index}`);
                let measuresArray = [];
                if (progInput && progInput.value.trim() !== '') {
                    measuresArray = progInput.value.replace(/,/g, ' ').split(/\s+/).filter(x=>x);
                    progCols = Math.max(10, measuresArray.length + 2);
                }
                for(let i=0; i<progCols; i++) {
                    const m = measuresArray[i] || '';
                    html += `<th>${m}</th>`;
                }
                html += `<th width="5%">Mis.</th><th width="5%">Pos</th></tr></thead><tbody>`;
            } else {
                html += `<tr><th width="5%">Ord</th><th width="5%">Pett</th><th width="20%">Atleta</th><th width="15%">Società</th><th width="5%">SB</th>
                <th width="7%">1°</th><th width="7%">2°</th><th width="7%">3°</th><th width="7%">4°</th><th width="7%">5°</th><th width="7%">6°</th>
                <th width="5%">Mis.</th><th width="5%">Pos</th></tr></thead><tbody>`;
            }
            
            iscritti.forEach((a, i) => {
                const athleteName = a.fidal_link ? `<a href="${a.fidal_link}" target="_blank" class="text-decoration-none text-dark fw-bold">${a.nominativo}</a>` : `<span class="fw-bold">${a.nominativo}</span>`;
                html += `<tr>
                    <td><strong>${i+1}</strong></td>
                    <td>${a.pettorale}</td>
                    <td>${athleteName}</td>
                    <td><small>${a.societa.substring(0,20)}</small></td>
                    <td>${a.accredito}</td>`;
                
                if (isVertical) {
                    for(let attempt=0; attempt<progCols; attempt++) {
                        html += `<td></td>`;
                    }
                    html += `<td></td><td></td>`;
                } else {
                    for(let attempt=1; attempt<=3; attempt++) {
                        html += `<td></td>`;
                    }
                    html += `<td class="table-light"></td>`; // Migliore 3 prove
                    for(let attempt=4; attempt<=6; attempt++) {
                        html += `<td></td>`;
                    }
                    html += `<td></td><td></td>`; // Misura finale e Pos
                }
                
                html += `</tr>`;
            });
            html += `</tbody></table>`;
            
            document.getElementById(`results-${index}`).innerHTML = html;
            localStorage.setItem('race_' + currentMeeting.id + '_' + index, html);
        }

        function generateTrack(index, isMiddle) {
            const race = data[index];
            const lanesInputStr = document.getElementById(`lanes-${index}`).value;
            
            let activeLanes = [];
            let maxLanes = 6;
            
            if (isMiddle) {
                maxLanes = parseInt(lanesInputStr) || 12;
            } else {
                activeLanes = lanesInputStr.replace(/[^0-9,]/g, '').split(',').map(Number).filter(x => x > 0);
                if (activeLanes.length === 0) activeLanes = [1,2,3,4,5,6];
                maxLanes = activeLanes.length;
            }
            
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
            
            const raceData = { heats, isMiddle, maxLanes, activeLanes };
            localStorage.setItem('race_data_' + currentMeeting.id + '_' + index, JSON.stringify(raceData));
            
            const badge = document.getElementById(`est-time-${index}`);
            if (badge) {
                const updatedTime = estimateDuration(race.nome_gara, total, isMiddle, heatsCount);
                badge.textContent = `⏱ Stima: ${Math.round(updatedTime)} min`;
            }
            
            renderTrackHeats(index);
        }

        function moveAthlete(index, fromHeat, pettorale, toHeatSelect) {
            const toHeat = parseInt(toHeatSelect.value);
            if (fromHeat === toHeat) return;
            
            let raceData = JSON.parse(localStorage.getItem('race_data_' + currentMeeting.id + '_' + index));
            let heats = raceData.heats;
            
            // Find athlete
            let athleteIndex = heats[fromHeat].findIndex(a => a.pettorale === pettorale);
            if (athleteIndex > -1) {
                const athlete = heats[fromHeat].splice(athleteIndex, 1)[0];
                heats[toHeat].push(athlete);
                
                localStorage.setItem('race_data_' + currentMeeting.id + '_' + index, JSON.stringify(raceData));
                renderTrackHeats(index);
            }
        }

        function renderTrackHeats(index) {
            const race = data[index];
            const raceDataStr = localStorage.getItem('race_data_' + currentMeeting.id + '_' + index);
            if (!raceDataStr) return;
            
            const raceData = JSON.parse(raceDataStr);
            const heats = raceData.heats;
            const isMiddle = raceData.isMiddle;
            const maxLanes = raceData.maxLanes;
            const activeLanes = raceData.activeLanes || Array.from({length: maxLanes}, (_,i)=>i+1);
            const heatsCount = heats.length;
            
            let html = `<div class="d-flex justify-content-between align-items-center mb-2 d-print-none">
                <h4>Composizione Serie (${heatsCount} Serie Generate)</h4>
                <button class="btn btn-outline-secondary btn-sm" onclick="window.print()">🖨 Stampa</button>
            </div>`;
            
            // Preferred lanes for standard sprint
            const pref6 = [3, 4, 5, 6, 2, 1];
            const pref8 = [4, 5, 3, 6, 2, 7, 1, 8];
            const pref9 = [5, 6, 4, 7, 3, 8, 2, 9, 1];
            
            let basePref = pref6;
            const maxActive = Math.max(...activeLanes);
            if (maxActive > 6) basePref = pref8;
            if (maxActive > 8) basePref = pref9;
            
            // Filter basePref by activeLanes
            let pref = basePref.filter(l => activeLanes.includes(l));
            activeLanes.forEach(l => {
                if (!pref.includes(l)) pref.push(l); // fallback for unusual lanes
            });
            
            heats.forEach((h, i) => {
                html += `<div class="mt-4" style="page-break-inside: avoid;">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5>Serie ${i+1}</h5>
                    </div>
                    <table class="table table-bordered table-sm">
                    <thead class="table-light"><tr><th>${isMiddle ? 'Pos' : 'Corsia'}</th><th>Pett</th><th>Atleta</th><th>Società</th><th>SB</th><th width="15%">Risultato</th><th width="5%">Pos</th><th class="d-print-none" width="10%">Sposta</th></tr></thead><tbody>`;
                
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
                    const athleteName = a.fidal_link ? `<a href="${a.fidal_link}" target="_blank" class="text-decoration-none text-dark fw-bold">${a.nominativo}</a>` : `<span class="fw-bold">${a.nominativo}</span>`;
                    
                    // Heat selector
                    let selectHtml = `<select class="form-select form-select-sm" onchange="moveAthlete(${index}, ${i}, '${a.pettorale}', this)">`;
                    for(let x=0; x<heatsCount; x++) {
                        selectHtml += `<option value="${x}" ${x===i ? 'selected' : ''}>S ${x+1}</option>`;
                    }
                    selectHtml += `</select>`;
                    
                    html += `<tr><td><strong>${a.lane}</strong></td><td>${a.pettorale}</td><td>${athleteName}</td><td><small>${a.societa.substring(0,20)}</small></td><td>${a.accredito}</td><td></td><td></td><td class="d-print-none">${selectHtml}</td></tr>`;
                });
                
                html += `</tbody></table></div>`;
            });
            
            if (isMiddle) {
                const numLaps = getLaps(race.nome_gara);
                html += `<div style="page-break-before: always;" class="mt-5"></div>
                <div class="d-flex justify-content-between align-items-center mb-2 d-print-none">
                    <h4 class="mt-4 text-primary">Foglio Contagiri (${race.nome_gara})</h4>
                    <div>
                        <a href="https://matteomircoli.it/contagiristatico/garav2.html" target="_blank" class="btn btn-outline-success btn-sm mt-4 me-2">⏱ Contagiri Elettronico</a>
                        <button class="btn btn-outline-primary btn-sm mt-4" onclick="window.print()">🖨 Stampa Foglio Cartaceo</button>
                    </div>
                </div>
                `;
                const lapStyleEl = document.getElementById('lap-style-' + index);
                const lapStyle = lapStyleEl ? lapStyleEl.value : 'normal';

                html += `<h4 class="mt-4 d-none d-print-block">Foglio Contagiri - ${race.nome_gara}</h4>`;

                if (lapStyle === 'normal') {
                    html += `
                    <div class="d-print-none alert alert-info small"><strong>Stile Normale:</strong> Griglia vuota. Il giudice segna a mano il pettorale in base alla posizione (Pos).</div>`;
                    
                    heats.forEach((h, i) => {
                        if (h.length === 0) return;
                        html += `<div class="mt-4" style="page-break-inside: avoid;">
                            <h5>Contagiri - Serie ${i+1}</h5>
                            <table class="table table-bordered table-sm text-center" style="font-size: 0.8rem;">
                            <thead class="table-light"><tr><th width="5%">Pos</th><th width="10%">Pettorale</th>`;
                        for(let lap=numLaps; lap>=2; lap--) {
                            html += `<th>-${lap}</th>`;
                        }
                        html += `<th>ARRIVO</th></tr></thead><tbody>`;
                        
                        const numRows = h.length + 3;
                        for (let row = 1; row <= numRows; row++) {
                            html += `<tr><td><strong>${row}°</strong></td><td></td>`;
                            for(let lap=1; lap<=numLaps; lap++) {
                                html += `<td></td>`;
                            }
                            html += `</tr>`;
                        }
                        
                        html += `</tbody></table></div>`;
                    });
                } else {
                    html += `
                    <div class="d-print-none alert alert-info small"><strong>Stile World Athletics:</strong> Griglia precompilata con Pettorali/Nomi. Il giudice spunta il giro al passaggio dell'atleta.</div>`;
                    
                    heats.forEach((h, i) => {
                        if (h.length === 0) return;
                        const sortedH = [...h].sort((a,b) => (a.pettorale || '999').localeCompare(b.pettorale || '999'));
                        
                        html += `<div class="mt-4" style="page-break-inside: avoid;">
                            <h5>Contagiri - Serie ${i+1}</h5>
                            <table class="table table-bordered table-sm text-center align-middle" style="font-size: 0.8rem;">
                            <thead class="table-light"><tr><th width="8%">Pett.</th><th width="15%">Atleta</th>`;
                        for(let lap=numLaps; lap>=2; lap--) {
                            html += `<th>-${lap}</th>`;
                        }
                        html += `<th>ARRIVO</th></tr></thead><tbody>`;
                        
                        sortedH.forEach(a => {
                            html += `<tr>
                                <td class="fw-bold">${a.pettorale || ''}</td>
                                <td class="text-start">${a.nominativo}<br><small class="text-muted">${a.societa || ''}</small></td>`;
                            for(let lap=1; lap<=numLaps; lap++) {
                                html += `<td></td>`;
                            }
                            html += `</tr>`;
                        });
                        
                        for(let ex=0; ex<3; ex++) {
                            html += `<tr><td></td><td></td>`;
                            for(let lap=1; lap<=numLaps; lap++) {
                                html += `<td></td>`;
                            }
                            html += `</tr>`;
                        }
                        
                        html += `</tbody></table></div>`;
                    });
                }
            }
            
            document.getElementById(`results-${index}`).innerHTML = html;
            localStorage.setItem('race_' + currentMeeting.id + '_' + index, html);
        }