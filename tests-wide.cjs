const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, tag] of [[1366, 768, 'laptop'], [390, 844, 'phone']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    await p.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await p.screenshot({ path: `shots/wide-${tag}-landing.jpg`, type: 'jpeg', quality: 80 });
    await p.goto('http://127.0.0.1:8787/practice', { waitUntil: 'networkidle' });
    await p.getByText("Let's go").click(); await p.getByText('Play as Detective').click(); await p.waitForTimeout(1500);
    await p.screenshot({ path: `shots/wide-${tag}-game.jpg`, type: 'jpeg', quality: 80 });
  }
  await b.close();
})();
