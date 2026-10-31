// Shared game types for ALIBI. Used by the app (Practice runs locally) and the server (multiplayer rooms).

export type Lang = 'en' | 'es';
export type Pack = 'party' | 'espanol';
export type Topic = 'food' | 'sound' | 'people' | 'object' | 'leaving' | 'where' | 'doing';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Pace = 'relaxed' | 'normal' | 'slow';
export type Reaction = 'sus' | 'legit';

export type Phase =
  | 'lobby'
  | 'intro'
  | 'case'
  | 'pick'
  | 'answer'
  | 'react'
  | 'vote'
  | 'fingers'
  | 'objection'
  | 'reveal'
  | 'guess'
  | 'result'
  | 'gameover';

export interface Player {
  id: string;
  name: string;
  emoji: string;
  bot: boolean;
  /** Bots play one of the cast characters (portrait + personality). */
  suspectId?: string;
  connected: boolean;
  score: number;
}

export interface Settings {
  pack: Pack;
  rounds: number;
  pace: Pace;
  difficulty: Difficulty;
  practice: boolean;
  /** Practice only: play the Liar in round 1 (then Detective). */
  startAsLiar?: boolean;
  /** Joker mode: every question also offers extra-ridiculous answers. */
  joker?: boolean;
  /** Practice for newcomers: on-screen tips; firstGame also makes the bot Liar slip once. */
  coach?: boolean;
  firstGame?: boolean;
}

export interface Card {
  id: string;
  text: string;
  heat: number;
  /** true = from the secret location. Never sent to the Liar or the public before The Reveal. */
  real: boolean;
  /** A Joker-mode silly answer (real or decoy, like any other card). */
  joker?: boolean;
}

export interface Line {
  /** Comedy category key, e.g. inspector.voteStart or suspects.rosa.onVoted */
  key: string;
  i: number;
}

export interface Exchange {
  askerId: string;
  targetId?: string;
  topic?: Topic;
  topicChoices: Topic[];
  options?: Card[];
  pickedId?: string;
  timedOut?: boolean;
  reactions: Record<string, Reaction>;
  quip?: Line;
}

export interface RoundState {
  n: number;
  liarId: string;
  locationId: string;
  turnOrder: string[];
  turn: number;
  exchanges: Exchange[];
  grilled: Record<string, number>;
  topicBag: Topic[];
  votes: Record<string, string>;
  accusedId?: string;
  tie: boolean;
  /** A tie sends the tied players to a runoff vote decided by everyone else. */
  runoff?: string[];
  runoffPending?: boolean;
  firstVotes?: Record<string, string>;
  caught?: boolean;
  excuseChoices?: number[];
  excuseIdx?: number;
  guessChoices?: string[];
  guessId?: string;
  deltas: Record<string, { pts: number; reasons: string[] }>;
  factIdx: number;
}

export interface Stats {
  correctVotes: Record<string, number>;
  escapes: Record<string, number>;
  votesWhileInnocent: Record<string, number>;
  hot: Record<string, number>;
  excuses: Record<string, number>;
  /** Rounds played as the Liar / caught as the Liar / sus on a wrong answer. */
  liarRounds: Record<string, number>;
  caughtAsLiar: Record<string, number>;
  sharpEye: Record<string, number>;
}

export interface Game {
  v: 1;
  code: string;
  hostId: string;
  players: Player[];
  settings: Settings;
  phase: Phase;
  phaseAt: number;
  deadline: number | null;
  /** When each bot should act in the current phase (ms epoch). */
  botAt: Record<string, number>;
  ready: Record<string, boolean>;
  round: RoundState | null;
  roundIndex: number;
  introSeen: boolean;
  /** People who arrived mid-game; they join at the next round. */
  waiting?: Player[];
  /** Set once the end-of-game stats were logged. */
  endLogged?: boolean;
  startedAt?: number;
  /** Kicked by the host; can't rejoin this room. */
  banned?: string[];
  usedLocations: string[];
  pastLiars: string[];
  stats: Stats;
  line: Line | null;
  rng: number;
  /** Increments on every change; clients use it to drop stale updates. */
  rev: number;
}

export type Action =
  | { type: 'start' }
  | { type: 'ready' }
  | { type: 'pickTarget'; targetId: string; topic: Topic }
  | { type: 'answer'; cardId: string }
  | { type: 'react'; reaction: Reaction }
  | { type: 'vote'; targetId: string }
  | { type: 'excuse'; idx: number }
  | { type: 'guess'; locationId: string }
  | { type: 'rematch' }
  | { type: 'settings'; settings: Partial<Settings> }
  | { type: 'addBot' }
  | { type: 'removePlayer'; playerId: string }
  | { type: 'kick'; playerId: string };
