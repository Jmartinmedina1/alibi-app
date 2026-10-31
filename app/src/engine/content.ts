import bundle from '../content/bundle.json';
import type { Pack, Topic } from './types';

export interface LocCard {
  text: string;
  heat: number;
}
export interface Location {
  id: string;
  pack: Pack;
  category: string;
  emoji: string;
  name: string;
  nameEn?: string;
  fullName: string;
  clues: string[];
  hint: string;
  hintEasy?: string;
  hintHard?: string;
  /** Joker mode: 2 extra-ridiculous answers per topic. */
  jokers?: Record<Topic, string[]>;
  facts: { en?: string; es?: string }[];
  cards: Record<Topic, LocCard[]>;
  vocab?: { es: string; en: string }[];
}

type Bilingual = { en: string; es?: string };

export interface Comedy {
  inspector: Record<string, Bilingual[]>;
  suspects: Record<
    string,
    { name?: string; bio?: Bilingual; onReveal: Bilingual[]; onVoted: Bilingual[] }
  >;
  objection: { banner: Bilingual; prompt: Bilingual; excuses: Bilingual[]; inspectorAfter: Bilingual[] };
  mugshot: {
    title: Bilingual;
    chargeTemplate: Bilingual;
    chargeFallback: Bilingual[];
    escapedTitle: Bilingual;
    escapedLine: Bilingual[];
  };
  awards: { id: string; en: string; es: string }[];
}

export const LOCATIONS: Location[] = (bundle as any).locations;
export const COMEDY: Comedy = (bundle as any).comedy;
export const TRANSLATIONS: Record<string, string> = (bundle as any).translations;

const byId = new Map(LOCATIONS.map((l) => [l.id, l]));
export function getLocation(id: string): Location {
  const l = byId.get(id);
  if (!l) throw new Error('Unknown location ' + id);
  return l;
}

export function locationsInPack(pack: Pack): Location[] {
  return LOCATIONS.filter((l) => l.pack === pack);
}

export const TOPICS: Topic[] = ['food', 'sound', 'people', 'object', 'leaving', 'where', 'doing'];

/** Bots are played by the cast. Portraits live in the app's assets. */
export const CAST = [
  { id: 'chef-bruno', name: 'Chef Bruno' },
  { id: 'skater-leo', name: 'Skater Leo' },
  { id: 'rosa', name: 'Rosa' },
  { id: 'mr-sterling', name: 'Mr. Sterling' },
  { id: 'sunny', name: 'Sunny' },
  { id: 'granny-dot', name: 'Granny Dot' },
  { id: 'big-tony', name: 'Big Tony' },
];

export function commentLines(key: string): Bilingual[] {
  // key like "inspector.voteStart" or "suspects.rosa.onVoted" or "objection.excuses"
  const parts = key.split('.');
  let node: any = COMEDY;
  for (const p of parts) node = node?.[p];
  return Array.isArray(node) ? node : [];
}
