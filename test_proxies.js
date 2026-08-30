const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    await page.setContent(`
        <script>
            async function testProxy(proxyPrefix, name) {
                try {
                    const url = proxyPrefix + encodeURIComponent('https://www.fidal.it/risultati/2026/REG44788/Risultati/IndexRisultatiPerGara.html');
                    const res = await fetch(url);
                    console.log(name + ' Status: ' + res.status);
                    const text = await res.text();
                    console.log(name + ' Length: ' + text.length);
                } catch (e) {
                    console.log(name + ' Error: ' + e.message);
                }
            }
            
            async function runTests() {
                await testProxy('https://thingproxy.freeboard.io/fetch/', 'thingproxy');
                await testProxy('https://api.allorigins.win/raw?url=', 'allorigins-raw');
                // try jsonp allorigins
                try {
                    const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.fidal.it/risultati/2026/REG44788/Risultati/IndexRisultatiPerGara.html');
                    const res = await fetch(url);
                    console.log('allorigins-get Status: ' + res.status);
                    const json = await res.json();
                    console.log('allorigins-get Length: ' + json.contents.length);
                } catch(e) {
                    console.log('allorigins-get Error: ' + e.message);
                }
            }
            runTests();
        </script>
    `);
    
    await page.waitForTimeout(5000);
    await browser.close();
})();
