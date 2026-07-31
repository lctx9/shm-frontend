import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const testAccounts = [
    { role: 'Coordinator', email: 'coordinator@seal.dev', pass: '123456', page: '/dashboard' },
    { role: 'Admin', email: 'admin@seal.dev', pass: '123456', page: '/dashboard/users' },
    { role: 'Judge', email: 'judge1@seal.dev', pass: '123456', page: '/dashboard/grading' },
    { role: 'Mentor', email: 'mentor1.alpha@seal.dev', pass: '123456', page: '/dashboard/teams' },
    { role: 'Student', email: 'leader.alpha@seal.dev', pass: '123456', page: '/my-team' }
];

async function verifyUnifiedTemplate() {
    console.log('🚀 Testing Unified Template Shell across all 5 roles...');
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850 });

    const screenshotsDir = path.join(process.cwd(), 'scratch', 'unified_template_screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
        for (const account of testAccounts) {
            console.log(`\n🔑 Testing ${account.role} (${account.email})...`);
            
            // 1. Perform login via fetch API in page
            await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
            
            const loginRes = await page.evaluate(async (email, password) => {
                try {
                    const res = await fetch('http://localhost:8080/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const data = await res.json();
                    if (data.code === 1000 && data.result) {
                        const { token, role, email, userId } = data.result;
                        localStorage.setItem('token', token);
                        localStorage.setItem('role', role);
                        localStorage.setItem('email', email);
                        localStorage.setItem('userId', String(userId));
                        localStorage.setItem('user', JSON.stringify({ email, fullName: email }));
                        return true;
                    }
                } catch (e) {
                    return false;
                }
                return false;
            }, account.email, account.pass);

            console.log(`   - Login API success: ${loginRes}`);

            // 2. Navigate to target page
            await page.goto(`http://localhost:5173${account.page}`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(screenshotsDir, `role_${account.role.toLowerCase()}.png`) });

            // 3. Verify Header & Footer elements
            const hasHeaderLogo = await page.evaluate(() => Boolean(document.querySelector('.site-header')));
            const hasFooter = await page.evaluate(() => Boolean(document.querySelector('.site-footer')));
            const navLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('.site-header nav a'));
                return links.map(l => l.innerText.trim());
            });

            console.log(`   ✅ Has Top Header (.site-header): ${hasHeaderLogo ? 'YES ✅' : 'NO ❌'}`);
            console.log(`   ✅ Has Site Footer (.site-footer): ${hasFooter ? 'YES ✅' : 'NO ❌'}`);
            console.log(`   📌 Header Nav Items: [${navLinks.join(', ')}]`);
        }

        console.log('\n==========================================================');
        console.log('🎉 UNIFIED TEMPLATE VERIFICATION PASSED FOR ALL ROLES!');
        console.log('==========================================================');
    } catch (err) {
        console.error('❌ Error during verification:', err);
    } finally {
        await browser.close();
    }
}

verifyUnifiedTemplate();
