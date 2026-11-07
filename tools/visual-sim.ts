/** Ordinary-play simulation for the Visual Bluffing Prototype (no QA scripts). The "human" follows bot rules. */
import { SCENE_ASSOCIATIONS } from '../app/src/visual-prototype/associations';
import * as bots from '../app/src/visual-prototype/bots';
import { HUMAN, apply, botAct, knowledgeFor, newGame, pending, result, type ScenarioId, type State } from '../app/src/visual-prototype/engine';
import { randFor } from '../app/src/visual-prototype/rand';

function run(scenario: ScenarioId, seed: string): State {
  let s = newGame({ scenario, seed });
  for (let g = 0; g < 100 && s.phase !== 'result'; g++) {
    const bot = pending(s).find((id) => id !== HUMAN);
    if (bot) { s = botAct(s, bot); continue; }
    const r = randFor(seed + '|human');
    if (s.phase === 'pick') s = apply(s, { type: 'pick', pid: HUMAN, card: bots.choose(knowledgeFor(s, HUMAN), s.round, r, 'h' + s.round).card });
    else if (s.phase === 'vote') s = apply(s, { type: 'vote', pid: HUMAN, targetId: bots.vote(knowledgeFor(s, HUMAN), r, 'hv').targetId });
    else s = apply(s, { type: s.phase === 'briefing' ? 'start' : 'continue', pid: HUMAN });
  }
  return s;
}
const N = 2000;
for (const scenario of ['detective', 'liar'] as const) {
  let found = 0, tie = 0, wrong = 0;
  const liarPick: Record<string, number>[] = [{}, {}];
  let liarDirect = [0, 0], detDirect = [0, 0], detN = [0, 0], liarLowest = 0;
  for (let i = 0; i < N; i++) {
    const s = run(scenario, scenario + i);
    const r = result(s);
    if (r.caught) found++; else if (r.tie) tie++; else wrong++;
    for (const k of [0, 1]) {
      const c = s.picks[k][s.liarId];
      liarPick[k][c] = (liarPick[k][c] ?? 0) + 1;
      if (SCENE_ASSOCIATIONS[c].score === 3) liarDirect[k]++;
      for (const p of s.players) if (p.id !== s.liarId) { detN[k]++; if (SCENE_ASSOCIATIONS[s.picks[k][p.id]].score === 3) detDirect[k]++; }
    }
    const tot = (id: string) => SCENE_ASSOCIATIONS[s.picks[0][id]].score + SCENE_ASSOCIATIONS[s.picks[1][id]].score;
    const liarT = tot(s.liarId);
    if (s.players.every((p) => p.id === s.liarId || tot(p.id) > liarT)) liarLowest++;
  }
  const pc = (n: number, d = N) => Math.round((100 * n) / d) + '%';
  console.log(`\n## ${scenario === 'detective' ? 'Human Detective (follows the Detective bot rule, mixed style)' : 'Human Liar (follows the Liar bot rule)'}, ${N} rounds`);
  console.log(`Detectives found the Liar ${pc(found)} · tie ${pc(tie)} · wrong suspect ${pc(wrong)}`);
  console.log(`Liar has the strictly lowest connection total: ${pc(liarLowest)}`);
  for (const k of [0, 1]) console.log(`Selection ${k + 1}: Liar picks ${JSON.stringify(Object.fromEntries(Object.entries(liarPick[k]).map(([c, n]) => [c, pc(n)])))} · Liar direct ${pc(liarDirect[k])} · Detectives direct ${pc(detDirect[k], detN[k])}`);
}
