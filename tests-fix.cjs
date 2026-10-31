const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  // old profile with the retired fox
  await p.goto('http://127.0.0.1:8787/'); await p.evaluate(() => localStorage.setItem('alibi.profile.v1', JSON.stringify({ id: 'p_test', name: 'Detective Tamale', emoji: '🦊' })));
  await p.goto('http://127.0.0.1:8787/practice', { waitUntil: 'networkidle' });   // opened directly: no history
  await p.getByText('← ALIBI').click(); await p.waitForTimeout(800);
  console.log('back link ->', p.url());
  await p.goto('http://127.0.0.1:8787/play', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await p.screenshot({ path: 'shots/fix-play.png' });
  await p.getByText(/Change/).click(); await p.waitForTimeout(800);
  await p.screenshot({ path: 'shots/fix-profile.png' });
  await p.goto('http://127.0.0.1:8787/how', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const v = await p.evaluate(() => { const el = document.querySelector('video'); return el ? { src: !!el.currentSrc || !!el.src, w: el.clientWidth, h: el.clientHeight } : null; });
  console.log('video:', JSON.stringify(v));
  await p.screenshot({ path: 'shots/fix-how.png' });
  console.log('errors:', errs.join('\n') || 'none'); await b.close();
})();
