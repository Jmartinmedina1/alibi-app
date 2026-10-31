// Plays a full Practice game in a phone-sized browser and screenshots each phase once.
const { chromium } = require('playwright');
const LANG = process.argv[2] || 'party';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  await p.goto('http://127.0.0.1:8787/practice', { waitUntil: 'networkidle' });
  await p.getByText("Let's go").click();
  if (LANG === 'espanol') await p.getByText('🇪🇸 Español', { exact: true }).click();
  await p.getByText(LANG === 'espanol' ? 'Jugar como Detective' : 'Play as Detective').click();
  const seen = new Set(); const t0 = Date.now(); let lastPhase = '';
  while (Date.now() - t0 < 300000) {
    await p.waitForTimeout(500);
    const el = await p.$('[data-testid^="phase-"]'); if (!el) continue;
    const phase = (await el.getAttribute('data-testid')).slice(6);
    if (phase !== lastPhase) { lastPhase = phase; }
    const shotKey = phase + (phase === 'answer' || phase === 'pick' ? (await p.$('text=/Pick your question|Elige tu pregunta|Your turn|¡Tu turno|hot seat|banquillo/')) ? '-me' : '-other' : '');
    if (!seen.has(shotKey)) { seen.add(shotKey); await p.waitForTimeout(900); await p.screenshot({ path: `shots/${LANG}-${String(seen.size).padStart(2,'0')}-${shotKey}.png`, fullPage: true }); }
    if (phase === 'gameover') break;
    const click = async (sel) => { const h = await p.$(sel); if (h) { await h.click().catch(()=>{}); return true; } return false; };
    if (phase === 'case') {
      for (const h of await p.$$('text=👆')) await h.click().catch(()=>{});
      await click('text=/Start the interrogation|Empezar el interrogatorio/');
    } else if (phase === 'pick') {
      if (await click('text=/Your turn|¡Tu turno/')) {}
      const faces = await p.$$('[data-testid="phase-pick"] >> css=div[tabindex="0"]');
      if (await p.$('text=/Pick your question|Elige tu pregunta/')) { const qs = await p.$$('text=/\\?$/'); if (qs.length) await qs[qs.length-1].click().catch(()=>{}); }
      else if (await p.$('text=/Your turn|¡Tu turno/') && faces.length) await faces[0].click().catch(()=>{});
    } else if (phase === 'answer') {
      const opts = await p.$$('text=/^(I |Comí|Escuché|Oí|Vi |Llevaba|Me fui|Estaba|Tomé)/');
      if (opts.length) await opts[0].click().catch(()=>{});
    } else if (phase === 'react') {
      await click('text=/LEGIT|CREÍBLE/');
    } else if (phase === 'vote') {
      const faces = await p.$$('[data-testid="phase-vote"] >> css=div[tabindex="0"]'); if (faces.length) await faces[0].click().catch(()=>{});
    } else if (phase === 'objection') {
      const ex = await p.$$('[data-testid="phase-objection"] >> css=div[role="button"]'); if (ex.length) await ex[0].click().catch(()=>{});
    } else if (phase === 'guess') {
      const g = await p.$$('[data-testid="phase-guess"] >> css=div[tabindex="0"]'); if (g.length) await g[0].click().catch(()=>{});
    } else if (['reveal', 'result', 'intro'].includes(phase)) {
      await click('text=/Continue|Continuar/');
    }
  }
  console.log('phases:', [...seen].join(', '), '| seconds', Math.round((Date.now()-t0)/1000));
  console.log('errors:', errs.join('\n') || 'none');
  await b.close();
})();
