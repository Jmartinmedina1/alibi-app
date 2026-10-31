// 3 browser "phones" play a multiplayer game together (+1 bot). Screens are screenshotted per phase for player 2.
const { chromium } = require('playwright');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const mk = async () => { const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5 }); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(String(e).slice(0,200))); return p; };
  const host = await mk(), p2 = await mk(), p3 = await mk();
  await host.goto('http://127.0.0.1:8787/play'); await host.getByText("Let's go").click();
  await host.getByText('Create a room').click(); await host.waitForURL(/room\//, { timeout: 15000 });
  const code = host.url().split('/room/')[1]; console.log('room', code);
  for (const p of [p2, p3]) { await p.goto('http://127.0.0.1:8787/room/' + code); await p.getByText("Let's go").click(); }
  await sleep(1500);
  await host.getByText('+ Add a bot').click(); await sleep(800);
  await p2.screenshot({ path: 'shots/multi-00-lobby-p2.png' });
  await host.getByText('Open the case').click();
  const seen = new Set(); const t0 = Date.now();
  async function step(p, name) {
    const el = await p.$('[data-testid^="phase-"]'); if (!el) return null;
    const phase = (await el.getAttribute('data-testid')).slice(6);
    const c = async (sel) => { const h = await p.$(sel); if (h) await h.click({ timeout: 2000 }).catch(()=>{}); return !!h; };
    if (phase === 'intro') { if (!(await c('text=Got it!'))) await c('text=Next →'); }
    else if (phase === 'case') { for (const h of await p.$$('text=👆')) await h.click().catch(()=>{}); await c('text=/Start the interrogation/'); }
    else if (phase === 'pick') { if (await p.$('text=/Pick your question/')) { const q = await p.$$('[data-testid="phase-pick"] >> css=div[role="button"]'); if (q.length) await q[0].click().catch(()=>{}); } else if (await p.$('text=/Your turn/')) { const f = await p.$$('[data-testid="phase-pick"] >> css=div[tabindex="0"]'); if (f.length) await f[0].click().catch(()=>{}); } }
    else if (phase === 'answer') { const o = await p.$$('text=/^I /'); if (o.length) await o[Math.floor(Math.random()*o.length)].click().catch(()=>{}); }
    else if (phase === 'react') await c('text=/SUS/');
    else if (phase === 'vote') { const f = await p.$$('[data-testid="phase-vote"] >> css=div[tabindex="0"]'); if (f.length) await f[0].click().catch(()=>{}); }
    else if (phase === 'objection') { const x = await p.$$('[data-testid="phase-objection"] >> css=div[role="button"]'); if (x.length) await x[0].click().catch(()=>{}); }
    else if (phase === 'guess') { const g = await p.$$('[data-testid="phase-guess"] >> css=div[tabindex="0"]'); if (g.length) await g[0].click().catch(()=>{}); }
    else if (['reveal','result'].includes(phase)) await c('text=Continue →');
    return phase;
  }
  let phase = '';
  while (Date.now() - t0 < 400000) {
    for (const [p, n] of [[host,'host'],[p2,'p2'],[p3,'p3']]) {
      const ph = await step(p, n);
      if (n === 'p2' && ph && !seen.has(ph)) { seen.add(ph); await sleep(700); await p2.screenshot({ path: `shots/multi-${String(seen.size).padStart(2,'0')}-${ph}.png` }); }
      if (n === 'host') phase = ph;
    }
    if (phase === 'gameover') break;
    await sleep(400);
  }
  console.log('phases p2 saw:', [...seen].join(', '), '| seconds', Math.round((Date.now() - t0)/1000));
  console.log('errors:', [...host.errs, ...p2.errs, ...p3.errs].join('\n') || 'none');
  // Leave flow: host taps home -> confirm -> back on landing
  await host.click('[aria-label="Main menu"]').catch(()=>{}); await sleep(500);
  await host.getByText('Leave', { exact: true }).click().catch(()=>{}); await sleep(1200);
  console.log('host after leave:', host.url());
  await b.close();
})();
