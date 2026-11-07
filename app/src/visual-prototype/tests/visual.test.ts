/**
 * Visual Bluffing Prototype — test cases (run: npx tsx src/visual-prototype/tests/visual.test.ts).
 * Reported as named cases. Many cases loop over seeds; the loop count is stated, not summed.
 */
import { SCENE_ASSOCIATIONS } from '../associations';
import * as bots from '../bots';
import { LIAR_WHY_CATEGORY, LIAR_WHY_CROWD } from '../categoryHints';
import { CARD_IDS, CARD_LABEL, type CardId } from '../cards';
import { HUMAN, apply, botAct, knowledgeFor, newGame, pending, result, viewFor, type State } from '../engine';
import { randFor } from '../rand';
import { SCENE_DESCRIPTION, SCENE_KEY, SCENE_NAME } from '../scene';
import { STRINGS } from '../strings';

const results: { name: string; ok: boolean; why?: string }[] = [];
function test(name: string, fn: () => void) {
  try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, why: (e as Error).message }); }
}
function ok(c: unknown, msg: string): asserts c { if (!c) throw new Error(msg); }
const SEEDS = Array.from({ length: 300 }, (_, i) => 's' + i);

/** Play a full ordinary round. The human follows `human` callbacks; bots act from their own rules. */
function play(s: State, human: { pick: (s: State) => CardId; ask?: (s: State) => { targetId: string; card: CardId } | null; vote: (s: State) => string }, each?: (s: State) => void): State {
  for (let guard = 0; guard < 100 && s.phase !== 'result'; guard++) {
    each?.(s);
    const due = pending(s);
    const bot = due.find((id) => id !== HUMAN);
    if (bot) { s = botAct(s, bot); continue; }
    if (s.phase === 'briefing') s = apply(s, { type: 'start', pid: HUMAN });
    else if (s.phase === 'pick') s = apply(s, { type: 'pick', pid: HUMAN, card: human.pick(s) });
    else if (s.phase === 'reveal') s = apply(s, { type: 'continue', pid: HUMAN });
    else if (s.phase === 'challenge') {
      const q = human.ask?.(s);
      if (q && !s.challenge) s = apply(s, { type: 'ask', pid: HUMAN, ...q });
      s = apply(s, { type: 'continue', pid: HUMAN });
    } else if (s.phase === 'vote') s = apply(s, { type: 'vote', pid: HUMAN, targetId: human.vote(s) });
  }
  each?.(s);
  return s;
}
const firstAllowed = (s: State) => viewFor(s, HUMAN).cards.find((c) => !viewFor(s, HUMAN).blocked.includes(c))!;
const voteB1 = () => 'b1';
const askFirstBot = (s: State) => ({ targetId: 'b2', card: s.picks[1].b2 });

const PRIVATE_TEXT = [SCENE_KEY, SCENE_DESCRIPTION.en, SCENE_DESCRIPTION.es, SCENE_NAME.en, SCENE_NAME.es, ...Object.values(SCENE_ASSOCIATIONS).flatMap((a) => [a.why.en, a.why.es])];

test('Detective round completes (300 seeds, human scripted, bots ordinary)', () => {
  for (const seed of SEEDS) {
    const s = play(newGame({ scenario: 'detective', seed }), { pick: firstAllowed, ask: askFirstBot, vote: voteB1 });
    ok(s.phase === 'result', seed + ' did not finish');
    ok(s.liarId !== HUMAN, 'human must be a Detective');
  }
});

test('Liar round completes (300 seeds)', () => {
  for (const seed of SEEDS) {
    const s = play(newGame({ scenario: 'liar', seed }), { pick: firstAllowed, ask: askFirstBot, vote: voteB1 });
    ok(s.phase === 'result' && s.liarId === HUMAN, seed);
  }
});

test('Liar view has no scene reference or private description at any step before the result (300 seeds)', () => {
  for (const seed of SEEDS)
    play(newGame({ scenario: 'liar', seed }), { pick: firstAllowed, ask: askFirstBot, vote: voteB1 }, (s) => {
      if (s.phase === 'result') return;
      const v = viewFor(s, HUMAN);
      ok(!('scene' in v), 'scene key present in Liar view');
      const json = JSON.stringify(v);
      // a Detective bot's spoken answer to the public question is public; nothing else may appear
      const spoken = s.challenge ? [s.challenge.text.en, s.challenge.text.es] : [];
      for (const p of PRIVATE_TEXT) if (!spoken.includes(p)) ok(!json.includes(p), 'Liar view leaks: ' + p.slice(0, 40));
      ok(!json.includes('liarId'), 'Liar view names the Liar field');
    });
});

