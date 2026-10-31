// Plays many full games (1-3 scripted humans + bots) and checks invariants.
// Run: npx tsx src/engine/tests/simulate.test.ts
import { addBot, addPlayer, apply, createGame, nextWake, tick } from '../engine';
import { viewFor } from '../view';
import { getLocation } from '../content';
import type { Game } from '../types';

let failures = 0;
const fail = (msg: string) => { failures++; console.error('FAIL', msg); };

function humanAct(g: Game, id: string, now: number, rnd: () => number) {
  const v = viewFor(g, id, now);
  const tryA = (a: any) => { try { apply(g, id, a, now); } catch { /* not allowed now */ } };
  switch (v.phase) {
    case 'intro': case 'case': case 'reveal': case 'result': if (!v.players.find(p=>p.id===id)!.ready) tryA({ type: 'ready' }); break;
    case 'pick': if (v.allowedTargets && v.current?.topicChoices) tryA({ type: 'pickTarget', targetId: v.allowedTargets[Math.floor(rnd()*v.allowedTargets.length)], topic: v.current.topicChoices[0] }); break;
    case 'answer': if (v.current?.options) tryA({ type: 'answer', cardId: v.current.options[Math.floor(rnd()*6)].id }); break;
    case 'react': if (v.current?.targetId !== id && !v.current?.reactions[id]) tryA({ type: 'react', reaction: rnd() < 0.5 ? 'sus' : 'legit' }); break;
    case 'vote': if (!v.myVote) { const o = v.players.filter(p=>p.id!==id); tryA({ type: 'vote', targetId: o[Math.floor(rnd()*o.length)].id }); } break;
    case 'objection': if (v.accusedId === id && v.excuseIdx == null && v.excuseChoices) tryA({ type: 'excuse', idx: v.excuseChoices[0] }); break;
    case 'guess': if (v.guessChoices && v.liarId === id) tryA({ type: 'guess', locationId: v.guessChoices[0] }); break;
  }
}

function leakCheck(g: Game, id: string, now: number) {
  const r = g.round; if (!r) return;
  if (r.liarId !== id) return;
  if (g.phase === 'result' || g.phase === 'gameover') return;
  const loc = getLocation(r.locationId);
  const json = JSON.stringify(viewFor(g, id, now));
  const secrets = [g.phase === 'guess' ? '' : loc.id, g.phase === 'guess' ? '' : loc.name, loc.fullName, ...loc.clues.map(c=>c.slice(0,40)), ...loc.facts.map(f=>(f.en||f.es||'').slice(0,40))];
  for (const s of secrets) if (s && json.includes(s)) fail(`LEAK to liar in ${g.phase}: "${s.slice(0,30)}"`);
  // card real flags before reveal
  if (!['reveal','guess'].includes(g.phase) && /"real":/.test(json)) fail(`real flag leaked to liar in ${g.phase}`);
}

function play(seed: number, nHumans: number, nBots: number, practice: boolean, pack: 'party'|'espanol') {
  let now = 1_000_000;
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const g = createGame({ code: 'TEST', host: { id: 'h0', name: 'Host', emoji: '🦊' }, settings: { practice, pack, rounds: 2, joker: seed % 2 === 0, difficulty: (['easy','medium','hard'] as const)[seed % 3] }, seed, now });
  for (let i = 1; i < nHumans; i++) addPlayer(g, { id: 'h' + i, name: 'H' + i, emoji: '🐸' });
  for (let i = 0; i < nBots; i++) addBot(g);
  apply(g, 'h0', { type: 'start' }, now);
  const start = now; let steps = 0; const grilledHumans = new Set<string>();
  while (g.phase !== 'gameover' && steps++ < 20000) {
    // humans act after a short "thinking" delay
    now += 400;
    for (let i = 0; i < nHumans; i++) { if (rnd() < 0.5) humanAct(g, 'h' + i, now, rnd); leakCheck(g, 'h' + i, now); }
    tick(g, now);
    const ex = g.round?.exchanges.at(-1); if (ex?.targetId?.startsWith('h')) grilledHumans.add(ex.targetId + ':' + g.round!.n);
    const w = nextWake(g); if (w != null && w > now + 400 && rnd() < 0.3) now = w;
  }
  if (g.phase !== 'gameover') fail(`seed ${seed}: stuck in ${g.phase}`);
  if (practice) for (let rn = 1; rn <= 2; rn++) if (!grilledHumans.has('h0:' + rn)) fail(`seed ${seed}: human not grilled in round ${rn}`);
  return (now - start) / 60000;
}

const times: number[] = [];
for (let seed = 1; seed <= 150; seed++) {
  times.push(play(seed, 1, 3, true, seed % 2 ? 'party' : 'espanol'));
  times.push(play(seed + 1000, 5, 0, false, 'party'));
  times.push(play(seed + 2000, 2, 1, false, 'espanol'));
}
console.log(`games: ${times.length}, avg minutes: ${(times.reduce((a,b)=>a+b,0)/times.length).toFixed(1)}, max: ${Math.max(...times).toFixed(1)}`);
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
