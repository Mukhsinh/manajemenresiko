const puppeteer = require('puppeteer');

async function testRencanaStrategis() {
    let browser;
    try {
        console.log('Starting browser...');
        browser = await puppeteer.launch({ 
            headless: false, 
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Listen to console logs
        page.on('console', msg => {
            console.log(`BROWSER: ${msg.type()}: ${msg.text()}`);
        });
        
        // Listen to page errors
        page.on('pageerror', error => {
            console.error(`PAGE ERROR: ${error.message}`);
        });
        
        console.log('Navigating to localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Wait for login form
        console.log('Waiting for login form...');
        await page.waitForSelector('#login-form', { timeout: 10000 });
        
        // Login
        console.log('Logging in...');
        await page.type('#login-email', 'mukhsin9@gmail.com');
        await page.type('#login-password', 'Mukhsin123');
        await page.click('button[type="submit"]');
        
        // Wait for app to load
        console.log('Waiting for app to load...');
        await page.waitForSelector('#app-screen', { timeout: 15000 });
        
        // Navigate to rencana strategis
        console.log('Navigating to rencana strategis...');
        await page.click('[data-page="rencana-strategis"]');
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Check if form exists
        console.log('Checking for form elements...');
        const formExists = await page.$('#rs-form');
        console.log(`Form exists: ${!!formExists}`);
        
        if (formExists) {
            // Count input elements
            const inputCount = await page.$$eval('#rs-form input, #rs-form select, #rs-form textarea', 
                elements => elements.length);
            console.log(`Input elements found: ${inputCount}`);
            
            // Check specific elements
            const kodeInput = await page.$('#rs-kode');
            const misiSelect = await page.$('#rs-misi');
            const namaInput = await page.$('#rs-nama');
            
            console.log(`Kode input exists: ${!!kodeInput}`);
            console.log(`Misi select exists: ${!!misiSelect}`);
            console.log(`Nama input exists: ${!!namaInput}`);
            
            if (kodeInput) {
                const kodeValue = await page.$eval('#rs-kode', el => el.value);
                console.log(`Kode value: ${kodeValue}`);
            }
            
            if (misiSelect) {
                const optionCount = await page.$eval('#rs-misi', el => el.options.length);
                console.log(`Misi options count: ${optionCount}`);
            }
        } else {
            console.log('Form not found! Checking content...');
            const content = await page.$eval('#rencana-strategis-content', el => el.innerHTML);
            console.log(`Content length: ${content.length}`);
            console.log(`Content preview: ${content.substring(0, 200)}...`);
        }
        
        // Take screenshot
        console.log('Taking screenshot...');
        await page.screenshot({ path: 'rencana-strategis-test.png', fullPage: true });
        
        console.log('Test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if puppeteer is available
try {
    testRencanaStrategis();
} catch (error) {
    console.log('Puppeteer not available, skipping browser test');
    console.log('Please test manually by visiting http://localhost:3000');
    console.log('1. Login with mukhsin9@gmail.com / Mukhsin123');
    console.log('2. Navigate to Rencana Strategis page');
    console.log('3. Check if form inputs are visible');
}