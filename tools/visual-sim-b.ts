/** Variant B ordinary-play simulation. Numbers describe MY BOT RULES, not human deduction. */
import * as bots from '../app/src/visual-prototype/b/bots';
import { applyB, botActB, knowledgeForB, newGameB, pendingB, resultB, type ScenarioB } from '../app/src/visual-prototype/b/engine';
import { CONNECTIONS, SCENE_IDS } from '../app/src/visual-prototype/b/scenes';
import { HUMAN } from '../app/src/visual-prototype/engine';
import { randFor } from '../app/src/visual-prototype/rand';

const N = 3000;
for (const scenario of ['b-detective', 'b-liar'] as ScenarioB[]) {
  const by: Record<string, Record<string, number>> = {};
  let pinned = 0, caughtN = 0, liarUnlinked = 0;
  for (let i = 0; i < N; i++) {
    let s = newGameB({ scenario, seed: scenario + i });
    const r = randFor(s.seed + '|human');
    for (let g = 0; g < 50 && s.phase !== 'result'; g++) {
      const bot = pendingB(s).find((id) => id !== HUMAN);
      if (bot) { s = botActB(s, bot); continue; }
      const k = knowledgeForB(s, HUMAN);
      if (s.phase === 'pick') s = applyB(s, { type: 'pick', pid: HUMAN, card: bots.chooseB(k, r, 'h').card });
      else if (s.phase === 'vote') s = applyB(s, { type: 'vote', pid: HUMAN, targetId: bots.voteB(k, r, 'hv').targetId });
      else if (s.phase === 'guess' && k.role === 'liar') s = applyB(s, { type: 'guess', pid: HUMAN, scene: bots.guessB(k, r, 'hg').scene });
      else s = applyB(s, { type: s.phase === 'briefing' ? 'start' : 'continue', pid: HUMAN });
    }
    const res = resultB(s);
    (by[s.secret] ??= {})[res.outcome] = (by[s.secret][res.outcome] ?? 0) + 1;
    by[s.secret].n = (by[s.secret].n ?? 0) + 1;
    if (!CONNECTIONS[s.secret][s.picks[s.liarId]]) liarUnlinked++;
    if (res.caught) {
      caughtN++;
      const others = Object.entries(s.picks).filter(([p]) => p !== s.liarId).map(([, c]) => c);
      const fits = SCENE_IDS.map((id) => others.filter((c) => CONNECTIONS[id][c]).length);
      if (fits.filter((f) => f === Math.max(...fits)).length === 1) pinned++;
    }
  }
  const pc = (a: number, b: number) => Math.round((100 * a) / b) + '%';
  console.log(`\n## ${scenario} (${N} rounds; the human follows the bot rules)`);
  console.log(`Liar card not connected to the secret: ${pc(liarUnlinked, N)} · caught Liar faced a single best-fitting picture: ${pc(pinned, caughtN)}`);
  for (const id of SCENE_IDS) { const o = by[id]; console.log(`${id}: found ${pc(o.found ?? 0, o.n)} · named (escaped after catch) ${pc(o.named ?? 0, o.n)} · blended ${pc(o.blended ?? 0, o.n)}`); }
}
