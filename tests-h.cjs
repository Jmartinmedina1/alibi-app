const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => [...document.querySelectorAll('#root *')].filter(e => e.offsetHeight > 900).slice(0, 8).map(e => `${e.tagName} h=${e.offsetHeight} sh=${e.scrollHeight} style=${(e.getAttribute('style')||'').slice(0,80)} cls=${(e.className||'').toString().slice(0,60)}`).join('\n')));
  await b.close();
})();
