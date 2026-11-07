/**
 * Variant B — one round:
 *   briefing → pick (one card each, simultaneous) → reveal → vote → [guess, only if the Liar is identified] → result
 * The caught Liar escapes by naming the secret picture among three candidates shown only after the vote.
 */
import { CARD_IDS, CATEGORY, type CardId, type T } from '../cards';
import { BOT_CAST, HUMAN, type Player, type Role } from '../engine';
import type { Reason } from '../knowledge';
import { pick, randFor, shuffled } from '../rand';
import * as bots from './bots';
import type { KnowledgeB } from './knowledge';
import { CONNECTIONS, SCENE_IDS, SCENE_NAME, type SceneId } from './scenes';

export type ScenarioB = 'b-detective' | 'b-liar' | 'b-qa-caught';
export type PhaseB = 'briefing' | 'pick' | 'reveal' | 'vote' | 'guess' | 'result';
export type LogB = { pid: string; step: 'pick' | 'vote' | 'guess'; reason: Reason; card?: CardId; target?: string; scene?: SceneId };

export type StateB = {
  seed: string;
  scenario: ScenarioB;
  players: Player[];
  liarId: string;
  secret: SceneId;
  /** order the three pictures are shown in after the vote (no marking of the secret) */
  candidates: SceneId[];
  phase: PhaseB;
  layout: Record<string, CardId[]>;
  picks: Record<string, CardId>;
  votes: Record<string, string>;
  guess: SceneId | null;
  log: LogB[];
};

export type ActionB =
  | { type: 'start'; pid: string }
  | { type: 'pick'; pid: string; card: CardId }
  | { type: 'continue'; pid: string }
  | { type: 'vote'; pid: string; targetId: string }
  | { type: 'guess'; pid: string; scene: SceneId };

export function newGameB(o: { scenario: ScenarioB; seed: string; humanName?: string; humanEmoji?: string; secret?: SceneId }): StateB {
  const r = randFor(o.seed);
  const players: Player[] = [
    { id: HUMAN, name: o.humanName || 'You', kind: 'human', emoji: o.humanEmoji, style: 'mixed' },
    ...BOT_CAST.map((b, i) => ({ ...b, id: 'b' + (i + 1) })),
  ];
  const liarId = o.scenario === 'b-detective' ? pick(['b1', 'b2', 'b3'], r('liar')) : HUMAN;
  return {
    seed: o.seed,
    scenario: o.scenario,
    players,
    liarId,
    secret: o.secret ?? pick(SCENE_IDS, r('secret')),
    candidates: shuffled([...SCENE_IDS], r, 'candidates'),
    phase: 'briefing',
    layout: Object.fromEntries(players.map((p) => [p.id, shuffled([...CARD_IDS], r, 'layout|' + p.id)])),
    picks: {},
    votes: {},
    guess: null,
    log: [],
  };
}

export const roleOfB = (s: StateB, pid: string): Role => (pid === s.liarId ? 'liar' : 'detective');

export function pendingB(s: StateB): string[] {
  const all = s.players.map((p) => p.id);
  switch (s.phase) {
    case 'pick':
      return all.filter((id) => !s.picks[id]);
    case 'vote':
      return all.filter((id) => !s.votes[id]);
    case 'guess':
      return [s.liarId];
    case 'result':
      return [];
    default:
      return [HUMAN];
  }
}

export function knowledgeForB(s: StateB, pid: string): KnowledgeB {
  const me = s.players.find((p) => p.id === pid)!;
  const revealed = s.phase !== 'briefing' && s.phase !== 'pick';
  const base = { me: pid, style: me.style, players: s.players.map((p) => p.id), cards: [...s.layout[pid]], reveal: revealed ? { ...s.picks } : null, own: s.picks[pid] ?? null };
  if (roleOfB(s, pid) === 'detective') return { ...base, role: 'detective', secret: { ...CONNECTIONS[s.secret] } };
  const candidates = s.phase === 'guess' || s.phase === 'result' ? s.candidates.map((id) => ({ id, connections: { ...CONNECTIONS[id] } })) : null;
  return { ...base, role: 'liar', category: CATEGORY, candidates };
}

export function applyB(s: StateB, a: ActionB): StateB {
  if (!pendingB(s).includes(a.pid)) return s;
  switch (a.type) {
    case 'start':
      return s.phase === 'briefing' ? { ...s, phase: 'pick' } : s;
    case 'pick': {
      if (s.phase !== 'pick' || !CARD_IDS.includes(a.card)) return s;
      const picks = { ...s.picks, [a.pid]: a.card };
      return { ...s, picks, phase: Object.keys(picks).length === s.players.length ? 'reveal' : 'pick' };
    }
    case 'continue':
      return s.phase === 'reveal' ? { ...s, phase: 'vote' } : s;
    case 'vote': {
      if (s.phase !== 'vote' || a.targetId === a.pid || !s.players.some((p) => p.id === a.targetId)) return s;
      const votes = { ...s.votes, [a.pid]: a.targetId };
      if (Object.keys(votes).length < s.players.length) return { ...s, votes };
      const next = { ...s, votes };
      return { ...next, phase: tallyB(next).identifiedId === s.liarId ? 'guess' : 'result' };
    }
    case 'guess':
      if (s.phase !== 'guess' || !s.candidates.includes(a.scene)) return s;
      return { ...s, guess: a.scene, phase: 'result' };
  }
}

