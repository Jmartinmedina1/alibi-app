/** Variant B test cases (run: npx tsx src/visual-prototype/b/tests/variantB.test.ts). Named cases, not assertion counts. */
import { CARD_IDS, type CardId } from '../../cards';
import { HUMAN } from '../../engine';
import { applyB, botActB, knowledgeForB, newGameB, pendingB, resultB, viewForB, type StateB } from '../engine';
import { CONNECTIONS, SCENE_IDS, SCENE_NAME } from '../scenes';
import { STRINGS_B } from '../strings';

const results: { name: string; ok: boolean; why?: string }[] = [];
function test(name: string, fn: () => void) {
  try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, why: (e as Error).message }); }
}
function ok(c: unknown, msg: string): asserts c { if (!c) throw new Error(msg); }
const SEEDS = Array.from({ length: 300 }, (_, i) => 'b' + i);
const first = (s: StateB) => viewForB(s, HUMAN).cards[0];

function play(s: StateB, human: { pick?: (s: StateB) => CardId; vote: (s: StateB) => string; guess?: (s: StateB) => (typeof SCENE_IDS)[number] }, each?: (s: StateB) => void): StateB {
  for (let g = 0; g < 50 && s.phase !== 'result'; g++) {
    each?.(s);
    const bot = pendingB(s).find((id) => id !== HUMAN);
    if (bot) { s = botActB(s, bot); continue; }
    if (s.phase === 'briefing') s = applyB(s, { type: 'start', pid: HUMAN });
    else if (s.phase === 'pick') s = applyB(s, { type: 'pick', pid: HUMAN, card: (human.pick ?? first)(s) });
    else if (s.phase === 'reveal') s = applyB(s, { type: 'continue', pid: HUMAN });
    else if (s.phase === 'vote') s = applyB(s, { type: 'vote', pid: HUMAN, targetId: human.vote(s) });
    else if (s.phase === 'guess') s = applyB(s, { type: 'guess', pid: HUMAN, scene: (human.guess ?? ((x) => x.candidates[0]))(s) });
  }
  each?.(s);
  return s;
}
const voteB1 = () => 'b1';

test('Candidate table: no card fits only one picture; every picture has cards it does not fit; pictures differ', () => {
  for (const c of CARD_IDS) ok(SCENE_IDS.filter((s) => CONNECTIONS[s][c]).length >= 2, c + ' fits fewer than two pictures');
  for (const s of SCENE_IDS) {
    const linked = CARD_IDS.filter((c) => CONNECTIONS[s][c]);
    ok(linked.length >= 3 && linked.length <= 5, s + ' has ' + linked.length + ' connected cards');
  }
  for (const a of SCENE_IDS) for (const b of SCENE_IDS) if (a < b) ok(CARD_IDS.some((c) => !!CONNECTIONS[a][c] !== !!CONNECTIONS[b][c]), a + ' and ' + b + ' fit the same cards');
});

test('Variant B Detective round completes; a guess happens only when the Liar is identified (300 seeds)', () => {
  let guesses = 0;
  for (const seed of SEEDS) {
    let sawGuess = false;
    const s = play(newGameB({ scenario: 'b-detective', seed }), { vote: (x) => x.liarId }, (x) => { if (x.phase === 'guess') sawGuess = true; });
    ok(s.phase === 'result', seed + ' unfinished');
    const r = resultB(s);
    ok(sawGuess === r.caught && (s.guess !== null) === r.caught, seed + ': guess phase does not match being caught');
    if (sawGuess) guesses++;
  }
  ok(guesses > 0, 'never reached the guess');
});

test('Variant B Liar round completes, including the human guess (300 seeds)', () => {
  for (const seed of SEEDS) {
    const s = play(newGameB({ scenario: 'b-liar', seed }), { vote: voteB1 });
    ok(s.phase === 'result' && s.liarId === HUMAN, seed);
  }
});

test('Liar view: no picture before the vote; three unmarked, unnamed pictures at the guess; names only at the result', () => {
  for (const seed of SEEDS)
    play(newGameB({ scenario: 'b-qa-caught', seed }), { vote: voteB1 }, (s) => {
      const v = viewForB(s, HUMAN);
      const json = JSON.stringify(v);
      if (s.phase !== 'guess' && s.phase !== 'result') {
        ok(!v.secret && !v.candidates, 'picture in Liar view during ' + s.phase);
        for (const id of SCENE_IDS) ok(!json.includes('"' + id + '"'), id + ' leaked in ' + s.phase);
      }
      if (s.phase === 'guess') {
        ok(!v.secret && v.candidates?.length === 3, 'guess view wrong');
        ok(v.candidates.every((c) => !c.name), 'names shown before the guess');
        for (const n of Object.values(SCENE_NAME)) ok(!json.includes(n.en) && !json.includes(n.es), 'title leaked at the guess');
      }
    });
});

test('Liar bot knowledge: nothing about the picture before the guess; identical whichever candidate is the secret', () => {
  for (const seed of SEEDS)
    play(newGameB({ scenario: 'b-detective', seed }), { vote: (x) => x.liarId }, (s) => {
      const k = knowledgeForB(s, s.liarId);
      ok(!('secret' in k), 'secret in Liar knowledge');
      if (s.phase !== 'guess' && s.phase !== 'result') ok(k.role === 'liar' && k.candidates === null, 'candidates before the guess');
      for (const other of SCENE_IDS) ok(JSON.stringify(knowledgeForB({ ...s, secret: other }, s.liarId)) === JSON.stringify(k), 'Liar knowledge depends on the secret');
    });
});

