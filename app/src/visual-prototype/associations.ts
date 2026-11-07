/**
 * DETECTIVE BOTS ONLY. Hand-authored strength of each card's connection to the secret picture.
 *   3 = direct (the thing is visible)   2 = indirect   1 = weak   0 = no connection I can see
 * These are one author's judgments, not truth. They are never shown to players, and a low total
 * is not proof that someone is lying: a Detective may choose a weak card on purpose.
 */
import { t, type CardId, type T } from './cards';

export type Association = { score: 0 | 1 | 2 | 3; why: T };

export const SCENE_ASSOCIATIONS: Record<CardId, Association> = {
  curtain: { score: 3, why: t("That's how we all got in.", 'Por ahí entramos todos.') },
  mask: { score: 3, why: t("Somebody in there didn't want their face seen.", 'Alguien ahí dentro no quería que le vieran la cara.') },
  footprints: { score: 2, why: t('We were all following the same path on the floor.', 'Todos seguíamos el mismo camino en el piso.') },
  key: { score: 1, why: t('Something in there looked like it should stay locked.', 'Algo ahí dentro parecía que debía quedarse cerrado con llave.') },
  spotlight: { score: 1, why: t('The whole thing felt like a show.', 'Todo parecía un espectáculo.') },
  microphone: { score: 0, why: t("Honestly, it's a stretch. Someone was probably screaming.", 'La verdad, es forzado. Seguro alguien gritaba.') },
};
