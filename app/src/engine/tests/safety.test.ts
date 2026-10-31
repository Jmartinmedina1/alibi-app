// Name filter, avatar whitelist, settings validation, host kick, and mid-game arrivals.
import { addBot, addPlayer, apply, createGame, setConnected, tick } from '../engine';
import { cleanName } from '../names';
import { viewFor } from '../view';
import { getLocation } from '../content';
let fail = 0;
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.error('FAIL', m); } };

ok(cleanName('Detective Tamale') === 'Detective Tamale', 'normal name kept');
ok(cleanName('f u c k') === null && cleanName('PUTA madre') === null && cleanName('Sh1t') === null, 'bad names rejected');
ok(cleanName('Ana Lopez') === 'Ana Lopez' && cleanName('Killian') === 'Killian' && cleanName('Computadora') === 'Computadora', 'no false positives');

let now = 1_000_000;
const g = createGame({ code: 'SAFE', host: { id: 'h', name: 'Shit Lord', emoji: '<script>' }, settings: { rounds: 2 }, seed: 3, now });
ok(g.players[0].name === 'Detective' && g.players[0].emoji === '🐬', 'host name and avatar cleaned');
addPlayer(g, { id: 'a', name: 'fuuuck', emoji: 'BADTEXT' });
ok(!/fu/i.test(g.players[1].name) && g.players[1].emoji === '🐬', 'joiner name and avatar cleaned');
apply(g, 'h', { type: 'settings', settings: { rounds: 999 as any, pack: 'evil' as any, difficulty: 'hard', pace: 'slow' } }, now);
ok(g.settings.rounds === 2 && g.settings.pack === 'party' && g.settings.difficulty === 'hard' && g.settings.pace === 'slow', 'settings validated');
addBot(g);
apply(g, 'h', { type: 'start' }, now);
for (let i = 0; i < 50 && g.phase !== 'case'; i++) { now += 60_000; tick(g, now); }

// Mid-game arrival waits, sees no secrets, joins next round
addPlayer(g, { id: 'late', name: 'Latecomer', emoji: '🐸' });
ok(!g.players.some((p) => p.id === 'late') && g.waiting?.length === 1, 'late arrival waits');
const lv = viewFor(g, 'late', now);
const loc = getLocation(g.round!.locationId);
ok(lv.waiting === true && !JSON.stringify(lv).includes(loc.fullName) && lv.locationId === undefined, 'waiting view has no secret');
for (let i = 0; i < 400 && g.roundIndex < 1; i++) { now += 60_000; tick(g, now); }
for (let i = 0; i < 50 && g.phase !== 'case'; i++) { now += 60_000; tick(g, now); }
ok(g.players.some((p) => p.id === 'late') && !g.waiting?.length, 'late arrival joins next round');

// Kick mid-game: absent and can't rejoin
apply(g, 'h', { type: 'kick', playerId: 'a' }, now);
ok(g.players.find((p) => p.id === 'a')?.connected === false, 'kicked player is out');
let threw = false; try { addPlayer(g, { id: 'a', name: 'Back', emoji: '🐸' }); } catch { threw = true; }
ok(threw, 'kicked player cannot rejoin');
threw = false; try { apply(g, 'late', { type: 'kick', playerId: 'h' }, now); } catch { threw = true; }
ok(threw, 'only the host kicks');
setConnected(g, 'late', false);

console.log(fail ? `${fail} FAILURES` : 'SAFETY OK');
process.exit(fail ? 1 : 0);
