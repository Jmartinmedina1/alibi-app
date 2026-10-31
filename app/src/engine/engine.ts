// ALIBI game engine: pure functions over a serializable Game state.
// The server (multiplayer) and the app (Practice) both run it. Clients only ever receive viewFor().

import { CAST, commentLines, getLocation, locationsInPack, TOPICS } from './content';
import type {
  Action,
  Card,
  Exchange,
  Game,
  Phase,
  Player,
  Reaction,
  RoundState,
  Settings,
  Topic,
} from './types';

// ---------- random (seeded, serializable) ----------
function next(g: Game): number {
  // mulberry32
  let t = (g.rng = (g.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (g: Game, n: number) => Math.floor(next(g) * n);
const pick = <T>(g: Game, arr: T[]): T => arr[randInt(g, arr.length)];
function shuffle<T>(g: Game, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(g, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const chance = (g: Game, p: number) => next(g) < p;

// ---------- timings (ms) ----------
export function timings(s: Settings) {
  const relaxed = s.pace === 'relaxed';
  return {
    intro: 30_000,
    case: 45_000,
    pick: 25_000,
    answerDetective: relaxed ? 15_000 : 10_000,
    answerLiar: relaxed ? 20_000 : 14_000,
    // The answer stays up long enough to read it, even if everyone reacts fast.
    react: relaxed ? 10_000 : 7_000,
    reactMinShow: relaxed ? 6_000 : 4_500,
    reactLinger: 2_000,
    vote: 40_000,
    // 3-2-1 countdown (~2s) + time to read who voted for whom
    fingers: relaxed ? 10_000 : 7_500,
    objection: relaxed ? 14_000 : 10_000,
    objectionShow: relaxed ? 6_500 : 5_000,
    reveal: 25_000,
    guess: 20_000,
    result: 30_000,
  };
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;

// ---------- creation ----------
export function createGame(opts: {
  code: string;
  host: { id: string; name: string; emoji: string };
  settings?: Partial<Settings>;
  seed?: number;
  now: number;
}): Game {
  const g: Game = {
    v: 1,
    code: opts.code,
    hostId: opts.host.id,
    players: [{ ...opts.host, bot: false, connected: true, score: 0 }],
    settings: {
      pack: 'party',
      rounds: 2,
      pace: 'relaxed',
      difficulty: 'medium',
      practice: false,
      ...opts.settings,
    },
    phase: 'lobby',
    phaseAt: opts.now,
    deadline: null,
    botAt: {},
    ready: {},
    round: null,
    roundIndex: 0,
    introSeen: false,
    usedLocations: [],
    pastLiars: [],
    stats: emptyStats(),
    line: null,
    rng: (opts.seed ?? Math.floor(Math.random() * 2 ** 31)) | 0,
    rev: 1,
  };
  return g;
}

function emptyStats() {
  return { correctVotes: {}, escapes: {}, votesWhileInnocent: {}, hot: {}, excuses: {} };
}

export function addPlayer(g: Game, p: { id: string; name: string; emoji: string }): Game {
  const existing = g.players.find((x) => x.id === p.id);
  if (existing) {
    existing.connected = true;
    existing.name = p.name || existing.name;
    existing.emoji = p.emoji || existing.emoji;
    g.rev++;
    return g;
  }
  if (g.phase !== 'lobby') throw new GameError('game_in_progress');
  if (g.players.length >= MAX_PLAYERS) throw new GameError('room_full');
  g.players.push({ id: p.id, name: p.name.slice(0, 18) || 'Detective', emoji: p.emoji, bot: false, connected: true, score: 0 });
  g.rev++;
  return g;
}

export function addBot(g: Game): Game {
  if (g.players.length >= MAX_PLAYERS) return g;
  const used = new Set(g.players.map((p) => p.suspectId));
  const free = CAST.filter((c) => !used.has(c.id));
  if (!free.length) return g;
  const c = pick(g, free);
  g.players.push({ id: 'bot-' + c.id, name: c.name, emoji: '', bot: true, suspectId: c.id, connected: true, score: 0 });
  g.rev++;
  return g;
}

export function setConnected(g: Game, playerId: string, connected: boolean): Game {
  const p = g.players.find((x) => x.id === playerId);
  if (!p || p.connected === connected) return g;
  p.connected = connected;
  if (!connected && g.phase === 'lobby' && !p.bot && playerId !== g.hostId) {
    g.players = g.players.filter((x) => x.id !== playerId);
  }
  g.rev++;
  return g;
}

/** A player leaves for good (Main menu / Leave). In a running game they become absent; the game continues. */
export function leave(g: Game, playerId: string): Game {
  const p = g.players.find((x) => x.id === playerId);
  if (!p) return g;
  if (g.phase === 'lobby' || g.phase === 'gameover') {
    g.players = g.players.filter((x) => x.id !== playerId);
  } else {
    p.connected = false;
  }
  if (g.hostId === playerId) {
    const nextHost = g.players.find((x) => !x.bot && x.connected);
    if (nextHost) g.hostId = nextHost.id;
  }
  g.rev++;
  return g;
}

export class GameError extends Error {}

// ---------- phase machinery ----------
const humans = (g: Game) => g.players.filter((p) => !p.bot);
const activeHumans = (g: Game) => g.players.filter((p) => !p.bot && p.connected);
const player = (g: Game, id: string) => g.players.find((p) => p.id === id);
const isBot = (g: Game, id: string) => !!player(g, id)?.bot;

function setPhase(g: Game, phase: Phase, now: number, duration: number | null) {
  g.phase = phase;
  g.phaseAt = now;
  // Practice never rushes the player on reading screens; game timers still apply to answers.
  g.deadline = duration == null ? null : now + duration;
  g.botAt = {};
  g.ready = {};
  g.rev++;
}

function setLine(g: Game, key: string) {
  const lines = commentLines(key);
  g.line = lines.length ? { key, i: randInt(g, lines.length) } : null;
}

function readingDuration(g: Game, ms: number): number | null {
  return g.settings.practice ? null : ms;
}

// ---------- start / rounds ----------
function startGame(g: Game, now: number) {
  if (g.players.length < MIN_PLAYERS) throw new GameError('need_players');
  g.roundIndex = 0;
  g.players.forEach((p) => (p.score = 0));
  g.stats = emptyStats();
  if (!g.introSeen && !g.settings.practice) {
    setPhase(g, 'intro', now, timings(g.settings).intro);
    g.line = null;
    return;
  }
  startRound(g, now);
}

function chooseLiar(g: Game): string {
  const ids = g.players.map((p) => p.id);
  const last = g.pastLiars[g.pastLiars.length - 1];
  let pool = ids.filter((id) => id !== last);
  // Practice: the human plays Detective in round 1 and Liar in round 2 (as chosen at setup).
  if (g.settings.practice) {
    const human = humans(g)[0]?.id;
    const wantLiar = g.settings.startAsLiar ? g.roundIndex % 2 === 0 : g.roundIndex % 2 === 1;
    if (human) return wantLiar ? human : pick(g, ids.filter((id) => id !== human));
  }
  if (!pool.length) pool = ids;
  return pick(g, pool);
}

function chooseLocation(g: Game): string {
  const all = locationsInPack(g.settings.pack);
  let fresh = all.filter((l) => !g.usedLocations.includes(l.id));
  if (!fresh.length) {
    g.usedLocations = g.usedLocations.slice(-Math.floor(all.length / 2));
    fresh = all.filter((l) => !g.usedLocations.includes(l.id));
  }
  const l = pick(g, fresh);
  g.usedLocations.push(l.id);
  return l.id;
}

function startRound(g: Game, now: number) {
  const liarId = chooseLiar(g);
  g.pastLiars.push(liarId);
  const locationId = chooseLocation(g);
  const ids = g.players.map((p) => p.id);
  const laps = ids.length <= 3 ? 2 : 1;
  let order: string[] = [];
  for (let i = 0; i < laps; i++) order = order.concat(shuffle(g, ids));
  // In Practice, never let the human ask first (they learn by watching one exchange).
  if (g.settings.practice && !isBot(g, order[0])) {
    const j = order.findIndex((id) => isBot(g, id));
    [order[0], order[j]] = [order[j], order[0]];
  }
  const r: RoundState = {
    n: g.roundIndex + 1,
    liarId,
    locationId,
    turnOrder: order,
    turn: 0,
    exchanges: [],
    grilled: Object.fromEntries(ids.map((id) => [id, 0])),
    topicBag: shuffle(g, TOPICS),
    votes: {},
    tie: false,
    deltas: Object.fromEntries(ids.map((id) => [id, { pts: 0, reasons: [] }])),
    factIdx: 0,
  };
  g.round = r;
  setPhase(g, 'case', now, readingDuration(g, timings(g.settings).case));
  setLine(g, 'inspector.caseStartDetective');
  scheduleBotsReady(g, now);
}

function scheduleBotsReady(g: Game, now: number) {
  for (const p of g.players) if (p.bot) g.ready[p.id] = true;
  void now;
}

function allReady(g: Game) {
  const need = activeHumans(g);
  return need.length > 0 && need.every((p) => g.ready[p.id]);
}

// ---------- hot seat ----------
function drawTopics(g: Game): Topic[] {
  const r = g.round!;
  const out: Topic[] = [];
  const lastTopic = r.exchanges[r.exchanges.length - 1]?.topic;
  while (out.length < 3) {
    if (!r.topicBag.length) r.topicBag = shuffle(g, TOPICS);
    const t = r.topicBag.shift()!;
    if (out.includes(t)) continue;
    if (t === lastTopic && r.topicBag.length > 0) {
      r.topicBag.push(t);
      continue;
    }
    out.push(t);
  }
  return out;
}

function beginTurn(g: Game, now: number) {
  const r = g.round!;
  if (r.turn >= r.turnOrder.length) return beginVote(g, now);
  const askerId = r.turnOrder[r.turn];
  const asker = player(g, askerId);
  // Skip askers who left.
  if (!asker || (!asker.bot && !asker.connected)) {
    r.turn++;
    return beginTurn(g, now);
  }
  const ex: Exchange = { askerId, topicChoices: drawTopics(g), reactions: {} };
  r.exchanges.push(ex);
  setPhase(g, 'pick', now, timings(g.settings).pick);
  g.line = null;
  if (asker.bot) g.botAt[askerId] = now + 1600 + randInt(g, 900);
}

export function allowedTargets(g: Game, askerId: string): string[] {
  const r = g.round!;
  return g.players
    .filter((p) => p.id !== askerId && (p.bot || p.connected) && (r.grilled[p.id] ?? 0) < 3)
    .map((p) => p.id);
}

function botChooseTarget(g: Game, askerId: string): string {
  const r = g.round!;
  const allowed = allowedTargets(g, askerId);
  const fresh = allowed.filter((id) => (r.grilled[id] ?? 0) === 0);
  if (fresh.length) {
    // Prefer people who haven't been grilled yet, so every human always gets the hot seat.
    const freshHumans = fresh.filter((id) => !isBot(g, id));
    return pick(g, freshHumans.length ? freshHumans : fresh);
  }
  // Otherwise go after the most suspicious, with some randomness.
  if (chance(g, 0.6)) {
    const sus = suspicion(g);
    return allowed.slice().sort((a, b) => (sus[b] ?? 0) - (sus[a] ?? 0))[0];
  }
  return pick(g, allowed);
}

function buildOptions(g: Game, topic: Topic): Card[] {
  const r = g.round!;
  const loc = getLocation(r.locationId);
  const others = locationsInPack(g.settings.pack).filter((l) => l.category === loc.category && l.id !== loc.id);
  const decoyLoc = pick(g, others);
  const side = (l: typeof loc, isReal: boolean): Card[] => {
    let cs: Card[] = l.cards[topic].map((c, i) => ({ id: '', text: c.text, heat: c.heat, real: isReal }));
    const jokes = l.jokers?.[topic] ?? [];
    if (g.settings.joker && jokes.length) {
      // Joker mode: swap one normal answer for an extra-ridiculous one from the same place.
      const drop = randInt(g, cs.length);
      cs = cs.filter((_, i) => i !== drop);
      cs.push({ id: '', text: pick(g, jokes), heat: 2, real: isReal, joker: true });
    }
    return cs;
  };
  return shuffle(g, [...side(loc, true), ...side(decoyLoc, false)]).map((c, i) => ({ ...c, id: `${r.exchanges.length}-${i}` }));
}

function doPickTarget(g: Game, askerId: string, targetId: string, topic: Topic, now: number) {
  const r = g.round!;
  const ex = r.exchanges[r.exchanges.length - 1];
  if (g.phase !== 'pick' || ex.askerId !== askerId) throw new GameError('not_your_turn');
  if (!allowedTargets(g, askerId).includes(targetId)) throw new GameError('bad_target');
  if (!ex.topicChoices.includes(topic)) throw new GameError('bad_topic');
  ex.targetId = targetId;
  ex.topic = topic;
  ex.options = buildOptions(g, topic);
  r.grilled[targetId] = (r.grilled[targetId] ?? 0) + 1;
  const t = timings(g.settings);
  setPhase(g, 'answer', now, targetId === r.liarId ? t.answerLiar : t.answerDetective);
  setLine(g, 'inspector.questionAsked');
  const target = player(g, targetId)!;
  if (target.bot) {
    const total = targetId === r.liarId ? t.answerLiar : t.answerDetective;
    const late = target.suspectId === 'granny-dot';
    g.botAt[targetId] = now + (late ? total * (0.7 + next(g) * 0.2) : 1800 + randInt(g, 2600));
  }
}

function botAnswer(g: Game, botId: string): string {
  const r = g.round!;
  const ex = r.exchanges[r.exchanges.length - 1];
  const opts = ex.options!;
  const d = g.settings.difficulty;
  const bot = player(g, botId)!;
  // Same personality-driven heat whether lying or not, so the Liar's answers "feel" like everyone else's.
  const loud = bot.suspectId === 'chef-bruno' || bot.suspectId === 'sunny';
  const w = loud ? [0.25, 0.35, 0.4] : [0.45, 0.4, 0.15];
  const roll = next(g);
  const heat = roll < w[0] ? 1 : roll < w[0] + w[1] ? 2 : 3;
  const withHeat = (pool: Card[]) => {
    // In Joker mode the bots love a silly answer too.
    const joke = pool.find((o) => o.joker);
    if (joke && chance(g, 0.45)) return joke.id;
    return (pool.find((o) => o.heat === heat && !o.joker) ?? pick(g, pool)).id;
  };
  if (botId === r.liarId) {
    // The Liar bot doesn't know the place, but it listens: every honest answer it has heard
    // this round makes its next bluff more convincing. It slips up sometimes, not constantly.
    const heard = r.exchanges.filter((e) => e !== ex && e.pickedId && e.targetId !== botId).length;
    const base = d === 'easy' ? 0.55 : d === 'medium' ? 0.66 : 0.8;
    const pReal = Math.min(0.92, base + heard * 0.06);
    return withHeat(chance(g, pReal) ? opts.filter((o) => o.real) : opts.filter((o) => !o.real));
  }
  return withHeat(opts.filter((o) => o.real));
}

function doAnswer(g: Game, pid: string, cardId: string, now: number, timedOut = false) {
  const r = g.round!;
  const ex = r.exchanges[r.exchanges.length - 1];
  if (g.phase !== 'answer' || ex.targetId !== pid) throw new GameError('not_your_turn');
  const card = ex.options!.find((o) => o.id === cardId);
  if (!card) throw new GameError('bad_card');
  ex.pickedId = cardId;
  ex.timedOut = timedOut;
  if (card.heat === 3) g.stats.hot[pid] = (g.stats.hot[pid] ?? 0) + 1;
  const target = player(g, pid)!;
  if (target.bot && target.suspectId) {
    const lines = commentLines(`suspects.${target.suspectId}.onReveal`);
    if (lines.length) ex.quip = { key: `suspects.${target.suspectId}.onReveal`, i: randInt(g, lines.length) };
  }
  setPhase(g, 'react', now, timings(g.settings).react);
  // The Inspector never reacts to decoys here: that would expose the Liar early.
  setLine(g, card.heat === 3 && card.real && pid !== r.liarId ? 'inspector.revealHot' : 'inspector.questionAsked');
  for (const p of g.players) {
    if (p.bot && p.id !== pid) g.botAt[p.id] = now + 500 + randInt(g, 2200);
  }
}

function botReact(g: Game, botId: string): Reaction {
  const r = g.round!;
  const ex = r.exchanges[r.exchanges.length - 1];
  const card = ex.options!.find((o) => o.id === ex.pickedId)!;
  const bot = player(g, botId)!;
  if (bot.suspectId === 'big-tony') return 'sus';
  if (bot.suspectId === 'granny-dot') return card.heat === 3 ? 'sus' : 'legit';
  // Everyone gets a little suspicious of wild answers, so a "sus" alone proves nothing.
  const wild = card.heat === 3 ? 0.3 : 0.18;
  if (botId === r.liarId) {
    // The Liar blends in: reacts like a normal detective and goes along with the crowd.
    const said = Object.values(ex.reactions);
    const crowd = said.length ? said.filter((x) => x === 'sus').length / said.length : 0;
    return chance(g, wild * 0.6 + crowd * 0.4) ? 'sus' : 'legit';
  }
  // Detective bots know the place, but they don't all pounce on a wrong answer — that's the humans' job.
  const d = g.settings.difficulty;
  const p = d === 'easy' ? 0.35 : d === 'medium' ? 0.5 : 0.65;
  if (!card.real) return chance(g, p) ? 'sus' : 'legit';
  return chance(g, wild) ? 'sus' : 'legit';
}

function reactors(g: Game): Player[] {
  const ex = g.round!.exchanges[g.round!.exchanges.length - 1];
  return g.players.filter((p) => p.id !== ex.targetId && (p.bot || p.connected));
}

function doReact(g: Game, pid: string, reaction: Reaction, now: number) {
  const ex = g.round!.exchanges[g.round!.exchanges.length - 1];
  if (g.phase !== 'react' || pid === ex.targetId) throw new GameError('cannot_react');
  if (ex.reactions[pid]) return;
  ex.reactions[pid] = reaction;
  g.rev++;
  if (reactors(g).every((p) => ex.reactions[p.id])) {
    // Everyone reacted: keep the answer up for a minimum reading time, then a short beat to see the reactions.
    const t = timings(g.settings);
    const end = Math.max(g.phaseAt + t.reactMinShow, now + t.reactLinger);
    g.deadline = Math.min(g.deadline ?? Infinity, end);
  }
}

export function suspicion(g: Game): Record<string, number> {
  const out: Record<string, number> = {};
  for (const ex of g.round?.exchanges ?? []) {
    if (!ex.targetId) continue;
    const sus = Object.values(ex.reactions).filter((x) => x === 'sus').length;
    out[ex.targetId] = (out[ex.targetId] ?? 0) + sus;
  }
  return out;
}

function endTurn(g: Game, now: number) {
  g.round!.turn++;
  beginTurn(g, now);
}

// ---------- vote ----------
function beginVote(g: Game, now: number) {
  setPhase(g, 'vote', now, timings(g.settings).vote);
  setLine(g, 'inspector.voteStart');
  for (const p of g.players) if (p.bot) g.botAt[p.id] = now + 2000 + randInt(g, 4000);
}

function botVote(g: Game, botId: string): string {
  const r = g.round!;
  const others = g.players.filter((p) => p.id !== botId).map((p) => p.id);
  const sus = suspicion(g);
  if (botId === r.liarId) {
    return others.slice().sort((a, b) => (sus[b] ?? 0) - (sus[a] ?? 0) + (next(g) - 0.5))[0];
  }
  const d = g.settings.difficulty;
  const noise = d === 'easy' ? 3 : d === 'medium' ? 1.6 : 0.8;
  const score = (id: string) => {
    let s = (sus[id] ?? 0) * 0.5 + next(g) * noise;
    for (const ex of r.exchanges) {
      if (ex.targetId !== id || !ex.pickedId) continue;
      const c = ex.options!.find((o) => o.id === ex.pickedId)!;
      if (!c.real) s += 3;
    }
    return s;
  };
  const scored = others.map((id) => [id, score(id)] as const);
  scored.sort((a, b) => b[1] - a[1]);
  return scored[0][0];
}

function voters(g: Game) {
  return g.players.filter((p) => p.bot || p.connected);
}

function doVote(g: Game, pid: string, targetId: string, now: number) {
  if (g.phase !== 'vote') throw new GameError('not_voting');
  if (pid === targetId || !player(g, targetId)) throw new GameError('bad_vote');
  g.round!.votes[pid] = targetId;
  g.rev++;
  if (voters(g).every((p) => g.round!.votes[p.id])) finishVote(g, now);
}

function finishVote(g: Game, now: number) {
  const r = g.round!;
  // Absent players who never voted are skipped.
  const tally: Record<string, number> = {};
  for (const t of Object.values(r.votes)) tally[t] = (tally[t] ?? 0) + 1;
  const max = Math.max(0, ...Object.values(tally));
  const top = Object.keys(tally).filter((id) => tally[id] === max);
  r.tie = top.length !== 1;
  r.accusedId = top.length === 1 ? top[0] : undefined;
  r.caught = !r.tie && r.accusedId === r.liarId;
  for (const [voter, t] of Object.entries(r.votes)) {
    if (t === r.liarId) g.stats.correctVotes[voter] = (g.stats.correctVotes[voter] ?? 0) + 1;
  }
  for (const [id, n] of Object.entries(tally)) {
    if (id !== r.liarId) g.stats.votesWhileInnocent[id] = (g.stats.votesWhileInnocent[id] ?? 0) + n;
  }
  setPhase(g, 'fingers', now, timings(g.settings).fingers);
  if (r.accusedId) {
    const acc = player(g, r.accusedId)!;
    if (acc.bot && acc.suspectId) setLine(g, `suspects.${acc.suspectId}.onVoted`);
    else g.line = null;
  } else setLine(g, 'inspector.tie');
}

// ---------- objection ----------
function beginObjection(g: Game, now: number) {
  const r = g.round!;
  if (!r.accusedId) return beginReveal(g, now);
  const n = commentLines('objection.excuses').length;
  const choices = new Set<number>();
  while (choices.size < 3 && choices.size < n) choices.add(randInt(g, n));
  r.excuseChoices = [...choices];
  setPhase(g, 'objection', now, timings(g.settings).objection);
  g.line = null;
  const acc = player(g, r.accusedId)!;
  if (acc.bot || !acc.connected) g.botAt[acc.id] = now + 2200 + randInt(g, 1200);
}

function doExcuse(g: Game, pid: string, idx: number, now: number) {
  const r = g.round!;
  if (g.phase !== 'objection' || pid !== r.accusedId || r.excuseIdx != null) throw new GameError('not_your_turn');
  if (!r.excuseChoices!.includes(idx)) throw new GameError('bad_excuse');
  r.excuseIdx = idx;
  g.stats.excuses[pid] = (g.stats.excuses[pid] ?? 0) + 1;
  setLine(g, 'objection.inspectorAfter');
  g.deadline = now + timings(g.settings).objectionShow;
  g.botAt = {};
  g.rev++;
}

// ---------- reveal / guess / result ----------
function beginReveal(g: Game, now: number) {
  const r = g.round!;
  setPhase(g, 'reveal', now, readingDuration(g, timings(g.settings).reveal));
  setLine(g, r.caught ? 'inspector.liarCaught' : r.tie ? 'inspector.tie' : 'inspector.liarEscaped');
  scheduleBotsReady(g, now);
}

function beginGuess(g: Game, now: number) {
  const r = g.round!;
  const loc = getLocation(r.locationId);
  const others = locationsInPack(g.settings.pack).filter((l) => l.category === loc.category && l.id !== loc.id);
  r.guessChoices = shuffle(g, [loc.id, ...shuffle(g, others).slice(0, 3).map((l) => l.id)]);
  setPhase(g, 'guess', now, timings(g.settings).guess);
  g.line = null;
  const liar = player(g, r.liarId)!;
  if (liar.bot || !liar.connected) g.botAt[liar.id] = now + 2500 + randInt(g, 2000);
}

function doGuess(g: Game, pid: string, locationId: string, now: number) {
  const r = g.round!;
  if (g.phase !== 'guess' || pid !== r.liarId) throw new GameError('not_your_turn');
  if (!r.guessChoices!.includes(locationId)) throw new GameError('bad_guess');
  r.guessId = locationId;
  beginResult(g, now);
}

function botGuess(g: Game): string {
  const r = g.round!;
  const d = g.settings.difficulty;
  const p = d === 'easy' ? 0.35 : d === 'medium' ? 0.5 : 0.65;
  return chance(g, p) ? r.locationId : pick(g, r.guessChoices!.filter((id) => id !== r.locationId));
}

function award(g: Game, id: string, pts: number, reason: string) {
  const p = player(g, id);
  if (!p) return;
  p.score += pts;
  const d = g.round!.deltas[id] ?? (g.round!.deltas[id] = { pts: 0, reasons: [] });
  d.pts += pts;
  d.reasons.push(reason);
}

function beginResult(g: Game, now: number) {
  const r = g.round!;
  for (const [voter, t] of Object.entries(r.votes)) if (t === r.liarId) award(g, voter, 100, 'spotted');
  if (!r.caught) {
    award(g, r.liarId, 200, 'escaped');
    g.stats.escapes[r.liarId] = (g.stats.escapes[r.liarId] ?? 0) + 1;
  } else if (r.guessId === r.locationId) award(g, r.liarId, 100, 'guessed');
  r.factIdx = randInt(g, getLocation(r.locationId).facts.length || 1);
  setPhase(g, 'result', now, readingDuration(g, timings(g.settings).result));
  if (r.caught) setLine(g, r.guessId === r.locationId ? 'inspector.liarGuessRight' : 'inspector.liarGuessWrong');
  scheduleBotsReady(g, now);
}

function nextRoundOrEnd(g: Game, now: number) {
  g.roundIndex++;
  if (g.roundIndex >= g.settings.rounds) {
    setPhase(g, 'gameover', now, null);
    setLine(g, 'inspector.gameEnd');
    return;
  }
  startRound(g, now);
}

export interface Award {
  id: string;
  playerId: string;
}
export function awards(g: Game): Award[] {
  const out: Award[] = [];
  const top = (m: Record<string, number>) => {
    const e = Object.entries(m).filter(([, v]) => v > 0);
    if (!e.length) return null;
    e.sort((a, b) => b[1] - a[1]);
    return e[0][0];
  };
  const s = g.stats;
  const add = (id: string, m: Record<string, number>) => {
    const w = top(m);
    if (w) out.push({ id, playerId: w });
  };
  add('smooth-criminal', s.escapes);
  add('master-detective', s.correctVotes);
  add('suspicious-innocent', s.votesWhileInnocent);
  add('loudmouth', s.hot);
  add('drama-queen', s.excuses);
  return out;
}

// ---------- public API ----------
export function apply(g: Game, playerId: string, action: Action, now: number): Game {
  const isHost = playerId === g.hostId;
  switch (action.type) {
    case 'start':
      if (!isHost) throw new GameError('host_only');
      if (g.phase !== 'lobby') throw new GameError('already_started');
      startGame(g, now);
      break;
    case 'settings':
      if (!isHost || g.phase !== 'lobby') throw new GameError('host_only');
      g.settings = { ...g.settings, ...action.settings, practice: g.settings.practice };
      g.rev++;
      break;
    case 'addBot':
      if (!isHost || g.phase !== 'lobby') throw new GameError('host_only');
      addBot(g);
      break;
    case 'removePlayer':
      if (!isHost || g.phase !== 'lobby' || action.playerId === g.hostId) throw new GameError('host_only');
      g.players = g.players.filter((p) => p.id !== action.playerId);
      g.rev++;
      break;
    case 'ready':
      if (!['intro', 'case', 'reveal', 'result'].includes(g.phase)) return g;
      g.ready[playerId] = true;
      g.rev++;
      if (allReady(g)) advanceReading(g, now);
      break;
    case 'pickTarget':
      doPickTarget(g, playerId, action.targetId, action.topic, now);
      break;
    case 'answer':
      doAnswer(g, playerId, action.cardId, now);
      break;
    case 'react':
      doReact(g, playerId, action.reaction, now);
      break;
    case 'vote':
      doVote(g, playerId, action.targetId, now);
      break;
    case 'excuse':
      doExcuse(g, playerId, action.idx, now);
      break;
    case 'guess':
      doGuess(g, playerId, action.locationId, now);
      break;
    case 'rematch':
      if (g.phase !== 'gameover') throw new GameError('not_over');
      g.players = g.players.filter((p) => p.bot || p.connected);
      if (!player(g, g.hostId)) g.hostId = humans(g)[0]?.id ?? g.hostId;
      g.introSeen = true;
      if (g.players.length < MIN_PLAYERS) {
        setPhase(g, 'lobby', now, null);
      } else startGame(g, now);
      break;
  }
  return g;
}

function advanceReading(g: Game, now: number) {
  const r = g.round;
  switch (g.phase) {
    case 'intro':
      g.introSeen = true;
      startRound(g, now);
      break;
    case 'case':
      beginTurn(g, now);
      break;
    case 'reveal':
      if (r!.caught) beginGuess(g, now);
      else beginResult(g, now);
      break;
    case 'result':
      nextRoundOrEnd(g, now);
      break;
  }
}

/** Run timers and bots. Call whenever time passes (server alarm, client interval). */
export function tick(g: Game, now: number): Game {
  for (let guard = 0; guard < 50; guard++) {
    const before = g.rev;
    // Bots whose time has come
    const due = Object.entries(g.botAt).filter(([, at]) => at <= now).sort((a, b) => a[1] - b[1]);
    for (const [id] of due) {
      delete g.botAt[id];
      runBot(g, id, now);
      if (g.rev !== before) break;
    }
    if (g.rev !== before) continue;
    if (g.deadline != null && now >= g.deadline) {
      onDeadline(g, now);
      continue;
    }
    break;
  }
  return g;
}

function runBot(g: Game, id: string, now: number) {
  const r = g.round;
  try {
    switch (g.phase) {
      case 'pick': {
        const t = botChooseTarget(g, id);
        doPickTarget(g, id, t, pick(g, r!.exchanges[r!.exchanges.length - 1].topicChoices), now);
        break;
      }
      case 'answer':
        doAnswer(g, id, botAnswer(g, id), now);
        break;
      case 'react':
        doReact(g, id, botReact(g, id), now);
        break;
      case 'vote':
        doVote(g, id, botVote(g, id), now);
        break;
      case 'objection':
        doExcuse(g, id, pick(g, r!.excuseChoices!), now);
        break;
      case 'guess':
        doGuess(g, id, botGuess(g), now);
        break;
    }
  } catch {
    /* stale bot action — ignore */
  }
}

function onDeadline(g: Game, now: number) {
  const r = g.round;
  switch (g.phase) {
    case 'intro':
    case 'case':
    case 'reveal':
    case 'result':
      advanceReading(g, now);
      break;
    case 'pick': {
      const ex = r!.exchanges[r!.exchanges.length - 1];
      doPickTarget(g, ex.askerId, botChooseTarget(g, ex.askerId), pick(g, ex.topicChoices), now);
      break;
    }
    case 'answer': {
      const ex = r!.exchanges[r!.exchanges.length - 1];
      doAnswer(g, ex.targetId!, pick(g, ex.options!).id, now, true);
      break;
    }
    case 'react':
      endTurn(g, now);
      break;
    case 'vote':
      finishVote(g, now);
      break;
    case 'fingers':
      beginObjection(g, now);
      break;
    case 'objection':
      if (r!.excuseIdx == null) {
        doExcuse(g, r!.accusedId!, pick(g, r!.excuseChoices!), now);
      } else beginReveal(g, now);
      break;
    case 'guess':
      doGuess(g, r!.liarId, pick(g, r!.guessChoices!), now);
      break;
  }
}

/** Earliest time the engine needs to run again (for server alarms). */
export function nextWake(g: Game): number | null {
  const times = Object.values(g.botAt);
  if (g.deadline != null) times.push(g.deadline);
  return times.length ? Math.min(...times) : null;
}