export function botActB(s: StateB, pid: string): StateB {
  const p = s.players.find((x) => x.id === pid);
  if (!p || p.kind !== 'bot' || !pendingB(s).includes(pid)) return s;
  const r = randFor(s.seed);
  const k = knowledgeForB(s, pid);
  if (s.phase === 'pick') {
    const d = bots.chooseB(k, r, 'pick|' + pid);
    const next = applyB(s, { type: 'pick', pid, card: d.card });
    return { ...next, log: [...next.log, { pid, step: 'pick', reason: d.reason, card: d.card }] };
  }
  if (s.phase === 'vote') {
    let d = bots.voteB(k, r, 'vote|' + pid);
    if (s.scenario === 'b-qa-caught') d = { targetId: HUMAN, reason: { code: 'b.qa.forcedCatch' } };
    const next = applyB(s, { type: 'vote', pid, targetId: d.targetId });
    return { ...next, log: [...next.log, { pid, step: 'vote', reason: d.reason, target: d.targetId }] };
  }
  if (s.phase === 'guess' && k.role === 'liar') {
    const d = bots.guessB(k, r, 'guess|' + pid);
    const next = applyB(s, { type: 'guess', pid, scene: d.scene });
    return { ...next, log: [...next.log, { pid, step: 'guess', reason: d.reason, scene: d.scene }] };
  }
  return s;
}

export function tallyB(s: StateB) {
  const tally: Record<string, number> = Object.fromEntries(s.players.map((p) => [p.id, 0]));
  for (const t of Object.values(s.votes)) tally[t] += 1;
  const max = Math.max(...Object.values(tally));
  const top = Object.keys(tally).filter((id) => tally[id] === max);
  return { tally, tie: top.length > 1, identifiedId: top.length > 1 ? null : top[0] };
}

export type Outcome = 'found' | 'named' | 'blended';
export type ResultB = ReturnType<typeof tallyB> & { caught: boolean; guess: SceneId | null; outcome: Outcome };
export function resultB(s: StateB): ResultB {
  const t = tallyB(s);
  const caught = t.identifiedId === s.liarId;
  const outcome: Outcome = !caught ? 'blended' : s.guess === s.secret ? 'named' : 'found';
  return { ...t, caught, guess: s.guess, outcome };
}

// ---------------------------------------------------------------- the human's screen model

export type ViewB = {
  phase: PhaseB;
  me: string;
  role: Role;
  players: { id: string; name: string; suspectId?: string; emoji?: string; done: boolean }[];
  cards: CardId[];
  myPick?: CardId;
  reveal: Record<string, CardId> | null;
  myVote?: string;
  category?: T;
  /** Detectives: the picture they saw. The Liar gets this only at the result. */
  secret?: { key: SceneId; name?: T };
  /** The three pictures, after the vote (guess or result). Names only at the result. */
  candidates?: { key: SceneId; name?: T }[];
  end?: ResultB & { liarId: string; votes: Record<string, string> };
};

export function viewForB(s: StateB, pid: string): ViewB {
  const role = roleOfB(s, pid);
  const done = (id: string) => (s.phase === 'pick' ? !!s.picks[id] : s.phase === 'vote' ? !!s.votes[id] : false);
  const v: ViewB = {
    phase: s.phase,
    me: pid,
    role,
    players: s.players.map((p) => ({ id: p.id, name: p.name, suspectId: p.suspectId, emoji: p.emoji, done: done(p.id) })),
    cards: [...s.layout[pid]],
    myPick: s.picks[pid],
    reveal: s.phase === 'briefing' || s.phase === 'pick' ? null : { ...s.picks },
    myVote: s.votes[pid],
  };
  const atEnd = s.phase === 'result';
  if (role === 'liar' && !atEnd) v.category = CATEGORY;
  else v.secret = { key: s.secret, name: atEnd ? SCENE_NAME[s.secret] : undefined };
  if (s.phase === 'guess' || atEnd) v.candidates = s.candidates.map((key) => ({ key, name: atEnd ? SCENE_NAME[key] : undefined }));
  if (atEnd) v.end = { ...resultB(s), liarId: s.liarId, votes: { ...s.votes } };
  return v;
}
