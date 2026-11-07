/**
 * Case Logic Prototype engine: one Haunted House round, one human + three bots.
 * Pure functions, no timers, no randomness except a seeded hash, so every round replays exactly.
 *
 * Privileged state (who is the Liar, the case truth, classifications) stays in here.
 * Bots are called with `knowledgeFor()` only; see knowledge.ts and bots.ts.
 */
import {
  CATEGORY,
  CHALLENGES,
  FACTS,
  QUESTIONS,
  TRUTH,
  claimById,
  questionById,
  responseById,
  type Assert,
  type Challenge,
  type Claim,
} from './caseData';
import * as bots from './bots';
import type { BotScript } from './bots';
import type { Judgment, Knowledge, PublicExchange, PublicLine, PublicQuestion, Reason, Role, Trait } from './knowledge';

export type Phase =
  | 'briefing'
  | 'ask'
  | 'answer'
  | 'fuDecide'
  | 'fuAnswer'
  | 'judge'
  | 'judged'
  | 'extraPick'
  | 'review'
  | 'vote'
  | 'voted'
  | 'challenge'
  | 'reveal';

export interface Player {
  id: string;
  name: string;
  kind: 'human' | 'bot';
  suspectId?: string;
  emoji?: string;
  trait?: Trait;
  /** grammatical gender for Spanish labels */
  gender?: 'f' | 'm';
}

export interface Decision {
  pid: string;
  step: 'ask' | 'answer' | 'followUp' | 'respond' | 'judge' | 'vote' | 'challenge';
  n?: number;
  reason: Reason;
}

export interface Exchange {
  n: number;
  kind: 'initial' | 'extra';
  askerId: string;
  respondentId: string;
  questionId: string | null;
  /** extra interrogation that follows up an earlier claim */
  followUpOf?: number;
  claimId: string | null;
  claimOrder: string[];
  fuAsked: boolean | null;
  responseId: string | null;
  fuOrder: string[];
  judgments: Record<string, Judgment>;
  closed: boolean;
}

export type ScenarioId = 'detective' | 'liar' | 'qa-contradiction' | 'qa-bluff' | 'qa-all-disclosed';

export interface State {
  seed: string;
  scenario: ScenarioId;
  players: Player[];
  humanId: string;
  liarId: string;
  /** respondent order for the four initial interrogations */
  order: string[];
  phase: Phase;
  ex: Exchange[];
  votes: Record<string, string>;
  challenge: { slot: string | null; order: string[]; answer: string | null; omitted: boolean } | null;
  decisions: Decision[];
  script: BotScript;
}

export type Action =
  | { type: 'start'; pid: string }
  | { type: 'ask'; pid: string; questionId: string }
  | { type: 'answer'; pid: string; claimId: string }
  | { type: 'fuDecide'; pid: string; ask: boolean }
  | { type: 'fuAnswer'; pid: string; responseId: string }
  | { type: 'judge'; pid: string; judgment: Judgment }
  | { type: 'continue'; pid: string }
  | { type: 'extra'; pid: string; targetId: string; questionId?: string; followUpOf?: number }
  | { type: 'vote'; pid: string; targetId: string }
  | { type: 'challenge'; pid: string; value: string };

/** An action without its player id (the screen fills that in). */
export type HumanAction = Action extends unknown ? (Action extends infer A ? (A extends Action ? Omit<A, 'pid'> : never) : never) : never;

// ---------------------------------------------------------------- seeded randomness

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // mulberry32 finaliser
  h += 0x6d2b79f5;
  let x = h;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
export const randFor = (seed: string) => (key: string) => hash(seed + '|' + key);

function shuffled<X>(xs: X[], r: (k: string) => number, key: string): X[] {
  return xs
    .map((x, i) => ({ x, k: r(key + '|' + i) }))
    .sort((a, b) => a.k - b.k)
    .map((y) => y.x);
}

// ---------------------------------------------------------------- setup

export const BOT_CAST: Omit<Player, 'id'>[] = [
  { name: 'Granny Dot', kind: 'bot', suspectId: 'granny-dot', trait: 'cautious', gender: 'f' },
  { name: 'Chef Bruno', kind: 'bot', suspectId: 'chef-bruno', trait: 'steady', gender: 'm' },
  { name: 'Skater Leo', kind: 'bot', suspectId: 'skater-leo', trait: 'bold', gender: 'm' },
];

