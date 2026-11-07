/**
 * Variant B: three candidate pictures in "Entertainment" and the manually checked card connections
 * (docs/visual-prototype/variant-b.md). null = no honest connection.
 * Before the Liar's final guess this table is used only for the SECRET picture, and only by Detectives.
 * After the vote, all three pictures (and therefore their visible connections) are public.
 */
import { t, type CardId, type T } from '../cards';

export type SceneId = 'haunted' | 'magic' | 'masquerade';
export type Conn = 'direct' | 'indirect' | null;
export const SCENE_IDS: SceneId[] = ['haunted', 'magic', 'masquerade'];

export const SCENE_NAME: Record<SceneId, T> = {
  haunted: t('Haunted house', 'Casa embrujada'),
  magic: t('Magic show', 'Espectáculo de magia'),
  masquerade: t('Masquerade ball', 'Baile de máscaras'),
};

export const CONNECTIONS: Record<SceneId, Record<CardId, Conn>> = {
  haunted: { curtain: 'direct', mask: 'direct', footprints: 'indirect', key: 'direct', spotlight: null, microphone: null },
  magic: { curtain: 'direct', mask: null, footprints: null, key: 'direct', spotlight: 'direct', microphone: 'direct' },
  masquerade: { curtain: 'direct', mask: 'direct', footprints: 'direct', key: null, spotlight: 'direct', microphone: 'direct' },
};
