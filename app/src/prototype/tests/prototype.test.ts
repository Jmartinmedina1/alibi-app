/**
 * Case Logic Prototype checks. Run: npx tsx src/prototype/tests/prototype.test.ts
 *
 * What these can prove: structure and relationships (classification matches the stated details,
 * every branch exists and is reachable, role knowledge never contains privileged data, rules for
 * ties/scoring/challenge). What they cannot prove: that a sentence reads naturally or that a
 * human finds the reasoning fair. That needs the manual matrix review and playtests.
 */
// node built-ins without pulling @types/node into the app's tsconfig
declare const require: (m: string) => any;
declare const __dirname: string;
const { readFileSync } = require('fs') as { readFileSync: (p: string, enc: string) => string };
const { join } = require('path') as { join: (...p: string[]) => string };
import {
  CHALLENGES,
  EVIDENCE_BLOCKS,
  FACTS,
  LOCATION,
  QUESTIONS,
  TOPIC_SLOTS,
  TRUTH,
  classify,
  claimById,
  relateToFacts,
  type T,
} from '../caseData';
import * as bots from '../bots';
import {
  apply,
  botAct,
  current,
  disclosedSlots,
  liarExposure,
  knowledgeFor,
  newGame,
  pending,
  player,
  publicExchange,
  result,
  runBots,
  viewFor,
  type State,
} from '../engine';
import type { LiarKnowledge } from '../knowledge';
import { explainLine, reasonText, s as str } from '../strings';
import { playRound } from './play';

let failures = 0;
let checks = 0;
function ok(cond: unknown, msg: string) {
  checks++;
  if (!cond) {
    failures++;
    console.error('FAIL:', msg);
  }
}
const section = (name: string) => console.log('·', name);

// ---------------------------------------------------------------- content contract
section('content contract');
const allIds = new Set<string>();
const allT: { where: string; t: T }[] = [];
const KIND_CLS = { compatible: 'supports', contradiction: 'conflicts', extra: 'inconclusive', vague: 'inconclusive' } as const;
for (const q of QUESTIONS) {
  allT.push({ where: q.id, t: q.text });
  for (const c of q.claims) {
    allIds.add(c.id);
    allT.push({ where: c.id, t: c.text }, { where: c.id + ' fu', t: c.followUp.q });
    // the answer talks about the question's topic
    for (const x of c.asserts) ok(TOPIC_SLOTS[q.topic].includes(x.slot), `${c.id} states ${x.slot}, which is off-topic for ${q.topic}`);
    ok(c.followUp.responses.length === 3, c.id + ' needs 3 follow-up responses');
    if (c.kind === 'contradiction') ok(c.followUp.responses.some((r) => r.revises), c.id + ' (contradiction) needs a correction branch');
    for (const line of [c, ...c.followUp.responses]) {
      if (line !== c) {
        ok(!allIds.has(line.id), 'duplicate id ' + line.id);
        allIds.add(line.id);
        allT.push({ where: line.id, t: line.text });
      }
      // the reviewed kind must agree with the details the sentence states (no hidden "wrong" labels)
      ok(KIND_CLS[line.kind] === line.cls, `${line.id}: kind ${line.kind} vs cls ${line.cls}`);
      ok(classify(line.asserts) === line.cls, `${line.id}: reviewed as ${line.kind}, but its stated details compute as ${classify(line.asserts)}`);
      // every contradiction carries a written reason and an answer to "could both be true?"
      if (line.kind === 'contradiction') {
        ok(!!line.why?.en && !!line.why?.es && !!line.reconcile?.en && !!line.reconcile?.es, line.id + ' contradiction lacks why/reconcile');
        if (line.why) allT.push({ where: line.id + ' why', t: line.why });
        if (line.reconcile) allT.push({ where: line.id + ' reconcile', t: line.reconcile });
      } else ok(!line.why && !line.reconcile, line.id + ' has a contradiction reason but is not a contradiction');
      if (line.note) allT.push({ where: line.id + ' note', t: line.note });
      // no colour-only traps: no contradiction rests on a colour swap
      for (const x of line.asserts) ok(!/blue|yellow|purple|orange/.test(x.value), `${line.id} uses a colour-swap value ${x.value}`);
    }
    for (const r of c.followUp.responses) {
      const changes = r.asserts.some((x) => c.asserts.some((y) => y.slot === x.slot && y.value !== x.value));
      ok(!!r.revises === changes, `${r.id}: marked correction=${!!r.revises} but changes its own claim=${changes}`);
    }
  }
}
// the illuminated-sign example is an unsupported extra detail, not a contradiction
ok(claimById('q3d').claim.kind === 'extra' && claimById('q3d').claim.asserts.length === 0, 'glowing signs must be inconclusive (extra detail)');
// every contradiction names the explicit fact it contradicts
for (const q of QUESTIONS)
  for (const c of q.claims)
    for (const line of [c, ...c.followUp.responses]) {
      const rel = relateToFacts(line.asserts);
      if (line.kind === 'contradiction') ok(rel.conflicts.length > 0, line.id + ' contradicts without an explicit fact');
    }