export function newGame(opts: { scenario: ScenarioId; seed: string; humanName?: string; humanEmoji?: string }): State {
  const r = randFor(opts.seed);
  const human: Player = { id: 'you', name: opts.humanName || 'You', kind: 'human', emoji: opts.humanEmoji };
  const botPlayers: Player[] = BOT_CAST.map((b, i) => ({ ...b, id: 'b' + (i + 1) }));
  const players = [human, ...botPlayers];
  const [dot, bruno, leo] = botPlayers.map((b) => b.id);
  let liarId: string;
  let order: string[];
  let script: BotScript = {};
  switch (opts.scenario) {
    case 'liar':
      liarId = human.id;
      order = shuffled(players.map((p) => p.id), r, 'order');
      break;
    case 'qa-contradiction':
      // the human asks Skater Leo (the Liar) first, and Leo's first answer is forced to be a gamble
      liarId = leo;
      order = [leo, dot, bruno, human.id];
      script = { liarFirstAnswer: 'conflict' };
      break;
    case 'qa-bluff':
      // Leo (the Liar) answers last, after the detective bots have stated plenty of true details
      liarId = leo;
      order = [dot, bruno, human.id, leo];
      script = { detGreedy: true };
      break;
    case 'qa-all-disclosed':
      // the human is the Liar; detective bots disclose as much as possible so no secret detail is left
      liarId = human.id;
      order = [dot, bruno, leo, human.id];
      script = { detGreedy: true };
      break;
    default:
      liarId = botPlayers[Math.floor(r('liar') * 3)].id;
      order = shuffled(players.map((p) => p.id), r, 'order');
  }
  return {
    seed: opts.seed,
    scenario: opts.scenario,
    players,
    humanId: human.id,
    liarId,
    order,
    phase: 'briefing',
    ex: [],
    votes: {},
    challenge: null,
    decisions: [],
    script,
  };
}

export const roleOf = (s: State, pid: string): Role => (pid === s.liarId ? 'liar' : 'detective');
export const player = (s: State, pid: string) => s.players.find((p) => p.id === pid)!;
export const current = (s: State): Exchange | undefined => s.ex[s.ex.length - 1];

function startInitial(s: State, n: number): State {
  const respondentId = s.order[n];
  const askerId = s.order[(n + 3) % 4];
  const e: Exchange = {
    n,
    kind: 'initial',
    askerId,
    respondentId,
    questionId: null,
    claimId: null,
    claimOrder: [],
    fuAsked: null,
    responseId: null,
    fuOrder: [],
    judgments: {},
    closed: false,
  };
  return { ...s, phase: 'ask', ex: [...s.ex, e] };
}

// ---------------------------------------------------------------- who must act now

export function pending(s: State): string[] {
  const e = current(s);
  switch (s.phase) {
    case 'briefing':
    case 'judged':
    case 'review':
    case 'voted':
    case 'extraPick':
      return [s.humanId];
    case 'ask':
    case 'fuDecide':
      return [e!.askerId];
    case 'answer':
    case 'fuAnswer':
      return [e!.respondentId];
    case 'judge':
      return s.players.filter((p) => p.id !== e!.respondentId && !e!.judgments[p.id]).map((p) => p.id);
    case 'vote':
      return s.players.filter((p) => !s.votes[p.id]).map((p) => p.id);
    case 'challenge':
      return s.challenge && !s.challenge.answer ? [s.liarId] : [];
    default:
      return [];
  }
}

// ---------------------------------------------------------------- public record and role knowledge

const pubLine = (id: string, kind: 'claim' | 'response'): PublicLine => {
  const x = kind === 'claim' ? claimById(id).claim : responseById(id).response;
  return { id: x.id, text: x.text, asserts: x.asserts };
};
export const publicQuestions: PublicQuestion[] = QUESTIONS.map((q) => ({ id: q.id, topic: q.topic, text: q.text }));

/** The claim an exchange is about (its own answer, or the earlier claim it follows up). */
export function claimOf(s: State, e: Exchange): string | null {
  if (e.followUpOf !== undefined) return s.ex[e.followUpOf].claimId;
  return e.claimId;
}

