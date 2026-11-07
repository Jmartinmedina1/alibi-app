/**
 * Visual Bluffing Prototype — one round, pure state machine (no React, no timers).
 *   briefing → pick (round 1) → reveal → pick (round 2) → reveal → challenge (optional) → vote → result
 * Picks are simultaneous: nobody's choice is visible to anyone (human or bot) until all four committed.
 */
import { SCENE_ASSOCIATIONS, type Association } from './associations';
import * as bots from './bots';
import { CARD_IDS, CATEGORY, type CardId, type T } from './cards';
import type { Knowledge, PublicExplanation, Reason, Style } from './knowledge';
import { pick, randFor, shuffled } from './rand';
import { SCENE_DESCRIPTION, SCENE_KEY, SCENE_NAME } from './scene';

export type Role = 'detective' | 'liar';
export type ScenarioId = 'detective' | 'liar' | 'qa-tie';
export type Phase = 'briefing' | 'pick' | 'reveal' | 'challenge' | 'vote' | 'result';
export type Player = { id: string; name: string; kind: 'human' | 'bot'; suspectId?: string; emoji?: string; style: Style };
export type LogEntry = { pid: string; step: 'pick1' | 'pick2' | 'explain' | 'vote'; reason: Reason; card?: CardId; target?: string };

export type State = {
  seed: string;
  scenario: ScenarioId;
  players: Player[];
  liarId: string;
  phase: Phase;
  round: 0 | 1;
  /** where each player's six cards sit on their screen (same six concepts for everyone) */
  layout: Record<string, CardId[]>;
  picks: [Record<string, CardId>, Record<string, CardId>];
  /** number of rounds whose picks have been revealed (0, 1 or 2) */
  revealed: number;
  challenge: PublicExplanation | null;
  votes: Record<string, string>;
  log: LogEntry[];
  /** scene associations used by Detective bots (overridable in tests only) */
  assoc: Record<CardId, Association>;
};

export type Action =
  | { type: 'start'; pid: string }
  | { type: 'pick'; pid: string; card: CardId }
  | { type: 'continue'; pid: string }
  | { type: 'ask'; pid: string; targetId: string; card: CardId }
  | { type: 'vote'; pid: string; targetId: string };

export const HUMAN = 'you';
export const BOT_CAST: Omit<Player, 'id'>[] = [
  { name: 'Granny Dot', kind: 'bot', suspectId: 'granny-dot', style: 'subtle' },
  { name: 'Chef Bruno', kind: 'bot', suspectId: 'chef-bruno', style: 'mixed' },
  { name: 'Skater Leo', kind: 'bot', suspectId: 'skater-leo', style: 'direct' },
];

export function newGame(o: { scenario: ScenarioId; seed: string; humanName?: string; humanEmoji?: string; assoc?: Record<CardId, Association> }): State {
  const r = randFor(o.seed);
  const players: Player[] = [
    { id: HUMAN, name: o.humanName || 'You', kind: 'human', emoji: o.humanEmoji, style: 'mixed' },
    ...BOT_CAST.map((b, i) => ({ ...b, id: 'b' + (i + 1) })),
  ];
  const liarId = o.scenario === 'liar' ? HUMAN : pick(['b1', 'b2', 'b3'], r('liar'));
  const layout = Object.fromEntries(players.map((p) => [p.id, shuffled([...CARD_IDS], r, 'layout|' + p.id)]));
  return { seed: o.seed, scenario: o.scenario, players, liarId, phase: 'briefing', round: 0, layout, picks: [{}, {}], revealed: 0, challenge: null, votes: {}, log: [], assoc: o.assoc ?? SCENE_ASSOCIATIONS };
}

export const roleOf = (s: State, pid: string): Role => (pid === s.liarId ? 'liar' : 'detective');

