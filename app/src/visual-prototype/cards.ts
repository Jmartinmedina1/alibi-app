/**
 * Public data: the six concepts every participant sees, and the Liar's category.
 * Nothing here describes the secret picture.
 */
export type Lang = 'en' | 'es';
export type T = { en: string; es: string };
export const t = (en: string, es: string): T => ({ en, es });

export const CARD_IDS = ['footprints', 'spotlight', 'key', 'microphone', 'curtain', 'mask'] as const;
export type CardId = (typeof CARD_IDS)[number];

export const CARD_LABEL: Record<CardId, T> = {
  footprints: t('Footprints', 'Huellas'),
  spotlight: t('Spotlight', 'Reflector'),
  key: t('Key', 'Llave'),
  microphone: t('Microphone', 'Micrófono'),
  curtain: t('Curtain', 'Telón'),
  mask: t('Mask', 'Máscara'),
};

/** The only thing the Liar is told about the picture. */
export const CATEGORY: T = t('Entertainment', 'Entretenimiento');