// every fact can be confirmed and contradicted somewhere (so evidence matters)
for (const f of FACTS) {
  const lines = QUESTIONS.flatMap((q) => q.claims.flatMap((c) => [c, ...c.followUp.responses]));
  ok(lines.some((l) => relateToFacts(l.asserts).supports.includes(f.id)), 'no line supports fact ' + f.id);
  // a fact may deliberately have no contradicting line (e.g. the red curtain: a door or gate could coexist with it)
  if (!['curtain'].includes(f.id)) ok(lines.some((l) => relateToFacts(l.asserts).conflicts.includes(f.id)), 'no line contradicts fact ' + f.id);
}
// challenges: truth is an option, and every challenge slot exists in the case
for (const ch of CHALLENGES) {
  ok(ch.options.some((o) => o.value === TRUTH[ch.slot]), 'challenge ' + ch.slot + ' lacks the true answer');
  ok(new Set(ch.options.map((o) => o.value)).size === ch.options.length, 'duplicate challenge option ' + ch.slot);
  allT.push({ where: 'challenge ' + ch.slot, t: ch.q }, ...ch.options.map((o) => ({ where: 'challenge ' + ch.slot, t: o.text })));
}

// ---------------------------------------------------------------- English / Spanish parity
section('English/Spanish parity');
for (const x of [...allT, ...EVIDENCE_BLOCKS.flatMap((b) => [{ where: b.block, t: b.text }, { where: b.block, t: b.title }]), ...FACTS.map((f) => ({ where: f.id, t: f.text }))]) {
  ok(x.t.en.trim() && x.t.es.trim(), 'missing translation at ' + x.where);
}
for (const lang of ['en', 'es'] as const) {
  for (const q of QUESTIONS)
    for (const c of q.claims) {
      ok(explainLine(c.id, 'claim', lang).lines.length > 0, `no ${lang} explanation for ${c.id}`);
      for (const r of c.followUp.responses) ok(explainLine(r.id, 'response', lang).lines.length > 0, `no ${lang} explanation for ${r.id}`);
    }
}
const reasonCodes = [
  'ask.det.coverage', 'ask.liar.learn', 'det.true', 'det.vague', 'liar.safe', 'liar.gamble', 'liar.vague', 'liar.noSafe', 'qa.det.greedy', 'qa.liar.forcedConflict',
  'qa.det.alwaysFollow', 'fu.det.conflict', 'fu.det.vague', 'fu.det.skipFits', 'fu.liar.more', 'fu.liar.enough', 'judge.det.conflict', 'judge.det.revised', 'judge.det.fits',
  'judge.det.cautious', 'judge.det.nothing', 'judge.liar.differs', 'judge.liar.matches', 'judge.liar.blend', 'judge.liar.nothing', 'vote.det', 'vote.liar', 'challenge.heard', 'challenge.guess',
];
for (const code of reasonCodes) for (const lang of ['en', 'es'] as const) ok(reasonText({ code, p: { topic: 'route', trait: 'bold', pct: 50, details: 1, score: 2, n: 4 } }, lang) !== code, `reason ${code} has no ${lang} text`);

