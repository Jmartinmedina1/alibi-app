/**
 * Bot decisions. This file must not import case truth: every function only sees the role's
 * Knowledge (see knowledge.ts) and the public options it is choosing between.
 * Liar functions take LiarKnowledge (category + public testimony), never evidence.
 *
 * Every decision returns a Reason describing the rule actually used, including when a choice
 * came from a random draw, so the reveal never invents an explanation after the fact.
 */
import type { Assert } from './caseData';
import type { DetectiveKnowledge, Judgment, Knowledge, LiarKnowledge, PublicExchange, PublicLine, PublicQuestion, Reason, Trait } from './knowledge';

export type Rand = (key: string) => number;

/** QA-only overrides. Any decision they force is labelled as forced in its Reason. */
export interface BotScript {
  /** QA (applied by the engine, not the bot): the Liar's first answer is forced to a conflicting claim */
  liarFirstAnswer?: 'conflict';
  /** detective bots give the most informative true answer and always follow up */
  detGreedy?: boolean;
}

const VAGUE_P: Record<Trait, number> = { cautious: 0.5, steady: 0.25, bold: 0.1 };
const GAMBLE_P: Record<Trait, number> = { cautious: 0.1, steady: 0.25, bold: 0.5 };

const pct = (x: number) => Math.round(x * 100);

function pick<X>(xs: X[], r: number): X {
  return xs[Math.min(xs.length - 1, Math.floor(r * xs.length))];
}

/** Every line said so far, with its speaker. */
function spoken(k: Knowledge): { speaker: string; line: PublicLine; n: number }[] {
  const out: { speaker: string; line: PublicLine; n: number }[] = [];
  for (const e of k.testimony) {
    if (e.claim) out.push({ speaker: e.respondentId, line: e.claim, n: e.n });
    if (e.response) out.push({ speaker: e.respondentId, line: e.response, n: e.n });
  }
  return out;
}

// ---------------------------------------------------------------- Detective reasoning (uses evidence)

export type EvidenceCheck = { status: 'supports' | 'conflicts' | 'none'; matched: Assert[]; clashed: Assert[] };

export function checkAgainstEvidence(k: DetectiveKnowledge, asserts: Assert[]): EvidenceCheck {
  const truth = new Map<string, string>();
  for (const f of k.evidence) for (const d of f.details) truth.set(d.slot, d.value);
  const matched: Assert[] = [];
  const clashed: Assert[] = [];
  for (const a of asserts) {
    const v = truth.get(a.slot);
    if (v === undefined) continue;
    (v === a.value ? matched : clashed).push(a);
  }
  return { status: clashed.length ? 'conflicts' : matched.length ? 'supports' : 'none', matched, clashed };
}

// ---------------------------------------------------------------- Liar reasoning (uses only what was said)

/** For each detail, the values other people have stated (with counts), plus my own statements. */
function heardMap(k: Knowledge, excludeSpeaker?: string) {
  const others = new Map<string, Map<string, number>>();
  const mine = new Map<string, string>();
  for (const s of spoken(k)) {
    for (const a of s.line.asserts) {
      if (s.speaker === k.me) mine.set(a.slot, a.value);
      if (s.speaker === k.me || s.speaker === excludeSpeaker) continue;
      const m = others.get(a.slot) ?? new Map<string, number>();
      m.set(a.value, (m.get(a.value) ?? 0) + 1);
      others.set(a.slot, m);
    }
  }
  return { others, mine };
}
function majority(m: Map<string, number> | undefined): string | undefined {
  if (!m) return undefined;
  let best: string | undefined;
  let n = 0;
  let tie = false;
  for (const [v, c] of m) {
    if (c > n) {
      best = v;
      n = c;
      tie = false;
    } else if (c === n) tie = true;
  }
  return tie ? undefined : best;
}

type LiarStatus = 'safe' | 'risky' | 'unknown' | 'vague';
/** How an option looks to the Liar, judged only against what others (and the Liar) already said. */
export function liarView(k: LiarKnowledge, asserts: Assert[]): LiarStatus {
  if (!asserts.length) return 'vague';
  const { others, mine } = heardMap(k);
  let unknown = false;
  for (const a of asserts) {
    const said = majority(others.get(a.slot)) ?? mine.get(a.slot);
    if (said === undefined) unknown = true;
    else if (said !== a.value) return 'risky';
  }
  return unknown ? 'unknown' : 'safe';
}

// ---------------------------------------------------------------- choosing a question