export function publicExchange(s: State, e: Exchange): PublicExchange {
  const cid = claimOf(s, e);
  const q = e.questionId ? publicQuestions.find((x) => x.id === e.questionId)! : null;
  const claim = cid && (e.followUpOf !== undefined || e.claimId) ? pubLine(cid, 'claim') : null;
  return {
    n: e.n,
    kind: e.kind,
    askerId: e.askerId,
    respondentId: e.respondentId,
    question: q,
    followUpOf: e.followUpOf,
    claim: e.followUpOf !== undefined ? null : claim,
    followUpQ: e.fuAsked && cid ? claimById(cid).claim.followUp.q : null,
    response: e.responseId ? pubLine(e.responseId, 'response') : null,
    judgments: e.closed ? { ...e.judgments } : null,
  };
}

/** For an extra follow-up, the earlier claim is shown with it so the context stays together. */
export function contextClaim(s: State, e: Exchange): PublicLine | null {
  const cid = claimOf(s, e);
  return cid ? pubLine(cid, 'claim') : null;
}

export function knowledgeFor(s: State, pid: string): Knowledge {
  const base = {
    me: pid,
    players: s.players.map((p) => ({ id: p.id, name: p.name })),
    testimony: s.ex.map((e) => publicExchange(s, e)),
    questions: publicQuestions,
  };
  if (pid === s.liarId) return { ...base, role: 'liar', category: CATEGORY };
  return {
    ...base,
    role: 'detective',
    evidence: FACTS.map((f) => ({ factId: f.id, text: f.text, details: f.truth })),
  };
}

// ---------------------------------------------------------------- disclosure and the final challenge

/** Details whose TRUE value somebody stated out loud during the round. */
export function disclosedSlots(s: State): Set<string> {
  const out = new Set<string>();
  for (const e of s.ex) {
    const p = publicExchange(s, e);
    for (const l of [p.claim, p.response]) for (const a of l?.asserts ?? []) if (TRUTH[a.slot] === a.value) out.add(a.slot);
  }
  return out;
}

export type Exposure = 'disclosed' | 'hinted' | 'hidden';
/**
 * What the Liar could have learned about each checkable detail, from everything shown to them:
 * public testimony and judgments, the questions, follow-up wording, and every option offered to
 * them when they answered (including the ones they did not pick).
 *  - disclosed: someone stated the true value in testimony
 *  - hinted:    the detail came up in any text the Liar saw (a candidate value, true or not)
 *  - hidden:    nothing the Liar saw said anything about it
 */
export function liarExposure(s: State): Record<string, Exposure> {
  const seen: Assert[] = [];
  for (const e of s.ex) {
    const p = publicExchange(s, e);
    for (const l of [p.claim, p.response, contextClaim(s, e)]) if (l) seen.push(...l.asserts);
    if (e.respondentId === s.liarId) {
      for (const id of e.claimOrder) seen.push(...claimById(id).claim.asserts);
      for (const id of e.fuOrder) seen.push(...responseById(id).response.asserts);
    }
  }
  const disclosed = disclosedSlots(s);
  const out: Record<string, Exposure> = {};
  for (const ch of CHALLENGES) out[ch.slot] = disclosed.has(ch.slot) ? 'disclosed' : seen.some((x) => x.slot === ch.slot) ? 'hinted' : 'hidden';
  return out;
}

export function eligibleChallenges(s: State): Challenge[] {
  const x = liarExposure(s);
  return CHALLENGES.filter((c) => x[c.slot] === 'hidden');
}

// ---------------------------------------------------------------- results

export interface Result {
  tally: Record<string, number>;
  identifiedId: string | null;
  tie: boolean;
  caught: boolean;
  challengeCorrect: boolean | null;
  points: Record<string, { total: number; parts: { code: string; pts: number }[] }>;
}
export function result(s: State): Result {
  const tally: Record<string, number> = Object.fromEntries(s.players.map((p) => [p.id, 0]));
  for (const t of Object.values(s.votes)) tally[t] += 1;
  const max = Math.max(...Object.values(tally));
  const top = Object.keys(tally).filter((id) => tally[id] === max);
  const tie = top.length > 1;
  const identifiedId = tie ? null : top[0];
  const caught = identifiedId === s.liarId;
  const challengeCorrect = s.challenge?.answer && s.challenge.slot ? s.challenge.answer === TRUTH[s.challenge.slot] : null;
  const points: Result['points'] = {};
  for (const p of s.players) {
    const parts: { code: string; pts: number }[] = [];
    if (p.id === s.liarId) {
      if (!caught) parts.push({ code: 'pts.escaped', pts: 2 });
      if (caught && challengeCorrect) parts.push({ code: 'pts.challenge', pts: 1 });
    } else if (s.votes[p.id] === s.liarId) parts.push({ code: 'pts.votedLiar', pts: 1 });
    points[p.id] = { total: parts.reduce((x, y) => x + y.pts, 0), parts };
  }
  return { tally, identifiedId, tie, caught, challengeCorrect: challengeCorrect ?? null, points };
}