// ---------------------------------------------------------------- every branch is reachable through the engine
section('reachability');
for (const q of QUESTIONS)
  for (const c of q.claims)
    for (const r of c.followUp.responses) {
      let s = apply(newGame({ scenario: 'detective', seed: 'reach' }), { type: 'start', pid: 'you' });
      const e = current(s)!;
      s = apply(s, { type: 'ask', pid: e.askerId, questionId: q.id });
      s = apply(s, { type: 'answer', pid: e.respondentId, claimId: c.id });
      s = apply(s, { type: 'fuDecide', pid: e.askerId, ask: true });
      s = apply(s, { type: 'fuAnswer', pid: e.respondentId, responseId: r.id });
      ok(s.phase === 'judge' && current(s)!.responseId === r.id, `branch ${q.id}/${c.id}/${r.id} not reachable`);
    }

// ---------------------------------------------------------------- the Liar's knowledge boundary
section('liar knowledge boundary');
const FORBIDDEN_KEYS = ['evidence', 'truth', 'cls', 'note', 'why', 'reconcile', 'supports', 'conflicts', 'facts', 'revises', 'liarId', 'location'];
const FORBIDDEN_TEXT = [LOCATION.en, LOCATION.es, ...FACTS.flatMap((f) => [f.text.en, f.text.es]), ...EVIDENCE_BLOCKS.flatMap((b) => [b.text.en, b.text.es])];
function assertClean(obj: unknown, where: string) {
  const json = JSON.stringify(obj);
  for (const k of FORBIDDEN_KEYS) ok(!json.includes(`"${k}"`), `${where} contains key "${k}"`);
  for (const v of ['"compatible"', '"contradiction"']) ok(!json.includes(v), `${where} contains a reviewed classification ${v}`);
  for (const t of FORBIDDEN_TEXT) ok(!json.includes(t), `${where} contains case text: ${t.slice(0, 40)}`);
}
const liarSnapshots: LiarKnowledge[][] = [];
for (const [scenario, n] of [['detective', 60], ['liar', 60], ['qa-bluff', 10], ['qa-contradiction', 10]] as const) {
  for (let i = 0; i < n; i++) {
    const trace: State[] = [];
    playRound(scenario, 'b' + i, {}, trace);
    const snaps: LiarKnowledge[] = [];
    for (const st of trace) {
      if (st.phase === 'reveal') continue;
      const k = knowledgeFor(st, st.liarId) as LiarKnowledge;
      ok(k.role === 'liar', 'liar knowledge has wrong role');
      assertClean(k, `liar knowledge (${scenario}, ${st.phase})`);
      if (st.liarId === st.humanId) assertClean({ ...viewFor(st, st.humanId), players: undefined }, `liar view (${st.phase})`);
      snaps.push(k);
    }
    liarSnapshots.push(snaps);
  }
}
// the decision code itself never imports case truth
const botsSrc = readFileSync(join(__dirname, '..', 'bots.ts'), 'utf8');
ok(!/import\s+\{[^}]*\}\s+from\s+'\.\/caseData'/.test(botsSrc) && /import type \{ Assert \} from '\.\/caseData'/.test(botsSrc), 'bots.ts may only import types from caseData');
ok(!/from '\.\/engine'/.test(botsSrc), 'bots.ts must not import the engine (privileged state)');
// metamorphic check: changing the case truth does not change any Liar decision on the same knowledge
{
  const st = runBots(apply(newGame({ scenario: 'detective', seed: 'meta' }), { type: 'start', pid: 'you' }));
  const k = knowledgeFor(st, st.liarId) as LiarKnowledge;
  const opts = QUESTIONS[2].claims.map((c) => ({ id: c.id, text: c.text, asserts: c.asserts }));
  const r = (key: string) => (key.length % 7) / 7;
  const before = JSON.stringify([bots.chooseLine(k, opts, 'bold', r, 'x', {}, {}), bots.answerChallenge(k, 'route.marker', CHALLENGES[4].options, r, 'x')]);
  const saved = FACTS.map((f) => f.truth.map((x) => x.value));
  FACTS.forEach((f) => f.truth.forEach((x) => (x.value = 'changed-' + x.value)));
  const after = JSON.stringify([bots.chooseLine(k, opts, 'bold', r, 'x', {}, {}), bots.answerChallenge(k, 'route.marker', CHALLENGES[4].options, r, 'x')]);
  FACTS.forEach((f, i) => f.truth.forEach((x, j) => (x.value = saved[i][j])));
  ok(before === after, 'a Liar decision changed when only the hidden case truth changed');
}