/** Who still has to act right now. */
export function pending(s: State): string[] {
  const all = s.players.map((p) => p.id);
  switch (s.phase) {
    case 'pick':
      return all.filter((id) => !s.picks[s.round][id]);
    case 'vote': {
      const left = all.filter((id) => !s.votes[id]);
      // QA tie: bots wait for the human so they can force an all-even tally
      return s.scenario === 'qa-tie' && !s.votes[HUMAN] ? [HUMAN] : left;
    }
    case 'result':
      return [];
    default:
      return [HUMAN];
  }
}

/** Everything a bot may use. Pending picks of the current round are never included. */
export function knowledgeFor(s: State, pid: string): Knowledge {
  const me = s.players.find((p) => p.id === pid)!;
  const base = {
    me: pid,
    style: me.style,
    players: s.players.map((p) => p.id),
    cards: [...s.layout[pid]],
    reveals: s.picks.slice(0, s.revealed).map((r) => ({ ...r })),
    explanations: s.challenge ? [{ ...s.challenge }] : [],
    own: s.picks.map((r) => r[pid]).filter((c, i) => c && i < (s.phase === 'pick' ? s.round : 2)) as CardId[],
  };
  return roleOf(s, pid) === 'liar' ? { ...base, role: 'liar', category: CATEGORY } : { ...base, role: 'detective', scene: s.assoc };
}

export function apply(s: State, a: Action): State {
  if (!pending(s).includes(a.pid)) return s; // out of turn or duplicate tap
  switch (a.type) {
    case 'start':
      return s.phase === 'briefing' ? { ...s, phase: 'pick', round: 0 } : s;
    case 'pick': {
      if (s.phase !== 'pick' || !CARD_IDS.includes(a.card)) return s;
      if (s.round === 1 && s.picks[0][a.pid] === a.card) return s; // can't repeat your own first card
      const picks = [...s.picks] as State['picks'];
      picks[s.round] = { ...picks[s.round], [a.pid]: a.card };
      const next = { ...s, picks };
      return Object.keys(picks[s.round]).length === s.players.length ? { ...next, phase: 'reveal', revealed: s.round + 1 } : next;
    }
    case 'continue':
      if (s.phase === 'reveal') return s.round === 0 ? { ...s, phase: 'pick', round: 1 } : { ...s, phase: 'challenge' };
      if (s.phase === 'challenge') return { ...s, phase: 'vote' };
      return s;
    case 'ask': {
      if (s.phase !== 'challenge' || s.challenge || a.targetId === a.pid) return s;
      const target = s.players.find((p) => p.id === a.targetId);
      if (!target || target.kind !== 'bot' || !s.picks.some((r) => r[a.targetId] === a.card)) return s;
      const pickReason = s.log.find((l) => l.pid === a.targetId && l.card === a.card && l.step.startsWith('pick'))?.reason;
      const e = bots.explain(knowledgeFor(s, a.targetId), a.card, pickReason);
      return { ...s, challenge: { askerId: a.pid, targetId: a.targetId, card: a.card, text: e.text }, log: [...s.log, { pid: a.targetId, step: 'explain', reason: e.reason, card: a.card }] };
    }
    case 'vote': {
      if (s.phase !== 'vote' || a.targetId === a.pid || !s.players.some((p) => p.id === a.targetId)) return s;
      const votes = { ...s.votes, [a.pid]: a.targetId };
      const next = { ...s, votes };
      return Object.keys(votes).length === s.players.length ? { ...next, phase: 'result' } : next;
    }
  }
}

