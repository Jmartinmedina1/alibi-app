/**
 * PRIVATE: the secret picture. Imported by the engine only to build Detective views and the
 * final reveal. It must never reach a Liar view model or Liar bot knowledge.
 */
import { t, type T } from './cards';

export const SCENE_KEY = 'haunted-house-v1';
export const SCENE_NAME: T = t('Haunted House Attraction', 'Casa embrujada (atracción)');
export const SCENE_DESCRIPTION: T = t(
  'A red entrance curtain, a masked performer stepping out beside a rattling cupboard, a green trail on the floor, and a small group of visitors moving through.',
  'Un telón rojo en la entrada, un actor con máscara que aparece junto a un armario que se sacude, un camino verde en el piso y un grupo pequeño de visitantes que avanza.',
);