test('Liar bot knowledge has no scene, associations or description at any step (300 seeds)', () => {
  for (const seed of SEEDS)
    play(newGame({ scenario: 'detective', seed }), { pick: firstAllowed, vote: voteB1 }, (s) => {
      const k = knowledgeFor(s, s.liarId);
      ok(!('scene' in k), 'scene in Liar knowledge');
      const json = JSON.stringify(k);
      for (const p of PRIVATE_TEXT) ok(!json.includes(p), 'Liar knowledge leaks: ' + p.slice(0, 40));
    });
});

test('Detective views never say who the Liar is before the result', () => {
  for (const seed of SEEDS.slice(0, 100))
    play(newGame({ scenario: 'detective', seed }), { pick: firstAllowed, vote: voteB1 }, (s) => {
      if (s.phase !== 'result') ok(!viewFor(s, HUMAN).end && !JSON.stringify(viewFor(s, HUMAN)).includes('"liar'), 'liar leaked');
    });
});

test('Pending selections stay private: views and bot knowledge show only revealed rounds', () => {
  for (const seed of SEEDS)
    play(newGame({ scenario: 'detective', seed }), { pick: firstAllowed, vote: voteB1 }, (s) => {
      if (s.phase !== 'pick') return;
      for (const p of s.players) {
        const v = viewFor(s, p.id);
        ok(v.reveals.length === s.round, 'view shows the current round');
        const k = knowledgeFor(s, p.id);
        ok(k.reveals.length === s.round, 'knowledge contains the current round');
        // a player's own committed pick is visible to themselves only
        ok(v.myPicks.length === s.round + (s.picks[s.round][p.id] ? 1 : 0), "own picks wrong");
      }
    });
});

test('Liar bot choice does not change when pending Detective picks change', () => {
  for (const seed of SEEDS) {
    let s = newGame({ scenario: 'detective', seed });
    s = apply(s, { type: 'start', pid: HUMAN });
    for (const round of [0, 1] as const) {
      // Detectives (including the human) commit first, then the Liar decides; compare with no pending picks
      const dets = s.players.map((p) => p.id).filter((id) => id !== s.liarId);
      const empty = bots.choose(knowledgeFor(s, s.liarId), round, randFor(s.seed), `pick${round}|${s.liarId}`).card;
      for (const id of dets) s = id === HUMAN ? apply(s, { type: 'pick', pid: HUMAN, card: firstAllowed(s) }) : botAct(s, id);
      const after = bots.choose(knowledgeFor(s, s.liarId), round, randFor(s.seed), `pick${round}|${s.liarId}`).card;
      ok(empty === after, `${seed} round ${round}: Liar changed its pick after seeing pending picks`);
      s = botAct(s, s.liarId);
      s = apply(s, { type: 'continue', pid: HUMAN });
    }
  }
});

test('Liar bot decisions ignore the picture; Detective bots use it (associations swapped)', () => {
  const flipped = Object.fromEntries(CARD_IDS.map((c) => [c, { ...SCENE_ASSOCIATIONS[c], score: (3 - SCENE_ASSOCIATIONS[c].score) as 0 | 1 | 2 | 3 }])) as typeof SCENE_ASSOCIATIONS;
  let detDiffers = 0;
  for (const seed of SEEDS) {
    const human = { pick: firstAllowed, vote: voteB1 };
    const a = play(newGame({ scenario: 'liar', seed }), human);
    const b = play(newGame({ scenario: 'liar', seed, assoc: flipped }), human);
    if (JSON.stringify(a.picks) !== JSON.stringify(b.picks)) detDiffers++;
    // Liar bot: same seed, different picture → identical decisions as long as public picks are identical
    const c = play(newGame({ scenario: 'detective', seed }), human);
    const d = play(newGame({ scenario: 'detective', seed, assoc: flipped }), human);
    const liarPicksSame = c.picks[0][c.liarId] === d.picks[0][d.liarId];
    ok(liarPicksSame, seed + ': Liar first pick depends on the picture');
    if (JSON.stringify(c.picks[0]) === JSON.stringify(d.picks[0])) ok(c.picks[1][c.liarId] === d.picks[1][d.liarId], seed + ': Liar second pick depends on the picture');
  }
  ok(detDiffers > SEEDS.length / 2, 'Detective bots did not react to the picture');
});

test('Reveal waits for every submission', () => {
  for (const seed of SEEDS.slice(0, 50)) {
    let s = apply(newGame({ scenario: 'detective', seed }), { type: 'start', pid: HUMAN });
    for (const id of ['b1', 'b2', 'b3']) { s = botAct(s, id); ok(s.phase === 'pick', 'revealed before the human committed'); }
    ok(viewFor(s, HUMAN).reveals.length === 0, 'human sees bot picks before committing');
    s = apply(s, { type: 'pick', pid: HUMAN, card: firstAllowed(s) });
    ok(s.phase === 'reveal' && viewFor(s, HUMAN).reveals[0] && Object.keys(viewFor(s, HUMAN).reveals[0]).length === 4, 'not revealed after the last commit');
  }
});

