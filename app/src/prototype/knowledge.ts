/**
 * What each role is allowed to know. These are the ONLY inputs bot decision code receives.
 *
 * - PublicLine: text + the details the sentence states (`asserts`). No classification, no notes.
 * - LiarKnowledge: category hint, public testimony (as it stood at that moment), own lines.
 * - DetectiveKnowledge: the same, plus the case evidence.
 *
 * Nothing here is ever updated in place: knowledge is rebuilt from the closed record each time,
 * and an item only enters the record once it has been said.
 */
import type { Assert, T, Topic } from './caseData';

export type Role = 'detective' | 'liar';
export type Judgment = 'fits' | 'conflict' | 'unclear';
export type Trait = 'cautious' | 'steady' | 'bold';

export interface PublicLine {
  id: string;
  text: T;
  asserts: Assert[];
}
export interface PublicQuestion {
  id: string;
  topic: Topic;
  text: T;
}
export interface PublicExchange {
  n: number;
  kind: 'initial' | 'extra';
  askerId: string;
  respondentId: string;
  question: PublicQuestion | null;
  /** the earlier exchange this one follows up on (extra interrogation) */
  followUpOf?: number;
  claim: PublicLine | null;
  followUpQ: T | null;
  response: PublicLine | null;
  /** only present once every judgment is in */
  judgments: Record<string, Judgment> | null;
}
export interface PlayerPublic {
  id: string;
  name: string;
}
interface BaseKnowledge {
  me: string;
  players: PlayerPublic[];
  testimony: PublicExchange[];
  questions: PublicQuestion[];
}
export interface LiarKnowledge extends BaseKnowledge {
  role: 'liar';
  category: T;
}
export interface DetectiveKnowledge extends BaseKnowledge {
  role: 'detective';
  /** the case file, as a Detective reads it: each checkable detail */
  evidence: { factId: string; text: T; details: Assert[] }[];
}
export type Knowledge = LiarKnowledge | DetectiveKnowledge;

export interface Reason {
  code: string;
  p?: Record<string, string | number>;
}
