// What one player is allowed to see. This is the ONLY thing clients receive.
// Rules: the Liar never gets the location (or anything that names it) before the round result;
// nobody learns who the Liar is, or which answers were real, before The Reveal.

import { getLocation } from './content';
import { allowedTargets, awards, suspicion, voteCandidates } from './engine';
import type { Award } from './engine';
import type { Game, Line, Phase, Reaction, Settings, Topic } from './types';

export interface ViewCard {
  id: string;
  text: string;
  /** Only for Detectives (they know the place) or after The Reveal. */
  heat?: number;
  real?: boolean;
  joker?: boolean;
}

export interface ViewExchange {
  askerId: string;
  targetId?: string;
  topic?: Topic;
  topicChoices?: Topic[];
  options?: ViewCard[];
  picked?: ViewCard;
  timedOut?: boolean;
  reactions: Record<string, Reaction>;
  quip?: Line;
}

export interface View {
  rev: number;
  code: string;
  me: string;
  hostId: string;
  phase: Phase;
  phaseAt: number;
  deadline: number | null;
  serverNow: number;
  settings: Settings;
  players: {
    id: string;
    name: string;
    emoji: string;
    bot: boolean;
    suspectId?: string;
    connected: boolean;
    score: number;
    ready: boolean;
    suspicion: number;
    /** Times grilled this round. */
    grilled: number;
  }[];
  line: Line | null;
  roundIndex: number;
  rounds: number;
  role?: 'detective' | 'liar';
  /** Present for Detectives during the round, and for everyone at the result. */
  locationId?: string;
  /** The Liar's only clue: the category hint, which never names the place. */
  hint?: string;
  current?: ViewExchange;
  history: ViewExchange[];
  allowedTargets?: string[];
  votes?: Record<string, string>;
  myVote?: string;
  accusedId?: string;
  tie?: boolean;
  voteFor?: string[];
  runoff?: string[];
  canVote?: boolean;
  runoffNext?: boolean;
  liarId?: string;
  caught?: boolean;
  excuseChoices?: number[];
  excuseIdx?: number;
  guessChoices?: string[];
  guessId?: string;
  deltas?: Record<string, { pts: number; reasons: string[] }>;
  factIdx?: number;
  awards?: Award[];
  /** I arrived mid-game and join at the next round. */
  waiting?: boolean;
  waitingNames?: string[];
  /** Game over: my own numbers, for a personal tip. */
  myStats?: { correctVotes: number; hot: number; caughtAsLiar: number; escapes: number; sharpEye: number; liarRounds: number };
}

const REVEALED: Phase[] = ['reveal', 'guess', 'result', 'gameover'];