test('Second selection blocks only your own first card; shared cards are allowed', () => {
  let s = apply(newGame({ scenario: 'detective', seed: 'x' }), { type: 'start', pid: HUMAN });
  s = apply(s, { type: 'pick', pid: HUMAN, card: 'key' });
  for (const id of ['b1', 'b2', 'b3']) s = apply(s, { type: 'pick', pid: id, card: 'key' }); // everyone picks the same card
  ok(s.phase === 'reveal', 'four identical first picks must be allowed');
  s = apply(s, { type: 'continue', pid: HUMAN });
  ok(JSON.stringify(viewFor(s, HUMAN).blocked) === '["key"]', 'blocked list should be exactly your first card');
  const same = apply(s, { type: 'pick', pid: HUMAN, card: 'key' });
  ok(same === s, 'repeating your own first card must be rejected');
  s = apply(s, { type: 'pick', pid: 'b1', card: 'mask' });
  s = apply(s, { type: 'pick', pid: HUMAN, card: 'mask' }); // another player's card this round: allowed
  ok(s.picks[1][HUMAN] === 'mask', 'choosing the same card as another player must be allowed');
  for (const seed of SEEDS) {
    const g = play(newGame({ scenario: 'detective', seed }), { pick: firstAllowed, vote: voteB1 });
    for (const p of g.players) ok(g.picks[0][p.id] !== g.picks[1][p.id], seed + ': ' + p.id + ' repeated its own card');
  }
});

test('Duplicate taps and changes after committing are ignored', () => {
  let s = apply(newGame({ scenario: 'detective', seed: 'y' }), { type: 'start', pid: HUMAN });
  s = apply(s, { type: 'pick', pid: HUMAN, card: 'mask' });
  const again = apply(s, { type: 'pick', pid: HUMAN, card: 'curtain' });
  ok(again === s && s.picks[0][HUMAN] === 'mask', 'changed after committing');
  ok(apply(s, { type: 'continue', pid: HUMAN }) === s, 'out-of-turn continue accepted');
});

test('Challenge answers respect role knowledge, and only one question is allowed', () => {
  const liarTexts = new Set([...Object.values(LIAR_WHY_CATEGORY).flatMap((x) => [x.en, x.es])]);
  const detTexts = new Set(Object.values(SCENE_ASSOCIATIONS).flatMap((a) => [a.why.en, a.why.es]));
  let liarAsked = 0;
  for (const seed of SEEDS) {
    let s = play(newGame({ scenario: 'detective', seed }), { pick: firstAllowed, vote: voteB1 }, () => {});
    // replay up to the challenge phase and ask the Liar about each of its cards
    let g = newGame({ scenario: 'detective', seed });
    while (g.phase !== 'challenge') {
      const bot = pending(g).find((id) => id !== HUMAN);
      if (bot) g = botAct(g, bot);
      else if (g.phase === 'briefing') g = apply(g, { type: 'start', pid: HUMAN });
      else if (g.phase === 'pick') g = apply(g, { type: 'pick', pid: HUMAN, card: firstAllowed(g) });
      else g = apply(g, { type: 'continue', pid: HUMAN });
    }
    for (const target of ['b1', 'b2', 'b3']) for (const r of [0, 1]) {
      const card = g.picks[r][target];
      const asked = apply(g, { type: 'ask', pid: HUMAN, targetId: target, card });
      const txt = asked.challenge!.text;
      ok(!!txt.en && !!txt.es && txt.en.length < 120, 'explanation missing or too long');
      if (target === g.liarId) {
        liarAsked++;
        const crowd = LIAR_WHY_CROWD.en.replace('{card}', CARD_LABEL[card].en);
        ok(liarTexts.has(txt.en) || txt.en === crowd, 'Liar answer not from category/public templates');
        ok(!detTexts.has(txt.en), 'Liar answer uses a picture-based text');
      } else ok(detTexts.has(txt.en), 'Detective answer should come from its picture associations');
      const second = apply(asked, { type: 'ask', pid: HUMAN, targetId: target, card });
      ok(second === asked, 'a second question was accepted');
    }
    const bad = apply(g, { type: 'ask', pid: HUMAN, targetId: 'b1', card: CARD_IDS.find((c) => c !== g.picks[0].b1 && c !== g.picks[1].b1)! });
    ok(bad === g, 'asked about a card the player did not choose');
    void s;
  }
  ok(liarAsked > 0, 'never asked a Liar bot');
});

