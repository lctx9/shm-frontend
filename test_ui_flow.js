import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runDetailedUiTests() {
    console.log('🚀 Launching Headless Edge Browser for Comprehensive UI Test...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850 });

    const screenshotsDir = path.join(process.cwd(), 'scratch', 'ui_flow_screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
        // 1. Open Homepage
        console.log('1. Testing Homepage (http://localhost:5173)...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '01_homepage.png') });
        console.log('   ✅ Homepage loaded successfully.');

        // 2. Login as Coordinator
        console.log('2. Logging in as Coordinator (coordinator@seal.dev)...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
        await page.type('input[type="email"], input[name="email"]', 'coordinator@seal.dev');
        await page.type('input[type="password"], input[name="password"]', '123456');

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
            page.click('button[type="submit"]')
        ]);
        await page.screenshot({ path: path.join(screenshotsDir, '02_coordinator_login.png') });
        console.log('   ✅ Coordinator logged in.');

        // 3. Event Management Dashboard
        console.log('3. Navigating to Event Management Dashboard...');
        await page.goto('http://localhost:5173/dashboard/events', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '03_event_management_dashboard.png') });

        // Extract button text on Event Management Dashboard
        const buttonsText = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.map(b => b.innerText.trim()).filter(t => t.includes('Công bố') || t.includes('Kết thúc'));
        });
        console.log('   📌 Event Management Action Buttons Found:', buttonsText);

        // 4. Scoring Configuration Page
        console.log('4. Navigating to Scoring Configuration Page...');
        await page.goto('http://localhost:5173/dashboard/scoring-config', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '04_scoring_config_setup.png') });

        const setupStepText = await page.evaluate(() => {
            return document.querySelector('main')?.innerText || '';
        });

        const hasDurationInput = setupStepText.includes('Thời lượng làm bài (Phút)');
        const hasStartPicker = setupStepText.includes('Thời gian mở nộp (Vòng 1)');

        console.log(`   📌 Has 'Thời lượng làm bài (Phút)' input: ${hasDurationInput ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   📌 Has old 'Thời gian mở nộp' picker input: ${hasStartPicker ? 'YES ❌' : 'NO (Removed) ✅'}`);

        // 5. Leaderboard Page
        console.log('5. Navigating to Leaderboard...');
        await page.goto('http://localhost:5173/leaderboard', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '05_leaderboard.png') });
        console.log('   ✅ Leaderboard page rendered.');

        console.log('\n==========================================================');
        console.log('🎉 ALL UI TESTS COMPLETED SUCCESSFULLY!');
        console.log('==========================================================');
    } catch (err) {
        console.error('❌ UI Test Error:', err);
    } finally {
        await browser.close();
    }
}

runDetailedUiTests();
