const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      }
    });
    page.on('pageerror', err => {
      console.error('PAGE ERROR:', err.message);
    });
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully');
    await browser.close();
  } catch(e) {
    console.error('Puppeteer failed:', e);
  }
})();