test('Votes and ties follow the stated rule', () => {
  const base = play(newGame({ scenario: 'detective', seed: 'v' }), { pick: firstAllowed, vote: voteB1 });
  const withVotes = (votes: Record<string, string>) => result({ ...base, votes });
  const L = base.liarId;
  const others = ['you', 'b1', 'b2', 'b3'].filter((x) => x !== L);
  const caught = withVotes(Object.fromEntries(['you', 'b1', 'b2', 'b3'].map((id) => [id, id === L ? others[0] : L])));
  ok(caught.caught && caught.identifiedId === L && !caught.tie, 'clear majority should find the Liar');
  const tie22 = withVotes({ [others[0]]: L, [others[1]]: L, [others[2]]: others[0], [L]: others[0] });
  ok(tie22.tie && tie22.identifiedId === null && !tie22.caught, '2-2 tie must identify nobody (Liar escapes)');
  const wrong = withVotes({ [others[0]]: others[1], [others[2]]: others[1], [L]: others[1], [others[1]]: L });
  ok(!wrong.caught && wrong.identifiedId === others[1], 'wrong suspect: Liar escapes');
  for (const seed of SEEDS.slice(0, 50)) {
    const q = play(newGame({ scenario: 'qa-tie', seed }), { pick: firstAllowed, vote: voteB1 });
    const r = result(q);
    ok(r.tie && Object.values(r.tally).every((n) => n === 1), 'QA tie must be 1-1-1-1');
    ok(viewFor(q, HUMAN).end!.identifiedId === null, 'QA tie view');
  }
});

test('Bot votes are reproducible; equally plausible suspects are broken by seeded randomness', () => {
  let tiedSeen = 0;
  for (const seed of SEEDS) {
    const a = play(newGame({ scenario: 'detective', seed }), { pick: firstAllowed, vote: voteB1 });
    const b = play(newGame({ scenario: 'detective', seed }), { pick: firstAllowed, vote: voteB1 });
    ok(JSON.stringify(a.votes) === JSON.stringify(b.votes) && JSON.stringify(a.picks) === JSON.stringify(b.picks), 'not reproducible');
    tiedSeen += a.log.filter((l) => l.step === 'vote' && Number(l.reason.p?.tied ?? 0) > 0).length;
  }
  ok(tiedSeen > 0, 'no bot ever faced equally plausible suspects (expected sometimes)');
});

test('Detective bots vary between direct and indirect connections for every personality', () => {
  const seen: Record<string, Set<string>> = {};
  for (const seed of SEEDS) {
    const g = play(newGame({ scenario: 'liar', seed }), { pick: firstAllowed, vote: voteB1 });
    for (const l of g.log) if (l.step.startsWith('pick')) (seen[l.pid] ??= new Set()).add(l.reason.code);
  }
  for (const id of ['b1', 'b2', 'b3']) ok(seen[id]?.has('det.direct') && seen[id]?.has('det.indirect'), id + ' never varied');
});

test('Leave and replay: a new round starts clean; same seed replays identically', () => {
  const a = play(newGame({ scenario: 'detective', seed: 'r1' }), { pick: firstAllowed, vote: voteB1 });
  const fresh = newGame({ scenario: 'detective', seed: 'r2' });
  ok(fresh.phase === 'briefing' && !Object.keys(fresh.picks[0]).length && !Object.keys(fresh.votes).length && !fresh.challenge, 'replay not clean');
  const again = play(newGame({ scenario: 'detective', seed: 'r1' }), { pick: firstAllowed, vote: voteB1 });
  ok(JSON.stringify(a) === JSON.stringify(again), 'same seed differs');
});

test('Every player gets the same six concepts, in shuffled positions', () => {
  for (const seed of SEEDS.slice(0, 50)) {
    const g = newGame({ scenario: 'detective', seed });
    const orders = g.players.map((p) => g.layout[p.id].join());
    for (const p of g.players) ok([...g.layout[p.id]].sort().join() === [...CARD_IDS].sort().join(), 'different concepts');
    ok(new Set(orders).size > 1 || seed === 'never', 'every screen has the same order');
  }
});

test('English and Spanish strings and card labels are complete', () => {
  for (const [k, v] of Object.entries(STRINGS)) ok(v.en.trim() && v.es.trim() && (v.en.match(/\{\w+\}/g) ?? []).join() === (v.es.match(/\{\w+\}/g) ?? []).join(), 'string ' + k);
  for (const c of CARD_IDS) ok(CARD_LABEL[c].en && CARD_LABEL[c].es, 'label ' + c);
  for (const a of Object.values(SCENE_ASSOCIATIONS)) ok(a.why.en && a.why.es, 'association text');
  for (const x of Object.values(LIAR_WHY_CATEGORY)) ok(x.en && x.es, 'liar text');
});

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  → ' + r.why}`);
console.log(`\n${results.length - failed.length}/${results.length} test cases passed`);
if (failed.length) process.exit(1);
