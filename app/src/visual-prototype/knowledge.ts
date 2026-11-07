/**
 * What a bot is allowed to know. Built by engine.knowledgeFor(); bots receive nothing else.
 * Both roles: the six cards, completed reveals, the public challenge explanation, their own choices.
 * Detectives additionally: the scene associations. Liars additionally: the category.
 * Neither ever sees pending (uncommitted or unrevealed) selections.
 */
import type { Association } from './associations';
import type { CardId, T } from './cards';

export type Style = 'direct' | 'mixed' | 'subtle';
export type PublicExplanation = { askerId: string; targetId: string; card: CardId; text: T };
type Base = {
  me: string;
  style: Style;
  players: string[];
  cards: CardId[];
  /** reveals[0] = first selection of every player, reveals[1] = second; only rounds already revealed */
  reveals: Record<string, CardId>[];
  explanations: PublicExplanation[];
  own: CardId[];
};
export type DetectiveKnowledge = Base & { role: 'detective'; scene: Record<CardId, Association> };
export type LiarKnowledge = Base & { role: 'liar'; category: T };
export type Knowledge = DetectiveKnowledge | LiarKnowledge;
export type Reason = { code: string; p?: Record<string, string | number> };