export function viewFor(g: Game, me: string, now: number): View {
  const r = g.round;
  const sus = r ? suspicion(g) : {};
  const revealed = REVEALED.includes(g.phase);
  const locationKnown = g.phase === 'result' || g.phase === 'gameover';
  const role = r ? (r.liarId === me ? 'liar' : 'detective') : undefined;
  const knowsPlace = role === 'detective' || locationKnown;

  // Only used once the round is revealed: everyone may see which answers were real.
  const cardView = (c: { id: string; text: string; heat: number; real: boolean; joker?: boolean }): ViewCard => ({
    joker: c.joker,
    id: c.id,
    text: c.text,
    heat: c.heat,
    real: c.real,
  });

  const exView = (ex: NonNullable<typeof r>['exchanges'][number], isCurrent: boolean): ViewExchange => {
    const picked = ex.pickedId ? ex.options!.find((o) => o.id === ex.pickedId) : undefined;
    const v: ViewExchange = {
      askerId: ex.askerId,
      targetId: ex.targetId,
      topic: ex.topic,
      reactions: ex.reactions,
      timedOut: ex.timedOut,
      quip: ex.quip,
    };
    if (picked) {
      // Before The Reveal, nobody sees whether a played card was real (Detectives can judge for themselves).
      v.picked = revealed ? cardView(picked) : { id: picked.id, text: picked.text, joker: picked.joker, heat: knowsPlace ? picked.heat : undefined };
    }
    if (isCurrent && g.phase === 'pick' && ex.askerId === me) v.topicChoices = ex.topicChoices;
    if (isCurrent && g.phase === 'answer' && ex.targetId === me) {
      v.options = ex.options!.map((c) => (role === 'detective' ? { id: c.id, text: c.text, joker: c.joker, heat: c.heat, real: c.real } : { id: c.id, text: c.text, joker: c.joker }));
    }
    return v;
  };

  const exchanges = r?.exchanges ?? [];
  const inHotSeat = g.phase === 'pick' || g.phase === 'answer' || g.phase === 'react';
  const current = inHotSeat ? exchanges[exchanges.length - 1] : undefined;

  const v: View = {
    rev: g.rev,
    code: g.code,
    me,
    hostId: g.hostId,
    phase: g.phase,
    phaseAt: g.phaseAt,
    deadline: g.deadline,
    serverNow: now,
    settings: g.settings,
    players: g.players.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      bot: p.bot,
      suspectId: p.suspectId,
      connected: p.connected,
      score: p.score,
      ready: !!g.ready[p.id],
      suspicion: sus[p.id] ?? 0,
      grilled: r?.grilled[p.id] ?? 0,
    })),
    line: g.line,
    roundIndex: g.roundIndex,
    rounds: g.settings.rounds,
    role,
    locationId: r && knowsPlace ? r.locationId : undefined,
    hint: r && role === 'liar' && !locationKnown ? hintFor(getLocation(r.locationId), g.settings.difficulty) : undefined,
    current: current ? exView(current, true) : undefined,
    history: exchanges.filter((ex) => ex !== current && ex.pickedId).map((ex) => exView(ex, false)),
  };

  if (current && g.phase === 'pick' && current.askerId === me) v.allowedTargets = allowedTargets(g, me);

  if (r) {
    if (g.phase === 'vote') {
      v.myVote = r.votes[me];
      v.voteFor = voteCandidates(g, me);
      v.runoff = r.runoff;
      v.canVote = !r.runoff || !r.runoff.includes(me) || r.runoff.length >= g.players.length;
    }
    if (g.phase === 'fingers') v.runoffNext = !!r.runoffPending;
    if (['fingers', 'objection', 'reveal', 'guess', 'result', 'gameover'].includes(g.phase)) {
      v.votes = r.votes;
      v.accusedId = r.accusedId;
      v.tie = r.tie;
    }
    if (g.phase === 'objection' || revealed) {
      v.excuseChoices = r.excuseChoices;
      v.excuseIdx = r.excuseIdx;
    }
    if (revealed) {
      v.liarId = r.liarId;
      v.caught = r.caught;
    }
    if (g.phase === 'guess' || locationKnown) {
      v.guessChoices = r.guessChoices;
      v.guessId = r.guessId;
    }
    if (locationKnown) {
      v.deltas = r.deltas;
      v.factIdx = r.factIdx;
    }
  }
  if (g.phase === 'gameover') {
    v.awards = awards(g);
    const s = g.stats;
    v.myStats = {
      correctVotes: s.correctVotes[me] ?? 0, hot: s.hot[me] ?? 0, caughtAsLiar: s.caughtAsLiar[me] ?? 0,
      escapes: s.escapes[me] ?? 0, sharpEye: s.sharpEye[me] ?? 0, liarRounds: s.liarRounds[me] ?? 0,
    };
  }
  v.waitingNames = (g.waiting ?? []).map((w) => w.name);
  if (g.waiting?.some((w) => w.id === me)) {
    // Arrived mid-game: they watch the scoreboard and join next round. Nothing about the secret.
    return {
      ...v,
      waiting: true,
      role: undefined,
      locationId: locationKnown ? v.locationId : undefined,
      hint: undefined,
      current: undefined,
      history: [],
      allowedTargets: undefined,
      votes: undefined,
      myVote: undefined,
    };
  }
  return v;
}

/** Easy gives the Liar a friendlier hint; Hard a vaguer one. */
function hintFor(l: ReturnType<typeof getLocation>, d: Settings['difficulty']): string {
  if (d === 'easy') return l.hintEasy ?? l.hint;
  if (d === 'hard') return l.hintHard ?? l.hint;
  return l.hint;
}
