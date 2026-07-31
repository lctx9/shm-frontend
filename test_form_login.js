import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const testAccounts = [
    { role: 'Coordinator', email: 'coordinator@seal.dev', pass: '123456' },
    { role: 'Admin', email: 'admin@seal.dev', pass: '123456' },
    { role: 'Judge', email: 'judge1@seal.dev', pass: '123456' },
    { role: 'Mentor', email: 'mentor1.alpha@seal.dev', pass: '123456' },
    { role: 'Student', email: 'leader.alpha@seal.dev', pass: '123456' }
];

async function verifyUnifiedTemplateViaForm() {
    console.log('🚀 Testing Unified Template via Form Login...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850 });

    page.on('pageerror', err => console.log('🔴 PAGE ERROR:', err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('🔴 CONSOLE ERROR:', msg.text());
    });

    const screenshotsDir = path.join(process.cwd(), 'scratch', 'form_login_screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
        for (const account of testAccounts) {
            console.log(`\n🔑 Logging in as ${account.role} (${account.email})...`);
            
            // 1. Open login page
            await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
            await page.evaluate(() => localStorage.clear());
            await page.reload({ waitUntil: 'networkidle0' });

            // 2. Fill credentials & submit
            await page.click('input[type="email"], input[name="email"]');
            await page.type('input[type="email"], input[name="email"]', account.email);
            await page.click('input[type="password"], input[name="password"]');
            await page.type('input[type="password"], input[name="password"]', account.pass);
            await page.click('button[type="submit"]');

            // Wait 2.5s for React router navigation and rendering
            await new Promise(r => setTimeout(r, 2500));
            const errorMsg = await page.evaluate(() => document.querySelector('.devpost-auth__error')?.innerText || '');
            if (errorMsg) console.log(`   ⚠️ Login error message: ${errorMsg}`);

            const currentUrl = page.url();
            console.log(`   - Current URL after login: ${currentUrl}`);

            await page.screenshot({ path: path.join(screenshotsDir, `role_${account.role.toLowerCase()}.png`) });

            // 3. Verify Header & Footer
            const pageTitle = await page.evaluate(() => document.title);
            const hasHeader = await page.evaluate(() => Boolean(document.querySelector('.site-header') || document.querySelector('header')));
            const hasFooter = await page.evaluate(() => Boolean(document.querySelector('.site-footer') || document.querySelector('footer')));
            const navItems = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('header nav a'));
                return links.map(l => l.innerText.trim());
            });

            console.log(`   📌 Page Title: ${pageTitle}`);
            console.log(`   ✅ Has Top Header (header): ${hasHeader ? 'YES ✅' : 'NO ❌'}`);
            console.log(`   ✅ Has Site Footer (footer): ${hasFooter ? 'YES ✅' : 'NO ❌'}`);
            console.log(`   📌 Header Nav Items: [${navItems.join(', ')}]`);
        }

        console.log('\n==========================================================');
        console.log('🎉 FORM LOGIN TEMPLATE TEST COMPLETED!');
        console.log('==========================================================');
    } catch (err) {
        console.error('❌ Error during form login test:', err);
    } finally {
        await browser.close();
    }
}

verifyUnifiedTemplateViaForm();
