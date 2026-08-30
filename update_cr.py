import re

with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_call_room = """        async function showCallRoom() {
            clearActiveNav();
            document.querySelectorAll('#nav-general .nav-link')[1].classList.add('active');
            
            // Get offsets or set defaults
            const getOff = (k, def) => parseInt(localStorage.getItem(k) || def);
            
            const offsets = {
                corse: { cr1: getOff('cr1_corse', 30), cr2: getOff('cr2_corse', 20), track: getOff('track_corse', 10) },
                concorsi: { cr1: getOff('cr1_concorsi', 45), cr2: getOff('cr2_concorsi', 30), track: getOff('track_concorsi', 20) },
                asta: { cr1: getOff('cr1_asta', 60), cr2: getOff('cr2_asta', 45), track: getOff('track_asta', 40) }
            };
            
            document.getElementById('main-content').innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h2>🕒 Call Room Live Dashboard</h2>
                    <button class="btn btn-primary fw-bold" onclick="syncWise()">🔄 Sincronizza Risultati WISE</button>
                </div>
                <hr>
                
                <div class="card mb-4 bg-light d-print-none">
                    <div class="card-header fw-bold">⚙️ Impostazioni Tempi Call Room (Minuti prima della gara)</div>
                    <div class="card-body">
                        <div class="row text-center fw-bold small mb-2">
                            <div class="col-md-3 text-start">Categoria</div>
                            <div class="col-md-3">CR 1 (Apertura)</div>
                            <div class="col-md-3">CR 2 (Uscita)</div>
                            <div class="col-md-3">Ingresso in Pista</div>
                        </div>
                        
                        <div class="row align-items-center mb-2">
                            <div class="col-md-3 text-start fw-bold">Corse</div>
                            <div class="col-md-3"><input type="number" id="cr1-corse" class="form-control form-control-sm" value="${offsets.corse.cr1}"></div>
                            <div class="col-md-3"><input type="number" id="cr2-corse" class="form-control form-control-sm" value="${offsets.corse.cr2}"></div>
                            <div class="col-md-3"><input type="number" id="track-corse" class="form-control form-control-sm" value="${offsets.corse.track}"></div>
                        </div>
                        
                        <div class="row align-items-center mb-2">
                            <div class="col-md-3 text-start fw-bold">Concorsi (Lanci/Estensione)</div>
                            <div class="col-md-3"><input type="number" id="cr1-concorsi" class="form-control form-control-sm" value="${offsets.concorsi.cr1}"></div>
                            <div class="col-md-3"><input type="number" id="cr2-concorsi" class="form-control form-control-sm" value="${offsets.concorsi.cr2}"></div>
                            <div class="col-md-3"><input type="number" id="track-concorsi" class="form-control form-control-sm" value="${offsets.concorsi.track}"></div>
                        </div>
                        
                        <div class="row align-items-center mb-3">
                            <div class="col-md-3 text-start fw-bold">Alto e Asta</div>
                            <div class="col-md-3"><input type="number" id="cr1-asta" class="form-control form-control-sm" value="${offsets.asta.cr1}"></div>
                            <div class="col-md-3"><input type="number" id="cr2-asta" class="form-control form-control-sm" value="${offsets.asta.cr2}"></div>
                            <div class="col-md-3"><input type="number" id="track-asta" class="form-control form-control-sm" value="${offsets.asta.track}"></div>
                        </div>
                        
                        <div class="text-end">
                            <button class="btn btn-secondary btn-sm" onclick="saveCallRoomSettings()">Salva Parametri</button>
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
            const types = ['corse', 'concorsi', 'asta'];
            types.forEach(t => {
                localStorage.setItem(`cr1_${t}`, document.getElementById(`cr1-${t}`).value);
                localStorage.setItem(`cr2_${t}`, document.getElementById(`cr2-${t}`).value);
                localStorage.setItem(`track_${t}`, document.getElementById(`track-${t}`).value);
            });
            renderCallRoomTable();
        }

        async function renderCallRoomTable() {
            const container = document.getElementById('cr-table-container');
            if (!container) return;
            
            const getOff = (k, def) => parseInt(localStorage.getItem(k) || def);
            const offsets = {
                corse: { cr1: getOff('cr1_corse', 30), cr2: getOff('cr2_corse', 20), track: getOff('track_corse', 10) },
                concorsi: { cr1: getOff('cr1_concorsi', 45), cr2: getOff('cr2_concorsi', 30), track: getOff('track_concorsi', 20) },
                asta: { cr1: getOff('cr1_asta', 60), cr2: getOff('cr2_asta', 45), track: getOff('track_asta', 40) }
            };
            
            const races = await db.races.where('meetingId').equals(currentMeeting.id).toArray();
            races.sort((a,b) => (a.scheduledTime || '23:59').localeCompare(b.scheduledTime || '23:59'));
            
            const now = new Date();
            const nowMins = now.getHours() * 60 + now.getMinutes();
            
            let html = '<table class="table table-bordered text-center align-middle"><thead class="table-dark"><tr><th>Orario Gara</th><th>Gara</th><th>Apertura CR1</th><th>Apertura CR2</th><th>Ingresso Pista</th><th>Stato</th></tr></thead><tbody>';
            
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
                
                let cat = 'corse';
                const lower = r.name.toLowerCase();
                if (lower.includes('asta') || lower.includes('alto')) cat = 'asta';
                else if (['salto', 'lungo', 'triplo', 'peso', 'disco', 'martello', 'giavellotto', 'vortex'].some(k => lower.includes(k))) cat = 'concorsi';
                
                const o = offsets[cat];
                
                const cr1Mins = raceMins - o.cr1;
                const cr2Mins = raceMins - o.cr2;
                const trackMins = raceMins - o.track;
                
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
                    <td>${formatTime(cr1Mins)} <br><small class="text-muted">(-${o.cr1}')</small></td>
                    <td>${formatTime(cr2Mins)} <br><small class="text-muted">(-${o.cr2}')</small></td>
                    <td>${formatTime(trackMins)} <br><small class="text-muted">(-${o.track}')</small></td>
                    <td class="fw-bold">${stato}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        }"""

html = re.sub(r'async function showCallRoom\(\).*?container\.innerHTML = html;\s*\}', new_call_room, html, flags=re.DOTALL)

with open('dashboard_app.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated Call Room to support multiple categories!")
