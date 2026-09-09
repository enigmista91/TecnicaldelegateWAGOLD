const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    // Ensure public folder exists
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const htmlPath = path.join(__dirname, '..', 'td_dashboard.html');
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

    // Step 1: Panoramica (Home)
    await page.screenshot({ path: path.join(publicDir, 'step1.png') });
    console.log("Screenshot 1: Panoramica salvato.");

    // Step 2: Gara specifica (click on the first race button in sidebar)
    await page.evaluate(() => {
        const btn = document.querySelector('.race-btn');
        if(btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(publicDir, 'step2.png') });
    console.log("Screenshot 2: Gara salvato.");

    // Step 3: Call Room Live
    await page.evaluate(() => {
        const btns = document.querySelectorAll('#nav-general .nav-link');
        const crBtn = Array.from(btns).find(b => b.textContent.includes('Call Room Live'));
        if(crBtn) crBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(publicDir, 'step3.png') });
    console.log("Screenshot 3: Call Room salvato.");

    // Step 4: Ricerca & Doping
    await page.evaluate(() => {
        const btns = document.querySelectorAll('#nav-general .nav-link');
        const dopingBtn = Array.from(btns).find(b => b.textContent.includes('Ricerca & Doping'));
        if(dopingBtn) dopingBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(publicDir, 'step4.png') });
    console.log("Screenshot 4: Ricerca & Doping salvato.");

    await browser.close();
})();
