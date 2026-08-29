const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    const fileUrl = 'file:///' + path.resolve('td_dashboard.html').replace(/\\/g, '/');
    console.log("Loading", fileUrl);
    
    await page.goto(fileUrl);
    
    await page.waitForTimeout(2000);
    
    await browser.close();
})();
