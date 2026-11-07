import type { Lang } from '../cards';

const S = {
  variantB: { en: 'Variant B: one card, then the caught Liar may name the picture', es: 'Variante B: una carta y el Mentiroso atrapado puede adivinar la imagen' },
  baselineA: { en: 'Baseline A: two cards and a question', es: 'Base A: dos cartas y una pregunta' },
  tagline: { en: 'Help your team recognize you—but don’t teach the Liar which picture you saw.', es: 'Ayuda a tu equipo a reconocerte, pero no le enseñes al Mentiroso qué imagen viste.' },
  rule1: { en: 'Everyone except the Liar sees the secret picture; the Liar sees only the category.', es: 'Todos menos el Mentiroso ven la imagen secreta; el Mentiroso solo ve la categoría.' },
  rule2: { en: 'Everyone picks one card connected to the picture, then votes for the Liar. A tied top vote lets the Liar escape.', es: 'Cada uno elige una carta relacionada con la imagen y luego vota por el Mentiroso. Si hay empate en el mayor número de votos, el Mentiroso escapa.' },
  rule3: { en: 'If the Liar is caught, they see three pictures and get one guess. Naming the right one lets them escape.', es: 'Si atrapan al Mentiroso, ve tres imágenes y tiene un intento. Si acierta, escapa.' },
  playDetective: { en: 'Variant B as Detective', es: 'Variante B como Detective' },
  playLiar: { en: 'Variant B as the Liar', es: 'Variante B como el Mentiroso' },
  qaCaught: { en: 'QA B: the bots always vote for you (you are the Liar)', es: 'QA B: los bots siempre votan por ti (eres el Mentiroso)' },
  prompt: { en: 'Choose one card connected to the secret picture.', es: 'Elige una carta relacionada con la imagen secreta.' },
  reveal: { en: 'Everyone’s cards', es: 'Las cartas de todos' },
  caughtYou: { en: 'You were caught. Which picture did the others see?', es: 'Te atraparon. ¿Qué imagen vieron los demás?' },
  guessHelp: { en: 'One guess. If it is right, you escape.', es: 'Un intento. Si aciertas, escapas.' },
  pictureN: { en: 'Picture {n}', es: 'Imagen {n}' },
  confirmGuess: { en: 'Guess: Picture {n}', es: 'Elegir: Imagen {n}' },
  waitGuess: { en: '{name} was caught and is now guessing which of these pictures you saw…', es: 'Atraparon a {name}, que ahora intenta adivinar cuál de estas imágenes vieron…' },
  found: { en: 'Detectives found the Liar', es: 'Los Detectives encontraron al Mentiroso' },
  named: { en: 'The Liar was caught but named the picture, and escapes', es: 'Atraparon al Mentiroso, pero adivinó la imagen y escapa' },
  blended: { en: 'The Liar blended in', es: 'El Mentiroso pasó desapercibido' },
  liarGuessed: { en: 'The Liar guessed: {name}', es: 'El Mentiroso eligió: {name}' },
  secretWas: { en: 'The secret picture: {name}', es: 'La imagen secreta: {name}' },
  candidatesTitle: { en: 'The three pictures', es: 'Las tres imágenes' },
  noteB: {
    en: 'Players judged connections between cards and the picture. A card that helped your team recognize you could also help a caught Liar pick the picture.',
    es: 'Todos juzgaban la relación entre las cartas y la imagen. Una carta que ayudó a tu equipo a reconocerte también pudo ayudar al Mentiroso atrapado a elegir la imagen.',
  },
  'b.det.direct': { en: 'Detective ({style}): a card plainly in its picture', es: 'Detective ({style}): una carta que se ve en su imagen' },
  'b.det.indirect': { en: 'Detective ({style}): a less direct card connected to its picture', es: 'Detective ({style}): una carta menos directa relacionada con su imagen' },
  'b.liar.category': { en: 'Liar: chose blind, by the category', es: 'Mentiroso: eligió a ciegas, por la categoría' },
  'b.vote.det.unlinked': { en: 'Detective: voted for a card not connected to its picture', es: 'Detective: votó por una carta sin relación con su imagen' },
  'b.vote.det.none': { en: 'Detective: every card fit; no evidence, so a reproducible random pick', es: 'Detective: todas las cartas encajaban; sin pruebas, elección aleatoria reproducible' },
  'b.vote.liar.outlier': { en: 'Liar: voted for a player whose card nobody else chose', es: 'Mentiroso: votó por alguien cuya carta nadie más eligió' },
  'b.guess.fit': { en: 'Liar: picked the picture that fits the most of the others’ cards ({fits} of {of})', es: 'Mentiroso: eligió la imagen que encaja con más cartas de los demás ({fits} de {of})' },
  'b.qa.forcedCatch': { en: 'QA script: forced vote for you', es: 'Guion de QA: voto forzado por ti' },
} as const;

export type KeyB = keyof typeof S;
export const STRINGS_B = S;
export function sb(lang: Lang, key: KeyB, p?: Record<string, string | number>): string {
  let out: string = S[key][lang];
  for (const [k, v] of Object.entries(p ?? {})) out = out.split('{' + k + '}').join(String(v));
  return out;
}
