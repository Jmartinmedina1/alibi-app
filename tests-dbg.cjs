const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + String(e).slice(0,400))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0,400)); });
  await p.goto(process.argv[2] || 'http://127.0.0.1:8787/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
  await p.screenshot({ path: 'shots/dbg.png' }); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
