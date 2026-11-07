/** Variant B bot rules. Each takes only role knowledge and returns the rule it used. */
import { CATEGORY_PRIOR } from '../categoryHints';
import type { CardId } from '../cards';
import type { Reason } from '../knowledge';
import { pick, type Rand } from '../rand';
import type { DetectiveKnowledgeB, KnowledgeB, LiarKnowledgeB } from './knowledge';
import type { SceneId } from './scenes';

const DIRECT_P = { direct: 0.7, mixed: 0.5, subtle: 0.3 } as const;

/** Detective: a card connected to its picture; direct or indirect by personality. Bots cannot see the
 *  other candidates, so they do not model how much a card gives away. Liar: best category fit, blind. */
export function chooseB(k: KnowledgeB, rand: Rand, key: string): { card: CardId; reason: Reason } {
  if (k.role === 'detective') {
    const linked = k.cards.filter((c) => k.secret[c]);
    const direct = linked.filter((c) => k.secret[c] === 'direct');
    const indirect = linked.filter((c) => k.secret[c] === 'indirect');
    const goDirect = rand(key + '|style') < DIRECT_P[k.style] || !indirect.length;
    const card = pick(goDirect ? direct : indirect, rand(key + '|card'));
    return { card, reason: { code: goDirect ? 'b.det.direct' : 'b.det.indirect', p: { style: k.style } } };
  }
  const best = Math.max(...k.cards.map((c) => CATEGORY_PRIOR[c]));
  return { card: pick(k.cards.filter((c) => CATEGORY_PRIOR[c] === best), rand(key + '|card')), reason: { code: 'b.liar.category' } };
}

/** Detective: suspect players whose card has no connection to its picture; otherwise everyone is
 *  equally plausible (seeded pick). Liar: the player whose card nobody else chose. */
export function voteB(k: KnowledgeB, rand: Rand, key: string): { targetId: string; reason: Reason } {
  const others = k.players.filter((p) => p !== k.me);
  const reveal = k.reveal ?? {};
  const score = (p: string) =>
    k.role === 'detective' ? (k.secret[reveal[p]] ? 0 : 1) : Object.entries(reveal).some(([q, c]) => q !== p && c === reveal[p]) ? 0 : 1;
  const max = Math.max(...others.map(score));
  const top = others.filter((p) => score(p) === max);
  return { targetId: pick(top, rand(key + '|vote')), reason: { code: k.role === 'detective' ? (max ? 'b.vote.det.unlinked' : 'b.vote.det.none') : 'b.vote.liar.outlier', p: { tied: top.length > 1 ? top.length : 0 } } };
}

/** Caught Liar: the candidate that fits the most of the other players' revealed cards; ties seeded. */
export function guessB(k: LiarKnowledgeB, rand: Rand, key: string): { scene: SceneId; reason: Reason } {
  const cands = k.candidates ?? [];
  const cards = Object.entries(k.reveal ?? {}).filter(([p]) => p !== k.me).map(([, c]) => c);
  const fit = (i: number) => cards.filter((c) => cands[i].connections[c]).length;
  const max = Math.max(...cands.map((_, i) => fit(i)));
  const top = cands.filter((_, i) => fit(i) === max);
  return { scene: pick(top, rand(key + '|guess')).id, reason: { code: 'b.guess.fit', p: { fits: max, of: cards.length, tied: top.length > 1 ? top.length : 0 } } };
}
