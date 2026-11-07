import type { CardId, T } from '../cards';
import type { Style } from '../knowledge';
import type { Conn, SceneId } from './scenes';

type Base = { me: string; style: Style; players: string[]; cards: CardId[]; reveal: Record<string, CardId> | null; own: CardId | null };
/** Detectives know which cards connect to the picture they saw. They do not see the other two candidates. */
export type DetectiveKnowledgeB = Base & { role: 'detective'; secret: Record<CardId, Conn> };
/** The Liar knows the category; only once caught (guess phase) does it see the three candidates, unmarked. */
export type LiarKnowledgeB = Base & { role: 'liar'; category: T; candidates: { id: SceneId; connections: Record<CardId, Conn> }[] | null };
export type KnowledgeB = DetectiveKnowledgeB | LiarKnowledgeB;
