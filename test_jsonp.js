const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    await page.setContent(`
        <html><head></head><body>
        <script>
            function loadJSONP(url) {
                return new Promise((resolve) => {
                    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
                    window[callbackName] = function(data) {
                        delete window[callbackName];
                        document.body.removeChild(script);
                        resolve(data);
                    };
                    const script = document.createElement('script');
                    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
                    document.body.appendChild(script);
                });
            }
            
            async function testJSONP() {
                try {
                    console.log("Fetching JSONP...");
                    const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.fidal.it/risultati/2026/REG44788/Risultati/IndexRisultatiPerGara.html');
                    const json = await loadJSONP(url);
                    console.log("JSONP Success! Length: " + json.contents.length);
                } catch(e) {
                    console.log('JSONP Error: ' + e.message);
                }
            }
            testJSONP();
        </script>
        </body></html>
    `);
    
    await page.waitForTimeout(5000);
    await browser.close();
})();