// ---------------------------------------------------------------- earlier Liar views never change after the fact
section('no retroactive information');
for (const snaps of liarSnapshots) {
  for (let i = 1; i < snaps.length; i++) {
    const a = snaps[i - 1];
    const b = snaps[i];
    ok(JSON.stringify(a.category) === JSON.stringify(b.category), 'category changed');
    for (const ea of a.testimony) {
      const eb = b.testimony.find((x) => x.n === ea.n)!;
      ok(!!eb, 'exchange disappeared');
      for (const key of Object.keys(ea) as (keyof typeof ea)[]) {
        if (ea[key] === null || ea[key] === undefined) continue; // filling in later is fine
        ok(JSON.stringify(ea[key]) === JSON.stringify(eb[key]), `exchange ${ea.n} field ${String(key)} changed after it was known`);
      }
      ok(Object.keys(eb).every((k2) => k2 in ea || eb[k2 as keyof typeof eb] === undefined), `exchange ${ea.n} gained a new kind of field`);
    }
  }
}

// ---------------------------------------------------------------- bot testimony stays consistent
section('bot consistency');
let liarRevisions = 0;
let detUnusedRule = 0;
for (let i = 0; i < 150; i++) {
  for (const scenario of ['detective', 'liar'] as const) {
    const s = playRound(scenario, 'c' + i);
    for (const p of s.players) {
      if (p.kind !== 'bot') continue;
      const said = new Map<string, string>();
      for (const e of s.ex) {
        if (e.respondentId !== p.id) continue;
        const pub = publicExchange(s, e);
        for (const [line, isCorrection] of [
          [pub.claim, false],
          [pub.response, pub.response && !!pub.claim && pub.response.asserts.some((x) => pub.claim!.asserts.some((y) => y.slot === x.slot && y.value !== x.value))],
        ] as const) {
          for (const a of line?.asserts ?? []) {
            if (p.id !== s.liarId) ok(TRUTH[a.slot] === undefined || TRUTH[a.slot] === a.value, `detective bot ${p.name} stated a false detail ${a.slot}=${a.value}`);
            const prev = said.get(a.slot);
            if (prev && prev !== a.value) {
              if (p.id === s.liarId && isCorrection) liarRevisions++;
              else ok(false, `${p.name} contradicted their own earlier ${a.slot} (${prev} → ${a.value}) without a correction`);
            }
            said.set(a.slot, a.value);
          }
        }
      }
    }
    // detectives avoid repeating identical testimony when an equally good unused option exists
    for (const d of s.decisions) if (d.step === 'answer' && d.reason.code === 'det.true' && d.reason.p?.unused) detUnusedRule++;
  }
}
ok(detUnusedRule > 0, 'the "avoid identical testimony" rule never fired');
// no always-SUS / always-LEGIT: each bot gives at least two different judgments across rounds
{
  const seen: Record<string, Set<string>> = {};
  for (let i = 0; i < 80; i++) {
    const s = playRound('detective', 'j' + i);
    for (const e of s.ex) for (const [pid, j] of Object.entries(e.judgments)) (seen[player(s, pid).name] ??= new Set()).add(j);
  }
  for (const [nm, set] of Object.entries(seen)) if (nm !== 'You') ok(set.size >= 2, `${nm} always gives the same judgment`);
}

