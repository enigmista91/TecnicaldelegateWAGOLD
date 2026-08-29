const fs = require('fs');

console.log("Generazione TD Dashboard 2.0...");

const iscritti = JSON.parse(fs.readFileSync('iscritti_meeting.json', 'utf8'));
let meetingInfo = { name: "Meeting Sconosciuto", url: "" };
if (fs.existsSync('meeting_info.json')) {
    meetingInfo = JSON.parse(fs.readFileSync('meeting_info.json', 'utf8'));
}

// Lettura del template dell'applicazione SPA
let html = fs.readFileSync('dashboard_app.html', 'utf8');

// Creazione del payload JSON da iniettare
const injection = `
        window.__INJECTED_MEETING__ = {
            info: ${JSON.stringify(meetingInfo)},
            races: ${JSON.stringify(iscritti)}
        };
`;

// Iniezione
html = html.replace('/* __INJECT_MEETING__ */', injection);

fs.writeFileSync('td_dashboard.html', html);
console.log('✅ Dashboard creata con successo: td_dashboard.html');
console.log('Puoi aprire td_dashboard.html nel browser. I dati verranno salvati nel database locale!');
