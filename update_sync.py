import re

with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_sync = """        window.syncWise = async function() {
            if (!currentMeeting.resultsUrl) {
                alert("URL Risultati non trovato per questo meeting.");
                return;
            }
            try {
                // Try primary proxy
                let proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(currentMeeting.resultsUrl);
                let res = await fetch(proxyUrl);
                if (!res.ok) throw new Error("Proxy error");
                
                let json = await res.json();
                let htmlStr = json.contents;
                if (!htmlStr) throw new Error("Risposta vuota");
                
                // Parse HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlStr, "text/html");
                const links = Array.from(doc.querySelectorAll('a')).map(a => a.textContent.trim());
                
                const races = await db.races.where('meetingId').equals(currentMeeting.id).toArray();
                let completedCount = 0;
                
                for (let r of races) {
                    if (r.isCompleted) continue;
                    if (links.some(l => l.includes(r.name) || r.name.includes(l) && l.length > 5)) {
                        r.isCompleted = 1;
                        await db.races.put(r);
                        completedCount++;
                    }
                }
                
                alert(`Sincronizzazione completata! ${completedCount} nuove gare concluse.`);
                renderCallRoomTable();
            } catch (e) {
                alert("Errore di rete o proxy bloccato dai sistemi anti-bot FIDAL (Cloudflare). Riprova più tardi o aggiorna manualmente.\\n\\nDettaglio: " + e.message);
                console.error(e);
            }
        }"""

html = re.sub(r'window\.syncWise = async function\(\) \{.*?renderCallRoomTable\(\);\s*\}\s*catch[^\}]+\}\s*\}', new_sync, html, flags=re.DOTALL)

with open('dashboard_app.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated syncWise error handling!")
