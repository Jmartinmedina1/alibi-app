const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const out = process.argv[2];
  for (const n of ['scene-haunted-b', 'magic', 'masquerade']) {
    const p = await b.newPage({ viewport: { width: 800, height: 560 }, deviceScaleFactor: 1.5 });
    await p.setContent(`<html><body style="margin:0">${fs.readFileSync(path.join(__dirname, n + '.svg'), 'utf8')}</body></html>`);
    await p.locator('svg').screenshot({ path: path.join(out, n + '.png') }); await p.close();
  }
  await b.close();
})();
