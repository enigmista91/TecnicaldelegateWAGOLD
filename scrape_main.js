const { chromium } = require('playwright');
const fs = require('fs');

const args = process.argv.slice(2);
let INDEX_URL = 'https://www.fidal.it/risultati/2026/REG44788/Iscrizioni/IndexPerGara.html'; // Fallback
if (args.length > 0 && args[0].trim() !== '') {
    INDEX_URL = args[0].trim();
}

// URL Normalization: If user pastes calendar link or general results link
if (!INDEX_URL.toLowerCase().includes('iscrizioni/indexpergara.html')) {
    const yearMatch = INDEX_URL.match(/20\d{2}/);
    const codeMatch = INDEX_URL.match(/(REG\d+|COD\d+)/i);
    if (codeMatch) {
        const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
        INDEX_URL = `https://www.fidal.it/risultati/${year}/${codeMatch[0].toUpperCase()}/Iscrizioni/IndexPerGara.html`;
        console.log("URL normalizzato automaticamente a: " + INDEX_URL);
    }
}

const BASE_URL = INDEX_URL.substring(0, INDEX_URL.lastIndexOf('/') + 1);

(async () => {
    // using Chromium now that it's installed
    const browser = await chromium.launch({ headless: false, channel: 'msedge' });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('Visiting Index...');
    await page.goto(INDEX_URL);
    await page.waitForTimeout(1500); 

    const meetingName = await page.$eval('header h4 strong', el => el.innerText.trim()).catch(() => "Meeting FIDAL");
    fs.writeFileSync('meeting_info.json', JSON.stringify({ name: meetingName, url: INDEX_URL }));
    console.log(`Meeting: ${meetingName}`);

    const links = await page.$$eval("a[href^='GaraL']", elements => 
        elements.map(el => el.getAttribute('href'))
    );

    console.log(`Found ${links.length} race links.`);

    const reportData = [];

    for (const link of links) {
        const url = BASE_URL + link;
        console.log(`Scraping ${url}...`);
        
        await page.goto(url);
        await page.waitForTimeout(500); // slight pause to ensure table is rendered
        
        // Extract race name
        const raceName = await page.$eval('.jumbotron h3 strong', el => el.innerText.trim()).catch(() => "Gara Sconosciuta");
        
        // Extract participants
        const participants = await page.$$eval('table.table tbody tr', rows => {
            const data = [];
            for (const row of rows) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    const nominativoElement = cells[1].querySelector('a');
                    const nominativo = nominativoElement ? nominativoElement.innerText.trim() : cells[1].innerText.trim();
                    const fidal_link = nominativoElement ? nominativoElement.getAttribute('href') : '';
                    if (!nominativo) continue; // Skip empty rows or totals
                    
                    data.push({
                        pettorale: cells[0].innerText.trim(),
                        nominativo: nominativo,
                        fidal_link: fidal_link,
                        anno_nascita: cells[2].innerText.trim(),
                        categoria: cells[3].innerText.trim(),
                        societa: cells[4].innerText.trim(),
                        accredito: cells[5].innerText.trim()
                    });
                }
            }
            return data;
        });
        
        reportData.push({
            id_gara: link,
            nome_gara: raceName,
            numero_iscritti: participants.length,
            iscritti: participants
        });
    }

    console.log(`Finished scraping ${reportData.length} races. Saving to iscritti_meeting.json...`);
    fs.writeFileSync('iscritti_meeting.json', JSON.stringify(reportData, null, 2));

    await browser.close();
})();
