const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const out = process.argv[2];
  const jobs = [['scene', 800, 560, 1.5, out + '/scene.png'], ...['footprints','spotlight','key','microphone','curtain','mask'].map(n => [n, 200, 200, 2, out + '/cards/' + n + '.png'])];
  for (const [n, w, h, s, file] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: s });
    await p.setContent(`<html><body style="margin:0;background:transparent">${fs.readFileSync(path.join(__dirname, n + '.svg'), 'utf8')}</body></html>`);
    await p.locator('svg').screenshot({ path: file, omitBackground: true }); await p.close();
  }
  await b.close();
})();
