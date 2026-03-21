const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', error => {
    console.log(`BROWSER ERROR:`, error);
  });

  page.on('requestfailed', request => {
    console.log(`BROWSER NETWORK FALIED:`, request.url(), request.failure().errorText);
  });

  await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });

  const products = await page.evaluate(async () => {
    if (!window.SupabaseAPI) return { error: 'SupabaseAPI undefined' };
    try {
      return await window.SupabaseAPI.getProducts();
    } catch (e) {
      return { error: 'Threw error: ' + e.message };
    }
  });

  console.log('EVALUATED PRODUCTS:', products);

  await browser.close();
})();
