const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    // test fetch from null origin
    await page.setContent(`
        <script>
            async function testFetch() {
                try {
                    const url = 'https://corsproxy.io/?url=' + encodeURIComponent('https://www.fidal.it/risultati/2026/REG44788/Risultati/IndexRisultatiPerGara.html');
                    const res = await fetch(url);
                    console.log('Status:', res.status);
                    const text = await res.text();
                    console.log('Length:', text.length);
                } catch (e) {
                    console.error('Error:', e);
                }
            }
            testFetch();
        </script>
    `);
    
    await page.waitForTimeout(3000);
    await browser.close();
})();
