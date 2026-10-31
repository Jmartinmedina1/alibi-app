const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'shots/01-landing.png' });
  await p.getByText('Practice vs. bots').click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'shots/02-profile.png' });
  console.log('errors:', errs.slice(0, 5).join('\n'));
  await b.close();
})();
