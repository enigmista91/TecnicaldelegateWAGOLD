const { chromium } = require('playwright');
const fs = require('fs');

const INDEX_URL = 'https://www.fidal.it/risultati/2026/REG44788/Iscrizioni/IndexPerGara.html';
const BASE_URL = 'https://www.fidal.it/risultati/2026/REG44788/Iscrizioni/';

(async () => {
    const browser = await chromium.launch({ 
        headless: true,
        channel: 'msedge'
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('Visiting Index...');
    await page.goto(INDEX_URL);
    await page.waitForTimeout(2000); 

    const links = await page.$$eval("a[href^='GaraL']", elements => 
        elements.map(el => el.getAttribute('href'))
    );

    console.log(`Found ${links.length} race links:`, links);
    
    if (links.length > 0) {
        const firstUrl = BASE_URL + links[0];
        console.log(`Scraping first link: ${firstUrl}...`);
        await page.goto(firstUrl);
        await page.waitForTimeout(1000);
        fs.writeFileSync('first_race.html', await page.content());
        console.log('Saved first_race.html');
    } else {
        console.log('No links found, dumping index html');
        fs.writeFileSync('index_dump.html', await page.content());
    }

    await browser.close();
})();