// ---------------------------------------------------------------- applying actions

export function canExtraFollowUp(s: State, targetId: string): Exchange[] {
  const followed = new Set(s.ex.filter((e) => e.followUpOf !== undefined).map((e) => e.followUpOf));
  return s.ex.filter((e) => e.respondentId === targetId && e.claimId && e.fuAsked === false && !followed.has(e.n));
}

export function apply(s: State, a: Action): State {
  if (!pending(s).includes(a.pid)) return s; // not your turn, or a duplicate tap
  const e = current(s);
  const r = randFor(s.seed);
  const setEx = (patch: Partial<Exchange>): State => ({ ...s, ex: s.ex.map((x) => (x === e ? { ...x, ...patch } : x)) });
  switch (a.type) {
    case 'start':
      return s.phase === 'briefing' ? startInitial(s, 0) : s;
    case 'ask': {
      if (s.phase !== 'ask' || !e) return s;
      const q = QUESTIONS.find((x) => x.id === a.questionId);
      if (!q) return s;
      const claimOrder = shuffled(q.claims.map((c) => c.id), r, 'claims|' + e.n);
      return { ...setEx({ questionId: q.id, claimOrder }), phase: 'answer' };
    }
    case 'answer': {
      if (s.phase !== 'answer' || !e || !e.claimOrder.includes(a.claimId)) return s;
      return { ...setEx({ claimId: a.claimId }), phase: 'fuDecide' };
    }
    case 'fuDecide': {
      if (s.phase !== 'fuDecide' || !e) return s;
      if (!a.ask) return { ...setEx({ fuAsked: false }), phase: 'judge' };
      const c = claimById(e.claimId!).claim;
      return { ...setEx({ fuAsked: true, fuOrder: shuffled(c.followUp.responses.map((x) => x.id), r, 'fu|' + e.n) }), phase: 'fuAnswer' };
    }
    case 'fuAnswer': {
      if (s.phase !== 'fuAnswer' || !e || !e.fuOrder.includes(a.responseId)) return s;
      return { ...setEx({ responseId: a.responseId }), phase: 'judge' };
    }
    case 'judge': {
      if (s.phase !== 'judge' || !e) return s;
      const next = setEx({ judgments: { ...e.judgments, [a.pid]: a.judgment } });
      if (pending(next).length) return next;
      return { ...next, ex: next.ex.map((x) => (x.n === e.n ? { ...x, closed: true } : x)), phase: 'judged' };
    }
    case 'continue': {
      if (s.phase === 'briefing') return startInitial(s, 0);
      if (s.phase === 'judged') {
        if (s.ex.length < 4) return startInitial(s, s.ex.length);
        if (s.ex.length === 4) return { ...s, phase: 'extraPick' };
        return { ...s, phase: 'review' };
      }
      if (s.phase === 'review') return { ...s, phase: 'vote' };
      if (s.phase === 'voted') {
        const res = result(s);
        if (!res.caught) return { ...s, phase: 'reveal' };
        const eligible = eligibleChallenges(s);
        if (!eligible.length) return { ...s, challenge: { slot: null, order: [], answer: null, omitted: true }, phase: 'reveal' };
        const ch = eligible[Math.floor(r('challenge') * eligible.length)];
        return {
          ...s,
          challenge: { slot: ch.slot, order: shuffled(ch.options.map((o) => o.value), r, 'chopts'), answer: null, omitted: false },
          phase: 'challenge',
        };
      }
      return s;
    }
    case 'extra': {
      if (s.phase !== 'extraPick' || a.pid !== s.humanId || a.targetId === s.humanId) return s;
      const n = s.ex.length;
      const base: Exchange = {
        n,
        kind: 'extra',
        askerId: s.humanId,
        respondentId: a.targetId,
        questionId: null,
        claimId: null,
        claimOrder: [],
        fuAsked: null,
        responseId: null,
        fuOrder: [],
        judgments: {},
        closed: false,
      };
      if (a.followUpOf !== undefined) {
        const earlier = canExtraFollowUp(s, a.targetId).find((x) => x.n === a.followUpOf);
        if (!earlier) return s;
        const c = claimById(earlier.claimId!).claim;
        const e2: Exchange = { ...base, questionId: earlier.questionId, followUpOf: earlier.n, fuAsked: true, fuOrder: shuffled(c.followUp.responses.map((x) => x.id), r, 'fu|' + n) };
        return { ...s, ex: [...s.ex, e2], phase: 'fuAnswer' };
      }
      const q = QUESTIONS.find((x) => x.id === a.questionId);
      if (!q) return s;
      const e2: Exchange = { ...base, questionId: q.id, claimOrder: shuffled(q.claims.map((c) => c.id), r, 'claims|' + n) };
      return { ...s, ex: [...s.ex, e2], phase: 'answer' };
    }
    case 'vote': {
      if (s.phase !== 'vote' || a.targetId === a.pid || !s.players.some((p) => p.id === a.targetId)) return s;
      const next = { ...s, votes: { ...s.votes, [a.pid]: a.targetId } };
      return pending(next).length ? next : { ...next, phase: 'voted' };
    }
    case 'challenge': {
      if (s.phase !== 'challenge' || !s.challenge?.order.includes(a.value)) return s;
      return { ...s, challenge: { ...s.challenge, answer: a.value }, phase: 'reveal' };
    }
  }
  return s;
}

