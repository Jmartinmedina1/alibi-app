// A 2–2 tie goes to a runoff that only the untied players decide.
import { addPlayer, apply, createGame, tick } from '../engine';
import { viewFor } from '../view';
let fail = 0;
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.error('FAIL', m); } };
let now = 1_000_000;
const g = createGame({ code: 'TIE', host: { id: 'a', name: 'A', emoji: '🐬' }, settings: { rounds: 1 }, seed: 7, now });
for (const id of ['b', 'c', 'd']) addPlayer(g, { id, name: id.toUpperCase(), emoji: '🐸' });
apply(g, 'a', { type: 'start' }, now);
// fast-forward to the vote
for (let i = 0; i < 400 && g.phase !== 'vote'; i++) { now += 60_000; tick(g, now); }
ok(g.phase === 'vote', 'reached vote');
apply(g, 'a', { type: 'vote', targetId: 'b' }, now);
apply(g, 'b', { type: 'vote', targetId: 'a' }, now);
apply(g, 'c', { type: 'vote', targetId: 'b' }, now);
apply(g, 'd', { type: 'vote', targetId: 'a' }, now);
ok(g.phase === 'fingers' && g.round!.runoffPending === true, 'tie leads to runoff');
ok(viewFor(g, 'c', now).runoffNext === true, 'view says runoff next');
now += 60_000; tick(g, now);
ok(g.phase === 'vote' && JSON.stringify(g.round!.runoff!.slice().sort()) === '["a","b"]', 'runoff between a and b');
ok(viewFor(g, 'a', now).canVote === false && viewFor(g, 'c', now).canVote === true, 'only untied players vote');
let threw = false; try { apply(g, 'a', { type: 'vote', targetId: 'b' }, now); } catch { threw = true; }
ok(threw, 'tied player cannot vote in runoff');
threw = false; try { apply(g, 'c', { type: 'vote', targetId: 'd' }, now); } catch { threw = true; }
ok(threw, 'cannot vote for someone outside the runoff');
apply(g, 'c', { type: 'vote', targetId: 'a' }, now);
apply(g, 'd', { type: 'vote', targetId: 'a' }, now);
ok(g.phase === 'fingers' && g.round!.accusedId === 'a' && !g.round!.tie, 'runoff picks a');
console.log(fail ? `${fail} FAILURES` : 'RUNOFF OK');
process.exit(fail ? 1 : 0);