/** One bot decision, from role knowledge only. */
export function botAct(s: State, pid: string): State {
  const p = s.players.find((x) => x.id === pid);
  if (!p || p.kind !== 'bot' || !pending(s).includes(pid)) return s;
  const r = randFor(s.seed);
  if (s.phase === 'pick') {
    const d = bots.choose(knowledgeFor(s, pid), s.round, r, `pick${s.round}|${pid}`);
    const next = apply(s, { type: 'pick', pid, card: d.card });
    return { ...next, log: [...next.log, { pid, step: s.round === 0 ? 'pick1' : 'pick2', reason: d.reason, card: d.card }] };
  }
  if (s.phase === 'vote') {
    let d = bots.vote(knowledgeFor(s, pid), r, 'vote|' + pid);
    if (s.scenario === 'qa-tie') d = { targetId: qaTieTarget(s, pid), reason: { code: 'qa.forcedTie' } };
    const next = apply(s, { type: 'vote', pid, targetId: d.targetId });
    return { ...next, log: [...next.log, { pid, step: 'vote', reason: d.reason, target: d.targetId }] };
  }
  return s;
}

/** QA only: give every player exactly one vote (a 1-1-1-1 tie), whatever the human chose. */
function qaTieTarget(s: State, pid: string): string {
  const ids = s.players.map((p) => p.id);
  const h = s.votes[HUMAN];
  // a cycle starting at the human: you → h → … → you, each player voting for the next one
  const rest = ids.filter((id) => id !== HUMAN && id !== h);
  const cycle = [HUMAN, h, ...rest];
  return cycle[(cycle.indexOf(pid) + 1) % cycle.length];
}

export type Result = { tally: Record<string, number>; identifiedId: string | null; tie: boolean; caught: boolean };
export function result(s: State): Result {
  const tally: Record<string, number> = Object.fromEntries(s.players.map((p) => [p.id, 0]));
  for (const t of Object.values(s.votes)) tally[t] += 1;
  const max = Math.max(...Object.values(tally));
  const top = Object.keys(tally).filter((id) => tally[id] === max);
  const tie = top.length > 1;
  const identifiedId = tie ? null : top[0];
  return { tally, identifiedId, tie, caught: identifiedId === s.liarId };
}

// ---------------------------------------------------------------- what a player's screen receives

export type View = {
  phase: Phase;
  round: 0 | 1;
  me: string;
  role: Role;
  players: { id: string; name: string; kind: 'human' | 'bot'; suspectId?: string; emoji?: string; done: boolean }[];
  cards: CardId[];
  /** the Liar gets the category; Detectives get the scene. Never both. */
  category?: T;
  scene?: { key: string; description: T; name?: T };
  myPicks: CardId[];
  blocked: CardId[];
  reveals: Record<string, CardId>[];
  challenge: PublicExplanation | null;
  myVote?: string;
  end?: Result & { liarId: string; votes: Record<string, string> };
};

export function viewFor(s: State, pid: string): View {
  const role = roleOf(s, pid);
  const done = (id: string) => (s.phase === 'pick' ? !!s.picks[s.round][id] : s.phase === 'vote' ? !!s.votes[id] : false);
  const v: View = {
    phase: s.phase,
    round: s.round,
    me: pid,
    role,
    players: s.players.map((p) => ({ id: p.id, name: p.name, kind: p.kind, suspectId: p.suspectId, emoji: p.emoji, done: done(p.id) })),
    cards: [...s.layout[pid]],
    myPicks: s.picks.map((r) => r[pid]).filter(Boolean) as CardId[],
    blocked: s.phase === 'pick' && s.round === 1 && s.picks[0][pid] ? [s.picks[0][pid]] : [],
    reveals: s.picks.slice(0, s.revealed).map((r) => ({ ...r })),
    challenge: s.challenge ? { ...s.challenge } : null,
    myVote: s.votes[pid],
  };
  if (role === 'liar' && s.phase !== 'result') v.category = CATEGORY;
  else v.scene = { key: SCENE_KEY, description: SCENE_DESCRIPTION };
  if (s.phase === 'result') {
    v.scene = { key: SCENE_KEY, description: SCENE_DESCRIPTION, name: SCENE_NAME };
    v.end = { ...result(s), liarId: s.liarId, votes: { ...s.votes } };
  }
  return v;
}