// ---------------------------------------------------------------- judgments stay private until everyone has judged
section('judgment privacy');
{
  let s = apply(newGame({ scenario: 'detective', seed: 'priv' }), { type: 'start', pid: 'you' });
  for (let guard = 0; guard < 50 && s.phase !== 'judge'; guard++) {
    const who = pending(s)[0];
    s = player(s, who).kind === 'bot' ? botAct(s, who) : s.phase === 'ask' ? apply(s, { type: 'ask', pid: who, questionId: 'q3' }) : s.phase === 'answer' ? apply(s, { type: 'answer', pid: who, claimId: current(s)!.claimOrder[0] }) : apply(s, { type: 'fuDecide', pid: who, ask: false });
  }
  ok(s.phase === 'judge', 'did not reach judging');
  // let one bot judge, then look from every other seat
  const bot = pending(s).find((id) => player(s, id).kind === 'bot');
  if (bot) s = botAct(s, bot);
  const e = current(s)!;
  ok(Object.keys(e.judgments).length >= 1, 'no judgment recorded');
  for (const p of s.players) {
    const k = knowledgeFor(s, p.id);
    ok(k.testimony.find((x) => x.n === e.n)!.judgments === null, `${p.name} can see judgments before they close`);
    const v = viewFor(s, p.id);
    ok(v.current!.judgments === null, `${p.name}'s view shows judgments before they close`);
    ok(v.current!.myJudgment === (e.judgments[p.id] ?? null), 'own judgment shown wrongly');
  }
  const done = runBots(s);
  const after = pending(done).includes('you') && done.phase === 'judge' ? apply(done, { type: 'judge', pid: 'you', judgment: 'unclear' }) : done;
  ok(after.phase === 'judged' && publicExchange(after, current(after)!).judgments !== null, 'judgments not revealed after closing');
}

// ---------------------------------------------------------------- final challenge uses only undisclosed details
section('final challenge');
{
  let checkedChallenges = 0;
  for (let i = 0; i < 300; i++) {
    const trace: State[] = [];
    const s = playRound(i % 2 ? 'detective' : 'liar', 'ch' + i, { vote: (st) => (st.liarId === st.humanId ? 'b1' : st.liarId) }, trace);
    const atVote = trace.find((x) => x.phase === 'challenge') ?? s;
    if (s.challenge?.slot) {
      checkedChallenges++;
      ok(liarExposure(atVote)[s.challenge.slot] === 'hidden', 'challenge asked about a detail the Liar had already seen mentioned');
    }
  }
  ok(checkedChallenges > 50, 'too few challenges exercised: ' + checkedChallenges);
  // all eight secret details said out loud -> challenge is omitted, and the round still ends cleanly
  let s = apply(newGame({ scenario: 'qa-all-disclosed', seed: 'all' }), { type: 'start', pid: 'you' });
  const plan: [string, string, string][] = [
    ['q1', 'q1c', 'q1c1'], // red curtain, small groups, guide/tickets
    ['q4', 'q4a', 'q4a1'], // dark corridors, green line
    ['q6', 'q6a', 'q6a1'], // exit, masked actor, cupboard
    ['q2', 'q2e', 'q2e3'], // the Liar (human) stays vague
  ];
  for (const [qid, cid, rid] of plan) {
    const e = current(s)!;
    s = apply(s, { type: 'ask', pid: e.askerId, questionId: qid });
    s = apply(s, { type: 'answer', pid: e.respondentId, claimId: cid });
    s = apply(s, { type: 'fuDecide', pid: e.askerId, ask: true });
    s = apply(s, { type: 'fuAnswer', pid: e.respondentId, responseId: rid });
    for (const p of s.players) if (pending(s).includes(p.id)) s = apply(s, { type: 'judge', pid: p.id, judgment: 'unclear' });
    s = apply(s, { type: 'continue', pid: 'you' });
  }
  ok(disclosedSlots(s).size >= CHALLENGES.length, 'plan did not disclose every challenge detail: ' + [...disclosedSlots(s)].join(','));
  s = apply(s, { type: 'extra', pid: 'you', targetId: 'b1', questionId: 'q3' });
  s = apply(s, { type: 'answer', pid: 'b1', claimId: 'q3e' });
  s = apply(s, { type: 'fuDecide', pid: 'you', ask: false });
  for (const p of s.players) if (pending(s).includes(p.id)) s = apply(s, { type: 'judge', pid: p.id, judgment: 'unclear' });
  s = apply(s, { type: 'continue', pid: 'you' });
  s = apply(s, { type: 'continue', pid: 'you' });
  for (const p of s.players) s = apply(s, { type: 'vote', pid: p.id, targetId: p.id === 'you' ? 'b1' : 'you' });
  ok(result(s).caught, 'liar should be caught in the all-disclosed plan');
  s = apply(s, { type: 'continue', pid: 'you' });
  ok(s.phase === 'reveal' && s.challenge?.omitted === true, 'challenge should be omitted when nothing is left to ask');
}