// ---------------------------------------------------------------- bots

const optionsFor = (ids: string[], kind: 'claim' | 'response'): PublicLine[] => ids.map((id) => pubLine(id, kind));

/** One bot action for `pid`, decided from that bot's role knowledge only. */
export function botAct(s: State, pid: string): State {
  const p = player(s, pid);
  if (p.kind !== 'bot' || !pending(s).includes(pid)) return s;
  const e = current(s);
  const k = knowledgeFor(s, pid);
  const rand = randFor(s.seed);
  const key = `${s.phase}|${e?.n ?? 'x'}|${pid}`;
  const log = (step: Decision['step'], reason: Reason): Decision => ({ pid, step, n: e?.n, reason });
  switch (s.phase) {
    case 'ask': {
      const d = bots.chooseQuestion(k, e!.respondentId, rand, key);
      const next = apply(s, { type: 'ask', pid, questionId: d.questionId });
      return { ...next, decisions: [...next.decisions, log('ask', d.reason)] };
    }
    case 'answer':
    case 'fuAnswer': {
      const isClaim = s.phase === 'answer';
      const ids = isClaim ? e!.claimOrder : e!.fuOrder;
      const firstLiarAnswer = isClaim && pid === s.liarId && !s.ex.some((x) => x !== e && x.respondentId === pid && x.claimId);
      const disclosed = s.script.detGreedy ? disclosedSlots(s) : undefined;
      // QA script (test harness, privileged): force a conflicting first answer. The bot itself can't know which is wrong.
      const forced =
        firstLiarAnswer && s.script.liarFirstAnswer === 'conflict'
          ? (() => {
              const pool = ids.filter((id) => claimById(id).claim.kind === 'contradiction');
              return { id: pool[Math.floor(rand(key + '|forced') * pool.length)], reason: { code: 'qa.liar.forcedConflict' } };
            })()
          : null;
      const d =
        forced ??
        bots.chooseLine(k, optionsFor(ids, isClaim ? 'claim' : 'response'), p.trait ?? 'steady', rand, key, s.script, {
          detGreedyDisclosed: disclosed,
        });
      const next = apply(s, isClaim ? { type: 'answer', pid, claimId: d.id } : { type: 'fuAnswer', pid, responseId: d.id });
      return { ...next, decisions: [...next.decisions, log(isClaim ? 'answer' : 'respond', d.reason)] };
    }
    case 'fuDecide': {
      const d = bots.chooseFollowUp(k, pubLine(e!.claimId!, 'claim'), s.script);
      const next = apply(s, { type: 'fuDecide', pid, ask: d.ask });
      return { ...next, decisions: [...next.decisions, log('followUp', d.reason)] };
    }
    case 'judge': {
      // judge the exchange as it now stands (complete), even though it is not closed yet
      const pub = { ...publicExchange(s, e!), claim: contextClaim(s, e!) };
      const d = bots.judge(k, pub, p.trait === 'cautious' ? 2 : 1);
      const next = apply(s, { type: 'judge', pid, judgment: d.judgment });
      return { ...next, decisions: [...next.decisions, log('judge', d.reason)] };
    }
    case 'vote': {
      const d = bots.vote(k, rand, key);
      const next = apply(s, { type: 'vote', pid, targetId: d.targetId });
      return { ...next, decisions: [...next.decisions, log('vote', d.reason)] };
    }
    case 'challenge': {
      if (k.role !== 'liar' || !s.challenge?.slot) return s;
      const d = bots.answerChallenge(k, s.challenge.slot, s.challenge.order.map((v) => ({ value: v })), rand, key);
      const next = apply(s, { type: 'challenge', pid, value: d.value });
      return { ...next, decisions: [...next.decisions, log('challenge', d.reason)] };
    }
  }
  return s;
}

