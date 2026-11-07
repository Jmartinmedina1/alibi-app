/**
 * LIAR INPUT: how strongly each card suggests the CATEGORY alone ("Entertainment"),
 * written without looking at the picture. Used by Liar bots before anything is revealed.
 */
import { t, type CardId, type T } from './cards';

export const CATEGORY_PRIOR: Record<CardId, 0 | 1 | 2> = {
  microphone: 2,
  spotlight: 2,
  curtain: 2,
  mask: 1,
  key: 0,
  footprints: 0,
};

/** One-line explanations a Liar bot can give, built only from the category or from public choices. */
export const LIAR_WHY_CATEGORY: Record<CardId, T> = {
  microphone: t('Feels like a show. Somebody has to talk to the crowd.', 'Parece un espectáculo. Alguien tiene que hablarle al público.'),
  spotlight: t("It's entertainment. Someone is always in the light.", 'Es entretenimiento. Siempre hay alguien bajo la luz.'),
  curtain: t('Any show starts with a curtain.', 'Todo espectáculo empieza con un telón.'),
  mask: t('Costumes are part of the fun.', 'Los disfraces son parte de la diversión.'),
  key: t('Felt like there was something to unlock.', 'Sentí que había algo que abrir.'),
  footprints: t('We were moving around a lot.', 'Nos movíamos mucho.'),
};
/** {card} is filled with the card label. */
export const LIAR_WHY_CROWD: T = t("{card}: I wasn't the only one who noticed that.", '{card}: no solo yo me fijé en eso.');
