const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    // 1. Backup and Anonymize Data
    const originalData = fs.readFileSync('iscritti_meeting.json', 'utf8');
    const data = JSON.parse(originalData);
    
    let athleteCounter = 1;
    data.forEach(race => {
        race.iscritti.forEach(a => {
            a.nominativo = `Atleta ${athleteCounter++}`;
            a.societa = `Società ${Math.floor(Math.random() * 20) + 1}`;
            a.fidal_link = "";
        });
    });
    
    fs.writeFileSync('iscritti_meeting.json', JSON.stringify(data));
    
    // 2. Rebuild HTML with anonymized data
    const execSync = require('child_process').execSync;
    execSync('node build_dashboard.js');
    
    // 3. Setup Playwright to take screenshots
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    
    // Assicurarsi che la cartella assets esista
    if (!fs.existsSync('assets')) {
        fs.mkdirSync('assets');
    }
    
    // Get absolute path to html
    const htmlPath = 'file:///' + process.cwd().replace(/\\/g, '/') + '/td_dashboard.html';
    
    // Overview Screen
    console.log('Taking overview screenshot...');
    await page.goto(htmlPath);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'assets/overview.png' });
    
    // Track Screen
    console.log('Taking track screenshot...');
    const buttons = await page.$$('.nav-link');
    for (let btn of buttons) {
        const text = await btn.innerText();
        if (text.toLowerCase().includes('800') || text.toLowerCase().includes('1500')) {
            await btn.click();
            await page.waitForTimeout(1000);
            const genBtn = await page.$('button:has-text("Genera")');
            if(genBtn) await genBtn.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: 'assets/track.png' });
            break;
        }
    }
    
    // Field Screen
    console.log('Taking field screenshot...');
    for (let btn of buttons) {
        const text = await btn.innerText();
        if (text.toLowerCase().includes('alto') || text.toLowerCase().includes('asta')) {
            await btn.click();
            await page.waitForTimeout(1000);
            
            // Fill progression
            const progInput = await page.$('input[placeholder*="Es. 1.80"]');
            if (progInput) {
                await progInput.fill('1.60 1.65 1.70 1.73 1.75 1.77');
                await progInput.press('Enter');
                await page.waitForTimeout(500); // Wait for validation feedback
            }
            
            const genBtn = await page.$('button:has-text("Genera")');
            if(genBtn) await genBtn.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: 'assets/field.png' });
            break;
        }
    }

    // Call Room Screen
    console.log('Taking Call Room screenshot...');
    for (let btn of buttons) {
        const text = await btn.innerText();
        if (text.toLowerCase().includes('call room')) {
            await btn.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'assets/callroom.png' });
            break;
        }
    }
    
    await browser.close();
    
    // 4. Restore Original Data & Rebuild
    fs.writeFileSync('iscritti_meeting.json', originalData);
    execSync('node build_dashboard.js');
    console.log('Screenshots generated and data restored.');
})();