/** Run bots until the human must act (used by tests and QA). */
export function runBots(s: State): State {
  for (let guard = 0; guard < 200; guard++) {
    const who = pending(s).find((id) => player(s, id).kind === 'bot');
    if (!who) return s;
    s = botAct(s, who);
  }
  return s;
}

// ---------------------------------------------------------------- what the human sees

export interface View {
  phase: Phase;
  me: string;
  role: Role;
  players: Player[];
  /** case file blocks: present for Detectives only (the key is absent for the Liar) */
  evidence?: { block: 'A' | 'B' | 'C' }[];
  category: typeof CATEGORY | null;
  testimony: PublicExchange[];
  current: (PublicExchange & { contextClaim: PublicLine | null; myJudgment: Judgment | null; waitingFor: number }) | null;
  /** answer options for the human, only when the human must answer */
  options: PublicLine[] | null;
  followUpQ: Claim['followUp']['q'] | null;
  votes: Record<string, string> | null;
  myVote: string | null;
  challenge: { q: Challenge['q']; options: { value: string; text: Challenge['options'][number]['text'] }[]; answer: string | null } | null;
}

export function viewFor(s: State, pid: string): View {
  const e = current(s);
  const role = roleOf(s, pid);
  const pubCur = e ? publicExchange(s, e) : null;
  const ch = s.challenge?.slot ? CHALLENGES.find((c) => c.slot === s.challenge!.slot)! : null;
  return {
    phase: s.phase,
    me: pid,
    role,
    players: s.players,
    ...(role === 'detective' ? { evidence: [{ block: 'A' as const }, { block: 'B' as const }, { block: 'C' as const }] } : {}),
    category: role === 'liar' ? CATEGORY : null,
    testimony: s.ex.filter((x) => x.closed).map((x) => publicExchange(s, x)),
    current:
      pubCur && e
        ? {
            ...pubCur,
            contextClaim: contextClaim(s, e),
            myJudgment: e.judgments[pid] ?? null,
            waitingFor: s.phase === 'judge' ? pending(s).length : 0,
          }
        : null,
    options:
      s.phase === 'answer' && e?.respondentId === pid
        ? optionsFor(e.claimOrder, 'claim')
        : s.phase === 'fuAnswer' && e?.respondentId === pid
          ? optionsFor(e.fuOrder, 'response')
          : null,
    followUpQ: e && (s.phase === 'fuDecide' || s.phase === 'fuAnswer' || s.phase === 'judge' || s.phase === 'judged') && claimOf(s, e) ? claimById(claimOf(s, e)!).claim.followUp.q : null,
    votes: s.phase === 'voted' || s.phase === 'challenge' || s.phase === 'reveal' ? { ...s.votes } : null,
    myVote: s.votes[pid] ?? null,
    challenge:
      ch && s.challenge
        ? { q: ch.q, options: s.challenge.order.map((v) => ({ value: v, text: ch.options.find((o) => o.value === v)!.text })), answer: s.challenge.answer }
        : null,
  };
}

export { questionById };
export type { Assert };