test('Liar bot pick and guess do not depend on which picture is secret (given the same public cards)', () => {
  for (const seed of SEEDS) {
    let s = applyB(newGameB({ scenario: 'b-detective', seed }), { type: 'start', pid: HUMAN });
    const liar = s.liarId;
    const before = botActB(s, liar).picks[liar];
    for (const other of SCENE_IDS) ok(botActB({ ...s, secret: other }, liar).picks[liar] === before, 'Liar pick depends on the secret');
    // drive to a guess with the same public picks, then swap the secret
    s = play(newGameB({ scenario: 'b-detective', seed }), { vote: () => liar }, () => {});
    if (s.guess) {
      const atGuess = { ...s, phase: 'guess' as const, guess: null };
      const g = botActB(atGuess, liar).guess;
      for (const other of SCENE_IDS) ok(botActB({ ...atGuess, secret: other }, liar).guess === g, 'Liar guess depends on the secret');
    }
  }
});

test('Detective bots only pick cards connected to their picture', () => {
  for (const seed of SEEDS) {
    const s = play(newGameB({ scenario: 'b-liar', seed }), { vote: voteB1 });
    for (const id of ['b1', 'b2', 'b3']) ok(CONNECTIONS[s.secret][s.picks[id]], `${seed}: ${id} picked an unconnected card`);
  }
});

test('Pending picks stay private and the reveal waits for all four', () => {
  for (const seed of SEEDS.slice(0, 100)) {
    let s = applyB(newGameB({ scenario: 'b-detective', seed }), { type: 'start', pid: HUMAN });
    for (const id of ['b1', 'b2', 'b3']) {
      s = botActB(s, id);
      ok(s.phase === 'pick' && viewForB(s, HUMAN).reveal === null, 'revealed early');
      for (const p of s.players) ok(knowledgeForB(s, p.id).reveal === null, 'pending picks in bot knowledge');
    }
    s = applyB(s, { type: 'pick', pid: HUMAN, card: first(s) });
    ok(s.phase === 'reveal' && Object.keys(viewForB(s, HUMAN).reveal!).length === 4, 'not revealed after the last pick');
    ok(applyB(s, { type: 'pick', pid: HUMAN, card: 'mask' }) === s, 'changed after reveal');
  }
});

test('Outcomes: tie or wrong suspect → blended; caught + right guess → named (escapes); caught + wrong guess → found', () => {
  const base = play(newGameB({ scenario: 'b-liar', seed: 'o' }), { vote: voteB1 });
  const others = ['b1', 'b2', 'b3'];
  const tie = resultB({ ...base, votes: { you: 'b1', b1: 'you', b2: 'b1', b3: 'you' }, guess: null });
  ok(tie.tie && tie.outcome === 'blended', 'tie must let the Liar escape');
  const wrong = resultB({ ...base, votes: { you: 'b1', b1: 'b2', b2: 'b1', b3: 'b1' }, guess: null });
  ok(!wrong.caught && wrong.outcome === 'blended', 'wrong suspect');
  const caughtVotes = Object.fromEntries(others.map((o) => [o, HUMAN]));
  ok(resultB({ ...base, votes: { ...caughtVotes, you: 'b1' }, guess: base.secret }).outcome === 'named', 'right guess should escape');
  ok(resultB({ ...base, votes: { ...caughtVotes, you: 'b1' }, guess: SCENE_IDS.find((x) => x !== base.secret)! }).outcome === 'found', 'wrong guess should lose');
  // the guess action: only the Liar, only in the guess phase, only a candidate
  let q = newGameB({ scenario: 'b-qa-caught', seed: 'q' });
  while (q.phase !== 'guess') {
    const bot = pendingB(q).find((id) => id !== HUMAN);
    if (bot) q = botActB(q, bot);
    else if (q.phase === 'briefing') q = applyB(q, { type: 'start', pid: HUMAN });
    else if (q.phase === 'pick') q = applyB(q, { type: 'pick', pid: HUMAN, card: first(q) });
    else if (q.phase === 'reveal') q = applyB(q, { type: 'continue', pid: HUMAN });
    else q = applyB(q, { type: 'vote', pid: HUMAN, targetId: 'b1' });
  }
  ok(applyB(q, { type: 'guess', pid: 'b1', scene: q.secret }) === q, 'a Detective could guess');
  ok(applyB(q, { type: 'guess', pid: HUMAN, scene: 'nope' as never }) === q, 'a non-candidate was accepted');
});

test('QA "always caught" reaches the guess every time (forced, kept out of ordinary numbers)', () => {
  for (const seed of SEEDS.slice(0, 50)) {
    let saw = false;
    play(newGameB({ scenario: 'b-qa-caught', seed }), { vote: voteB1 }, (s) => { if (s.phase === 'guess') saw = true; });
    ok(saw, 'no guess');
  }
});

test('Replays are reproducible; every picture can be the secret', () => {
  const seen = new Set<string>();
  for (const seed of SEEDS) {
    const a = play(newGameB({ scenario: 'b-detective', seed }), { vote: voteB1 });
    const b = play(newGameB({ scenario: 'b-detective', seed }), { vote: voteB1 });
    ok(JSON.stringify(a) === JSON.stringify(b), 'not reproducible');
    seen.add(a.secret);
  }
  ok(seen.size === 3, 'not every picture is used');
});

test('English and Spanish strings for Variant B are complete', () => {
  for (const [k, v] of Object.entries(STRINGS_B)) ok(v.en.trim() && v.es.trim() && (v.en.match(/\{\w+\}/g) ?? []).join() === (v.es.match(/\{\w+\}/g) ?? []).join(), k);
  for (const n of Object.values(SCENE_NAME)) ok(n.en && n.es, 'scene name');
});

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  → ' + r.why}`);
console.log(`\n${results.length - failed.length}/${results.length} test cases passed`);
if (failed.length) process.exit(1);