// ---------------------------------------------------------------- judging the complete exchange
section('whole-exchange judging');
{
  // Build the public exchange for a claim + response and ask a Detective bot (evidence-based) to judge it.
  const st = newGame({ scenario: 'detective', seed: 'judge' });
  const det = knowledgeFor(st, 'you');
  const ex = (claimId: string, respId?: string) => {
    const c = claimById(claimId).claim;
    const r = respId ? c.followUp.responses.find((x) => x.id === respId)! : null;
    return { n: 0, kind: 'initial' as const, askerId: 'b1', respondentId: 'b2', question: null, claim: { id: c.id, text: c.text, asserts: c.asserts }, followUpQ: r ? c.followUp.q : null, response: r ? { id: r.id, text: r.text, asserts: r.asserts } : null, judgments: null };
  };
  const cases: [string, string | undefined, string, string][] = [
    ['q3d', undefined, 'unclear', 'glowing signs alone: extra detail, not a contradiction'],
    ['q3d', 'q3d1', 'unclear', 'signs + "arrows and EXIT": still only extra details'],
    ['q3d', 'q3d3', 'conflict', 'signs + "the hallway was brightly lit": now an explicit contradiction'],
    ['q3a', 'q3a1', 'fits', 'green line + dark corridors: compatible'],
    ['q1b', 'q1b2', 'unclear', 'no staff, then corrected to a guide: correction lowers confidence, not a contradiction'],
    ['q2d', 'q2d2', 'conflict', 'corrects "nobody" but "I went in alone" still stands'],
    ['q4b', 'q4b1', 'conflict', 'bright hallway + ceiling lights: the claim still contradicts'],
    ['q1e', 'q1e3', 'unclear', 'a queue + vague: nothing checkable'],
  ];
  // personality changes confidence, not facts: a cautious bot wants two matching details
  ok(bots.judge(det, ex('q6a'), 2).judgment === 'unclear' && bots.judge(det, ex('q6a'), 1).judgment === 'fits', 'cautious threshold: one match is not enough');
  ok(bots.judge(det, ex('q6a', 'q6a1'), 2).judgment === 'fits', 'cautious threshold: three matches are enough');
  ok(bots.judge(det, ex('q5b'), 2).judgment === 'conflict', 'a contradiction is a contradiction for every personality');
  for (const [cid, rid, want, why] of cases) {
    const got = bots.judge(det, ex(cid, rid)).judgment;
    ok(got === want, `judge ${cid}${rid ? '+' + rid : ''}: expected ${want}, got ${got} (${why})`);
  }
}

