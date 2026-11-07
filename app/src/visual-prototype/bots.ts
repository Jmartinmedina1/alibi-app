/**
 * Bot decisions. Every function takes only role knowledge and returns the rule it used.
 * The Liar branches never touch scene associations (they are not in LiarKnowledge).
 */
import { CATEGORY_PRIOR, LIAR_WHY_CATEGORY, LIAR_WHY_CROWD } from './categoryHints';
import { CARD_LABEL, t, type CardId, type T } from './cards';
import type { DetectiveKnowledge, Knowledge, LiarKnowledge, Reason } from './knowledge';
import { pick, type Rand } from './rand';

/** Chance that a Detective bot goes for a direct connection rather than an indirect/weak one. */
const DIRECT_P = { direct: 0.7, mixed: 0.5, subtle: 0.3 } as const;

export function choose(k: Knowledge, round: 0 | 1, rand: Rand, key: string): { card: CardId; reason: Reason } {
  const allowed = k.cards.filter((c) => !k.own.includes(c));
  return k.role === 'detective' ? detectiveChoose(k, allowed, rand, key) : liarChoose(k, round, allowed, rand, key);
}

function detectiveChoose(k: DetectiveKnowledge, allowed: CardId[], rand: Rand, key: string) {
  const direct = allowed.filter((c) => k.scene[c].score === 3);
  const indirect = allowed.filter((c) => k.scene[c].score === 1 || k.scene[c].score === 2);
  const goDirect = rand(key + '|style') < DIRECT_P[k.style];
  const pool = goDirect ? (direct.length ? direct : indirect) : indirect.length ? indirect : direct;
  const card = pick(pool, rand(key + '|card'));
  return { card, reason: { code: goDirect ? 'det.direct' : 'det.indirect', p: { style: k.style } } };
}

function liarChoose(k: LiarKnowledge, round: 0 | 1, allowed: CardId[], rand: Rand, key: string) {
  // after a reveal: copy what others chose most often (excluding its own earlier card)
  if (round === 1 && k.reveals[0]) {
    const counts = new Map<CardId, number>();
    for (const [pid, c] of Object.entries(k.reveals[0])) if (pid !== k.me && allowed.includes(c)) counts.set(c, (counts.get(c) ?? 0) + 1);
    if (counts.size) {
      const max = Math.max(...counts.values());
      const top = [...counts.keys()].filter((c) => counts.get(c) === max);
      const best = Math.max(...top.map((c) => CATEGORY_PRIOR[c]));
      const card = pick(top.filter((c) => CATEGORY_PRIOR[c] === best), rand(key + '|card'));
      return { card, reason: { code: 'liar.crowd', p: { n: max } } };
    }
  }
  // nothing revealed yet: the cards that suit the category best
  const best = Math.max(...allowed.map((c) => CATEGORY_PRIOR[c]));
  const card = pick(allowed.filter((c) => CATEGORY_PRIOR[c] === best), rand(key + '|card'));
  return { card, reason: { code: 'liar.category' } };
}

/** One short answer to "Why did you choose [card]?" */
export function explain(k: Knowledge, card: CardId, pickReason: Reason | undefined): { text: T; reason: Reason } {
  if (k.role === 'detective') return { text: k.scene[card].why, reason: { code: 'explain.det.scene' } };
  if (pickReason?.code === 'liar.crowd') {
    const fill = (s: string, l: 'en' | 'es') => s.replace('{card}', CARD_LABEL[card][l]);
    return { text: t(fill(LIAR_WHY_CROWD.en, 'en'), fill(LIAR_WHY_CROWD.es, 'es')), reason: { code: 'explain.liar.crowd' } };
  }
  return { text: LIAR_WHY_CATEGORY[card], reason: { code: 'explain.liar.category' } };
}

/**
 * Detective: sum of its own association scores for each player's two cards; the lowest total is the
 * most doubtful. Equal totals are equally plausible suspects: reproducible random among them.
 * Liar: deflect onto the player whose cards were shared least with anyone else (public choices only).
 */
export function vote(k: Knowledge, rand: Rand, key: string): { targetId: string; reason: Reason } {
  const others = k.players.filter((p) => p !== k.me);
  const score: Record<string, number> = {};
  for (const p of others) {
    const cards = k.reveals.map((r) => r[p]).filter(Boolean) as CardId[];
    if (k.role === 'detective') score[p] = -cards.reduce((n, c) => n + k.scene[c].score, 0);
    // how many of p's cards nobody else chose in the same round
    else score[p] = cards.filter((c, i) => !Object.entries(k.reveals[i] ?? {}).some(([q, c2]) => q !== p && c2 === c)).length;
  }
  const max = Math.max(...others.map((p) => score[p]));
  const top = others.filter((p) => score[p] === max);
  const targetId = pick(top, rand(key + '|vote'));
  return { targetId, reason: { code: k.role === 'detective' ? 'vote.det.lowest' : 'vote.liar.outlier', p: { tied: top.length > 1 ? top.length : 0 } } };
}