export function chooseQuestion(k: Knowledge, respondentId: string, rand: Rand, key: string): { questionId: string; reason: Reason } {
  const askedTo = new Set(k.testimony.filter((e) => e.question).map((e) => e.question!.id));
  const topics: PublicQuestion['topic'][] = ['entrance', 'route', 'incident'];
  let score: Record<string, number>;
  let code: string;
  if (k.role === 'liar') {
    // learn: the topic with the fewest details stated so far
    const { others } = heardMap(k);
    score = {};
    for (const tp of topics) score[tp] = 0;
    for (const s of spoken(k)) for (const a of s.line.asserts) {
      const tp = a.slot.startsWith('incident') ? 'incident' : a.slot.startsWith('route') ? 'route' : 'entrance';
      if (others.has(a.slot)) score[tp] += 1;
    }
    code = 'ask.liar.learn';
  } else {
    // cover the case: the topic asked about least so far
    score = { entrance: 0, route: 0, incident: 0 };
    for (const e of k.testimony) if (e.question) score[e.question.topic] += 1;
    code = 'ask.det.coverage';
  }
  const min = Math.min(...topics.map((tp) => score[tp]));
  const bestTopics = topics.filter((tp) => score[tp] === min);
  const topic = pick(bestTopics, rand(key + '|topic'));
  const qs = k.questions.filter((q) => q.topic === topic);
  const fresh = qs.filter((q) => !askedTo.has(q.id));
  const q = pick(fresh.length ? fresh : qs, rand(key + '|q'));
  return { questionId: q.id, reason: { code, p: { topic, tied: bestTopics.length > 1 ? 1 : 0 } } };
}

// ---------------------------------------------------------------- answering (claims and follow-up responses)

export function chooseLine(
  k: Knowledge,
  options: PublicLine[],
  trait: Trait,
  rand: Rand,
  key: string,
  script: BotScript,
  ctx: { detGreedyDisclosed?: Set<string> },
): { id: string; reason: Reason } {
  const usedText = new Set(spoken(k).map((s) => s.line.id));
  if (k.role === 'detective') {
    const checks = options.map((o) => ({ o, c: checkAgainstEvidence(k, o.asserts) }));
    const true_ = checks.filter((x) => x.c.status === 'supports');
    const vague = checks.filter((x) => x.c.status === 'none');
    if (script.detGreedy && true_.length) {
      const fresh = (x: (typeof true_)[number]) => x.c.matched.filter((a) => !ctx.detGreedyDisclosed?.has(a.slot)).length;
      const best = [...true_].sort((a, b) => fresh(b) - fresh(a))[0];
      return { id: best.o.id, reason: { code: 'qa.det.greedy' } };
    }
    const p = VAGUE_P[trait];
    if (vague.length && (rand(key + '|vague') < p || !true_.length)) {
      return { id: pick(vague, rand(key + '|pickv')).o.id, reason: { code: 'det.vague', p: { trait, pct: pct(p) } } };
    }
    const unused = true_.filter((x) => !usedText.has(x.o.id));
    const pool = unused.length ? unused : true_;
    return { id: pick(pool, rand(key + '|pick')).o.id, reason: { code: 'det.true', p: { unused: unused.length ? 1 : 0, options: pool.length } } };
  }
  // Liar
  const views = options.map((o) => ({ o, v: liarView(k, o.asserts) }));
  const safe = views.filter((x) => x.v === 'safe');
  if (safe.length) {
    const most = Math.max(...safe.map((x) => x.o.asserts.length));
    const top = safe.filter((x) => x.o.asserts.length === most);
    const unused = top.filter((x) => !usedText.has(x.o.id));
    const pool = unused.length ? unused : top;
    return { id: pick(pool, rand(key + '|safe')).o.id, reason: { code: 'liar.safe', p: { details: most } } };
  }
  const unknown = views.filter((x) => x.v === 'unknown');
  const vague = views.filter((x) => x.v === 'vague');
  const p = GAMBLE_P[trait];
  if (unknown.length && (rand(key + '|gamble') < p || !vague.length)) {
    return { id: pick(unknown, rand(key + '|picku')).o.id, reason: { code: 'liar.gamble', p: { trait, pct: pct(p) } } };
  }
  if (vague.length) return { id: pick(vague, rand(key + '|pickv')).o.id, reason: { code: 'liar.vague', p: { trait, pct: pct(p), risky: views.filter((x) => x.v === 'risky').length } } };
  // only risky options remain
  return { id: pick(views, rand(key + '|pickr')).o.id, reason: { code: 'liar.noSafe' } };
}

// ---------------------------------------------------------------- follow-up decision (asker)

export function chooseFollowUp(k: Knowledge, claim: PublicLine, script: BotScript): { ask: boolean; reason: Reason } {
  if (k.role === 'detective') {
    if (script.detGreedy) return { ask: true, reason: { code: 'qa.det.alwaysFollow' } };
    const c = checkAgainstEvidence(k, claim.asserts);
    if (c.status === 'conflicts') return { ask: true, reason: { code: 'fu.det.conflict' } };
    if (c.status === 'none') return { ask: true, reason: { code: 'fu.det.vague' } };
    return { ask: false, reason: { code: 'fu.det.skipFits' } };
  }
  // Liar: wants details it has not heard yet
  return claim.asserts.length <= 1
    ? { ask: true, reason: { code: 'fu.liar.more', p: { details: claim.asserts.length } } }
    : { ask: false, reason: { code: 'fu.liar.enough', p: { details: claim.asserts.length } } };
}