// ---------------------------------------------------------------- ties and scoring follow the published rules
section('ties and scoring');
function votedState(votes: Record<string, string>, liarId = 'b3'): State {
  const s = newGame({ scenario: 'detective', seed: 'score' });
  return { ...s, liarId, votes, phase: 'voted' };
}
{
  const tie = result(votedState({ you: 'b3', b1: 'b3', b2: 'you', b3: 'you' }));
  ok(tie.tie && tie.identifiedId === null && !tie.caught, '2-2 tie must identify nobody');
  ok(tie.points.b3.total === 2, 'Liar escapes a tie with 2 points');
  ok(tie.points.you.total === 1 && tie.points.b1.total === 1 && tie.points.b2.total === 0, 'detectives who voted for the Liar still get 1 point in a tie');
  const caught = result(votedState({ you: 'b3', b1: 'b3', b2: 'b3', b3: 'you' }));
  ok(caught.caught && caught.points.b3.total === 0, 'caught Liar gets 0 before the challenge');
  const wrong = result(votedState({ you: 'b1', b1: 'b2', b2: 'b1', b3: 'b1' }));
  ok(!wrong.caught && wrong.identifiedId === 'b1' && wrong.points.b3.total === 2, 'wrong suspect identified: Liar escapes');
  // correct final answer: +1, and identification still stands
  let s = votedState({ you: 'b3', b1: 'b3', b2: 'b3', b3: 'you' });
  s = apply(s, { type: 'continue', pid: 'you' });
  if (s.phase === 'challenge') {
    const right = apply(s, { type: 'challenge', pid: 'b3', value: TRUTH[s.challenge!.slot!] });
    const r2 = result(right);
    ok(r2.caught && r2.challengeCorrect === true && r2.points.b3.total === 1, 'correct final answer gives exactly 1 point and keeps the catch');
    ok(r2.points.you.total === 1, 'detectives keep their point when the Liar answers correctly');
  } else ok(false, 'expected a challenge');
}

// ---------------------------------------------------------------- QA scenarios do what they say
section('QA scenarios');
for (let i = 0; i < 20; i++) {
  const s = playRound('qa-contradiction', 'qc' + i, { followUp: () => true });
  const first = s.ex.find((e) => e.respondentId === s.liarId)!;
  ok(first.askerId === s.humanId, 'contradiction scenario: the human should ask the Liar first');
  ok(classify(claimById(first.claimId!).claim.asserts) === 'conflicts', 'contradiction scenario: first Liar answer should conflict');
  ok(s.decisions.some((d) => d.pid === s.liarId && d.reason.code === 'qa.liar.forcedConflict'), 'forced answer must be labelled as forced');
  ok(first.fuAsked === true && !!first.responseId, 'contradiction scenario: follow-up should be answered');
}
{
  let believable = 0;
  for (let i = 0; i < 20; i++) {
    const s = playRound('qa-bluff', 'qb' + i, { question: (st) => (st.ex.length === 4 ? 'q1' : 'q3') });
    if (s.decisions.some((d) => d.pid === s.liarId && d.step === 'answer' && d.reason.code === 'liar.safe')) believable++;
  }
  ok(believable >= 10, 'bluff scenario: the Liar should usually repeat heard details (' + believable + '/20)');
}

// ---------------------------------------------------------------- replay and duplicate taps
section('replay and duplicate taps');
{
  const a = playRound('detective', 'same');
  const b = playRound('detective', 'same');
  ok(JSON.stringify(a) === JSON.stringify(b), 'same seed must replay identically');
  const s0 = apply(newGame({ scenario: 'detective', seed: 'dup' }), { type: 'start', pid: 'you' });
  ok(apply(s0, { type: 'start', pid: 'you' }) === s0, 'a second Start tap must be ignored');
  const notMine = apply(s0, { type: 'vote', pid: 'you', targetId: 'b1' });
  ok(notMine === s0, 'out-of-phase actions must be ignored');
}

// ---------------------------------------------------------------- UI strings exist in both languages
section('UI strings');
for (const key of ['title', 'briefDet', 'briefLiar', 'tieRule', 'scoringRules', 'challengeOmitted', 'founderQ'] as const) {
  ok(str('en', key) !== str('es', key) && str('es', key).length > 0, 'UI string not translated: ' + key);
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
console.log('PROTOTYPE OK');
