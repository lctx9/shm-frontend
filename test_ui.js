import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runUiTests() {
    console.log('Launching browser for UI test...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const screenshotsDir = path.join(process.cwd(), 'scratch', 'ui_screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
        // 1. Homepage
        console.log('1. Navigating to Homepage (http://localhost:5173)...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '01_homepage.png') });
        console.log('   - Homepage loaded successfully.');

        // 2. Events Page
        console.log('2. Navigating to Events Page...');
        await page.goto('http://localhost:5173/events', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '02_events.png') });
        console.log('   - Events page loaded successfully.');

        // 3. Login Page
        console.log('3. Navigating to Login Page...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '03_login_page.png') });

        // Perform Admin Login
        console.log('4. Testing Admin Login...');
        await page.type('input[type="email"], input[name="email"]', 'admin@seal.dev');
        await page.type('input[type="password"], input[name="password"]', '123456');
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
            page.click('button[type="submit"]')
        ]);
        await page.screenshot({ path: path.join(screenshotsDir, '04_admin_dashboard.png') });
        console.log('   - Logged in as Admin successfully.');

        // 5. Admin Event Management
        console.log('5. Navigating to Event Management...');
        await page.goto('http://localhost:5173/dashboard/events', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '05_event_management.png') });

        // 6. Admin User Management
        console.log('6. Navigating to User Management...');
        await page.goto('http://localhost:5173/dashboard/users', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '06_user_management.png') });

        // 7. Leaderboard
        console.log('7. Navigating to Leaderboard...');
        await page.goto('http://localhost:5173/leaderboard', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(screenshotsDir, '07_leaderboard.png') });

        console.log('UI Testing completed successfully!');
    } catch (err) {
        console.error('UI Test encountered an error:', err);
    } finally {
        await browser.close();
    }
}

runUiTests();