// ---------------------------------------------------------------- judgments

/** True when the response states a different value for a detail the claim stated (a public fact). */
export function changedStory(e: Pick<PublicExchange, 'claim' | 'response'>): boolean {
  if (!e.claim || !e.response) return false;
  return e.response.asserts.some((r) => e.claim!.asserts.some((c) => c.slot === r.slot && c.value !== r.value));
}

export function judge(k: Knowledge, e: PublicExchange): { judgment: Judgment; reason: Reason } {
  const items = [e.claim, e.response].filter(Boolean) as PublicLine[];
  if (k.role === 'detective') {
    const revised = changedStory(e);
    const checks = items.map((l) => checkAgainstEvidence(k, l.asserts));
    // a conflicting detail that the speaker later replaced with the true value counts as a change of story
    const finalConflict = checks.some((c, i) =>
      c.clashed.some((cl) => !items.slice(i + 1).some((later) => later.asserts.some((a) => a.slot === cl.slot && a.value !== cl.value))),
    );
    if (finalConflict) return { judgment: 'conflict', reason: { code: 'judge.det.conflict' } };
    if (revised) return { judgment: 'unclear', reason: { code: 'judge.det.revised' } };
    if (checks.some((c) => c.status === 'supports')) return { judgment: 'fits', reason: { code: 'judge.det.fits' } };
    return { judgment: 'unclear', reason: { code: 'judge.det.nothing' } };
  }
  // Liar: compare with what others said before
  const { others } = heardMap(k, e.respondentId);
  let match = false;
  for (const l of items)
    for (const a of l.asserts) {
      const said = majority(others.get(a.slot));
      if (said === undefined) continue;
      if (said !== a.value) return { judgment: 'conflict', reason: { code: 'judge.liar.differs' } };
      match = true;
    }
  if (match) return { judgment: 'fits', reason: { code: 'judge.liar.matches' } };
  // Nothing to compare with. A specific answer that contradicts nothing heard so far gets "fits" so the
  // Liar blends in with Detectives (who can check); a vague answer gets "not enough information".
  if (items.some((l) => l.asserts.length)) return { judgment: 'fits', reason: { code: 'judge.liar.blend' } };
  return { judgment: 'unclear', reason: { code: 'judge.liar.nothing' } };
}

// ---------------------------------------------------------------- voting

export function vote(k: Knowledge, rand: Rand, key: string): { targetId: string; reason: Reason } {
  const others = k.players.filter((p) => p.id !== k.me).map((p) => p.id);
  const score: Record<string, number> = Object.fromEntries(others.map((id) => [id, 0]));
  if (k.role === 'detective') {
    for (const e0 of k.testimony) {
      if (!score.hasOwnProperty(e0.respondentId)) continue;
      // an extra follow-up is judged together with the earlier claim it asks about
      const e = e0.followUpOf !== undefined ? { ...e0, claim: k.testimony.find((x) => x.n === e0.followUpOf)?.claim ?? null } : e0;
      const items = [e.claim, e.response].filter(Boolean) as PublicLine[];
      if (!items.length) continue;
      const j = judge(k, e).judgment;
      const revised = changedStory(e);
      const anyTrue = items.some((l) => checkAgainstEvidence(k, l.asserts).status === 'supports');
      score[e.respondentId] += j === 'conflict' ? 3 : revised ? 2 : anyTrue ? -1 : 1;
    }
  } else {
    for (const e of k.testimony) {
      if (!e.judgments || !score.hasOwnProperty(e.respondentId)) continue;
      for (const [pid, j] of Object.entries(e.judgments)) {
        if (pid === k.me) continue;
        score[e.respondentId] += j === 'conflict' ? 2 : j === 'unclear' ? 1 : 0;
      }
    }
  }
  const max = Math.max(...others.map((id) => score[id]));
  const top = others.filter((id) => score[id] === max);
  const targetId = pick(top, rand(key + '|vote'));
  return {
    targetId,
    reason: { code: k.role === 'detective' ? 'vote.det' : 'vote.liar', p: { score: max, tied: top.length > 1 ? top.length : 0 } },
  };
}

// ---------------------------------------------------------------- final bluff (Liar only)

export function answerChallenge(k: LiarKnowledge, slot: string, options: { value: string }[], rand: Rand, key: string): { value: string; reason: Reason } {
  const { others } = heardMap(k);
  const said = majority(others.get(slot));
  if (said && options.some((o) => o.value === said)) return { value: said, reason: { code: 'challenge.heard' } };
  return { value: pick(options, rand(key + '|ch')).value, reason: { code: 'challenge.guess', p: { n: options.length } } };
}
