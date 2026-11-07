/**
 * Case Logic Prototype — the Haunted House case.
 *
 * Two kinds of data live here, and the engine keeps them apart:
 *  - PUBLIC meaning of a line: its text and `asserts` (the concrete details the sentence claims,
 *    e.g. "a blue line on the floor" asserts route.marker = blue-line). Anyone who reads the
 *    sentence knows this, so the Liar may see it.
 *  - PRIVILEGED authoring metadata: the case facts (`truth`), `cls` (supports / conflicts /
 *    inconclusive) and `note`. Only Detectives (through their evidence), the reveal and the
 *    tests may use it. The Liar's decision code never receives it.
 *
 * A claim CONFLICTS only when it asserts a different value for a detail the case file states.
 * Something the case file never mentions (a queue, music, a scream) is INCONCLUSIVE, not false.
 */

export type Lang = 'en' | 'es';
export type T = { en: string; es: string };
export type Topic = 'entrance' | 'route' | 'incident';
export type Cls = 'supports' | 'conflicts' | 'inconclusive';
export type Assert = { slot: string; value: string };

export interface Fact {
  id: string;
  block: 'A' | 'B' | 'C';
  text: T;
  truth: Assert[];
}
export interface Response {
  id: string;
  text: T;
  asserts: Assert[];
  /** authoring classification (validated against `asserts` + facts by the tests) */
  cls: Cls;
  /** a self-correction: asserts a different value than the speaker's own claim in this exchange */
  revises?: boolean;
  note?: T;
}
export interface Claim {
  id: string;
  text: T;
  asserts: Assert[];
  cls: Cls;
  note?: T;
  followUp: { q: T; responses: Response[] };
}
export interface Question {
  id: string;
  topic: Topic;
  text: T;
  claims: Claim[];
}
export interface Challenge {
  slot: string;
  q: T;
  options: { value: string; text: T }[];
}

const t = (en: string, es: string): T => ({ en, es });
const a = (slot: string, value: string): Assert => ({ slot, value });
const none: Assert[] = [];

// ---------------------------------------------------------------- the case

export const LOCATION: T = t('Haunted House Attraction', 'Atracción de casa embrujada');
export const CATEGORY: T = t('Live entertainment', 'Entretenimiento en vivo');

export const EVIDENCE_BLOCKS: { block: 'A' | 'B' | 'C'; title: T; text: T }[] = [
  {
    block: 'A',
    title: t('Entrance', 'Entrada'),
    text: t(
      'A guide collected tickets at a red curtain. Visitors entered in small groups.',
      'Un guía recogía los boletos junto a una cortina roja. Los visitantes entraban en grupos pequeños.',
    ),
  },
  {
    block: 'B',
    title: t('Route', 'Recorrido'),
    text: t(
      'Visitors walked through dark corridors. A green floor line marked the route.',
      'Los visitantes recorrían pasillos oscuros. Una línea verde en el piso marcaba el camino.',
    ),
  },
  {
    block: 'C',
    title: t('Incident', 'Incidente'),
    text: t(
      'A masked actor appeared beside a rattling cupboard. The group hurried toward the exit.',
      'Un actor con máscara apareció junto a un armario que se sacudía. El grupo se apresuró hacia la salida.',
    ),
  },
];

/** Each fact is one checkable sentence of the evidence, with the details it fixes. */
export const FACTS: Fact[] = [
  { id: 'tickets', block: 'A', text: t('A guide collected the tickets.', 'Un guía recogía los boletos.'), truth: [a('tickets.collected', 'yes'), a('tickets.who', 'guide')] },
  { id: 'curtain', block: 'A', text: t('Tickets were collected at a red curtain.', 'Los boletos se recogían junto a una cortina roja.'), truth: [a('entrance.marker', 'red-curtain')] },
  { id: 'groups', block: 'A', text: t('Visitors entered in small groups.', 'Los visitantes entraban en grupos pequeños.'), truth: [a('entry.group', 'small')] },
  { id: 'corridors', block: 'B', text: t('Visitors walked through dark corridors.', 'Los visitantes recorrían pasillos oscuros.'), truth: [a('route.mode', 'walked'), a('route.light', 'dark')] },
  { id: 'line', block: 'B', text: t('A green floor line marked the route.', 'Una línea verde en el piso marcaba el camino.'), truth: [a('route.marker', 'green-line')] },
  { id: 'actor', block: 'C', text: t('A masked actor appeared.', 'Apareció un actor con máscara.'), truth: [a('incident.who', 'masked-actor')] },
  { id: 'cupboard', block: 'C', text: t('The actor appeared beside a rattling cupboard.', 'El actor apareció junto a un armario que se sacudía.'), truth: [a('incident.place', 'cupboard')] },
  { id: 'exit', block: 'C', text: t('The group hurried toward the exit.', 'El grupo se apresuró hacia la salida.'), truth: [a('incident.after', 'exit')] },
];

/** Which slots belong to which topic: an answer must speak about its question's topic. */
export const TOPIC_SLOTS: Record<Topic, string[]> = {
  entrance: ['tickets.collected', 'tickets.who', 'entry.staff', 'entrance.marker', 'entry.group'],
  route: ['route.mode', 'route.light', 'route.marker'],
  incident: ['incident.who', 'incident.place', 'incident.after'],
};

export const TOPIC_LABEL: Record<Topic, T> = {
  entrance: t('Entrance', 'Entrada'),
  route: t('Route', 'Recorrido'),
  incident: t('Incident', 'Incidente'),
};

// ---------------------------------------------------------------- questions, claims, follow-ups
// Each question offers 5 claims: two that match the case, a "twin" of each that changes one
// checkable detail (so the true option is never the only detailed one), and one vague answer.
// Every claim has one follow-up question; each follow-up offers a consistent detail, a
// conflicting detail (or a self-correction for claims that already conflict) and a vague reply.

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    topic: 'entrance',
    text: t('What happened before you went inside?', '¿Qué pasó antes de que entraras?'),
    claims: [
      {
        id: 'q1a',
        text: t('A guide took our tickets.', 'Un guía nos recogió los boletos.'),
        asserts: [a('tickets.collected', 'yes'), a('tickets.who', 'guide')],
        cls: 'supports',
        followUp: {
          q: t('What did the guide do after taking your ticket?', '¿Qué hizo el guía después de recoger tu boleto?'),
          responses: [
            { id: 'q1a1', text: t('Held a red curtain open and let a few of us in.', 'Abrió una cortina roja y nos dejó pasar a unos pocos.'), asserts: [a('entrance.marker', 'red-curtain'), a('entry.group', 'small')], cls: 'supports' },
            { id: 'q1a2', text: t('Opened a blue door and let everyone in at once.', 'Abrió una puerta azul y nos dejó pasar a todos juntos.'), asserts: [a('entrance.marker', 'blue-door'), a('entry.group', 'crowd')], cls: 'conflicts' },
            { id: 'q1a3', text: t('Said something, but I was looking at my phone.', 'Dijo algo, pero yo estaba mirando mi teléfono.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q1b',
        text: t('We scanned our tickets at a machine. No staff were around.', 'Escaneamos los boletos en una máquina. No había personal.'),
        asserts: [a('tickets.who', 'machine'), a('entry.staff', 'none')],
        cls: 'conflicts',
        followUp: {
          q: t('So how did you know when to go in?', '¿Y cómo sabían cuándo entrar?'),
          responses: [
            { id: 'q1b1', text: t('A light flashed and a gate opened.', 'Parpadeó una luz y se abrió una reja.'), asserts: none, cls: 'inconclusive', note: t('Adds nothing checkable, and keeps the earlier machine story going.', 'No agrega nada comprobable y sigue con la historia de la máquina.') },
            { id: 'q1b2', text: t('Actually, a guide took the tickets after the machine and waved us in.', 'En realidad, después de la máquina un guía recogió los boletos y nos hizo pasar.'), asserts: [a('tickets.collected', 'yes'), a('tickets.who', 'guide'), a('entry.staff', 'guide')], cls: 'supports', revises: true },
            { id: 'q1b3', text: t('Everyone just walked, so I did too.', 'Todos caminaron, así que yo también.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q1c',
        text: t('We waited at a red curtain until they let a few of us in.', 'Esperamos junto a una cortina roja hasta que dejaron pasar a unos pocos.'),
        asserts: [a('entrance.marker', 'red-curtain'), a('entry.group', 'small')],
        cls: 'supports',
        followUp: {
          q: t('Who decided when your group could go in?', '¿Quién decidía cuándo podía entrar tu grupo?'),
          responses: [
            { id: 'q1c1', text: t('A guide, once they had our tickets.', 'Un guía, cuando ya tenía nuestros boletos.'), asserts: [a('tickets.collected', 'yes'), a('tickets.who', 'guide'), a('entry.staff', 'guide')], cls: 'supports' },
            { id: 'q1c2', text: t('A ticket machine. It beeped when it was our turn.', 'Una máquina de boletos. Pitaba cuando nos tocaba.'), asserts: [a('tickets.who', 'machine')], cls: 'conflicts' },
            { id: 'q1c3', text: t('I guess it was timed.', 'Supongo que era por tiempo.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q1d',
        text: t('We waited at a blue door, then the whole crowd went in together.', 'Esperamos junto a una puerta azul y luego entró toda la multitud junta.'),
        asserts: [a('entrance.marker', 'blue-door'), a('entry.group', 'crowd')],
        cls: 'conflicts',
        followUp: {
          q: t('How many people went in with you?', '¿Cuántas personas entraron contigo?'),
          responses: [
            { id: 'q1d1', text: t('Fifty or so. The whole line.', 'Unas cincuenta. Toda la fila.'), asserts: [a('entry.group', 'crowd')], cls: 'conflicts' },
            { id: 'q1d2', text: t('Hmm, maybe five or six of us.', 'Mmm, tal vez cinco o seis.'), asserts: [a('entry.group', 'small')], cls: 'supports', revises: true },
            { id: 'q1d3', text: t("I didn't count.", 'No los conté.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q1e',
        text: t('We stood in line for a while.', 'Hicimos fila un buen rato.'),
        asserts: none,
        cls: 'inconclusive',
        note: t("A line isn't in the case file, so it can't be checked either way.", 'La fila no aparece en el expediente, así que no se puede comprobar.'),
        followUp: {
          q: t('What was at the front of the line?', '¿Qué había al frente de la fila?'),
          responses: [
            { id: 'q1e1', text: t('A red curtain, and a guide taking tickets.', 'Una cortina roja y un guía recogiendo boletos.'), asserts: [a('entrance.marker', 'red-curtain'), a('tickets.collected', 'yes'), a('tickets.who', 'guide')], cls: 'supports' },
            { id: 'q1e2', text: t('A blue door and a ticket machine.', 'Una puerta azul y una máquina de boletos.'), asserts: [a('entrance.marker', 'blue-door'), a('tickets.who', 'machine')], cls: 'conflicts' },
            { id: 'q1e3', text: t("I couldn't see past the people ahead.", 'No veía más allá de la gente de adelante.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
    ],
  },
  {
    id: 'q2',
    topic: 'entrance',
    text: t('Who let you in, and where?', '¿Quién te dejó entrar, y dónde?'),
    claims: [
      {
        id: 'q2a',
        text: t('A guide, at a red curtain.', 'Un guía, junto a una cortina roja.'),
        asserts: [a('entry.staff', 'guide'), a('entrance.marker', 'red-curtain')],
        cls: 'supports',
        followUp: {
          q: t('Did you go in by yourself?', '¿Entraste sin compañía?'),
          responses: [
            { id: 'q2a1', text: t('No, with a small group.', 'No, con un grupo pequeño.'), asserts: [a('entry.group', 'small')], cls: 'supports' },
            { id: 'q2a2', text: t('Yes, one person at a time.', 'Sí, de uno en uno.'), asserts: [a('entry.group', 'alone')], cls: 'conflicts' },
            { id: 'q2a3', text: t('With whoever was standing near me.', 'Con quien estuviera cerca de mí.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q2b',
        text: t('A guide, at a blue door.', 'Un guía, junto a una puerta azul.'),
        asserts: [a('entry.staff', 'guide'), a('entrance.marker', 'blue-door')],
        cls: 'conflicts',
        note: t('A guide fits the case file, but the entrance was a red curtain, not a door.', 'Un guía encaja con el expediente, pero la entrada era una cortina roja, no una puerta.'),
        followUp: {
          q: t('What did the door look like?', '¿Cómo era la puerta?'),
          responses: [
            { id: 'q2b1', text: t('Plain blue, with a skull sticker on it.', 'Azul, sencilla, con una calcomanía de calavera.'), asserts: [a('entrance.marker', 'blue-door')], cls: 'conflicts' },
            { id: 'q2b2', text: t('Wait, it was a red curtain, not a door.', 'Espera, era una cortina roja, no una puerta.'), asserts: [a('entrance.marker', 'red-curtain')], cls: 'supports', revises: true },
            { id: 'q2b3', text: t('I was looking for my ticket, not at the door.', 'Estaba buscando mi boleto, no miraba la puerta.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q2c',
        text: t('Someone sent us in a few at a time.', 'Alguien nos hacía pasar de a pocos.'),
        asserts: [a('entry.group', 'small')],
        cls: 'supports',
        followUp: {
          q: t('What did you hand to that person?', '¿Qué le entregaste a esa persona?'),
          responses: [
            { id: 'q2c1', text: t('My ticket.', 'Mi boleto.'), asserts: [a('tickets.collected', 'yes')], cls: 'supports' },
            { id: 'q2c2', text: t('Nothing. They just pointed us in.', 'Nada. Solo nos señaló la entrada.'), asserts: [a('tickets.collected', 'no')], cls: 'conflicts' },
            { id: 'q2c3', text: t("I don't remember.", 'No me acuerdo.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q2d',
        text: t('Nobody. I walked in on my own.', 'Nadie. Entré por mi cuenta.'),
        asserts: [a('entry.staff', 'none'), a('entry.group', 'alone')],
        cls: 'conflicts',
        followUp: {
          q: t('Nobody checked your ticket?', '¿Nadie revisó tu boleto?'),
          responses: [
            { id: 'q2d1', text: t('Nope. It stayed in my pocket.', 'No. Se quedó en mi bolsillo.'), asserts: [a('tickets.collected', 'no')], cls: 'conflicts' },
            { id: 'q2d2', text: t('Oh, a guide took it first, at the red curtain.', 'Ah, primero un guía lo recogió, junto a la cortina roja.'), asserts: [a('tickets.collected', 'yes'), a('tickets.who', 'guide'), a('entry.staff', 'guide'), a('entrance.marker', 'red-curtain')], cls: 'supports', revises: true },
            { id: 'q2d3', text: t('Maybe someone did. It was busy.', 'Quizá alguien lo revisó. Había mucha gente.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q2e',
        text: t("A staff member. I didn't notice much else.", 'Alguien del personal. No me fijé en mucho más.'),
        asserts: none,
        cls: 'inconclusive',
        note: t('Could fit a guide, but too vague to check anything.', 'Podría ser el guía, pero es demasiado vago para comprobar algo.'),
        followUp: {
          q: t('What was that staff member standing next to?', '¿Junto a qué estaba esa persona del personal?'),
          responses: [
            { id: 'q2e1', text: t('A red curtain.', 'Una cortina roja.'), asserts: [a('entrance.marker', 'red-curtain')], cls: 'supports' },
            { id: 'q2e2', text: t('A blue door.', 'Una puerta azul.'), asserts: [a('entrance.marker', 'blue-door')], cls: 'conflicts' },
            { id: 'q2e3', text: t("I honestly didn't notice.", 'La verdad, no me fijé.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
    ],
  },
  {
    id: 'q3',
    topic: 'route',
    text: t('How did you know where to go?', '¿Cómo sabías por dónde ir?'),
    claims: [
      {
        id: 'q3a',
        text: t('I followed a green line on the floor.', 'Seguí una línea verde en el piso.'),
        asserts: [a('route.marker', 'green-line')],
        cls: 'supports',
        followUp: {
          q: t('Could you see anything else?', '¿Podías ver algo más?'),
          responses: [
            { id: 'q3a1', text: t('Not really. The corridors were dark.', 'No mucho. Los pasillos estaban oscuros.'), asserts: [a('route.light', 'dark')], cls: 'supports' },
            { id: 'q3a2', text: t('Sure, the hallways were well lit.', 'Claro, los pasillos estaban bien iluminados.'), asserts: [a('route.light', 'bright')], cls: 'conflicts' },
            { id: 'q3a3', text: t("Mostly the backs of people's heads.", 'Sobre todo la nuca de la gente.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q3b',
        text: t('I followed a blue line on the floor.', 'Seguí una línea azul en el piso.'),
        asserts: [a('route.marker', 'blue-line')],
        cls: 'conflicts',
        followUp: {
          q: t('Are you sure it was blue?', '¿Seguro que era azul?'),
          responses: [
            { id: 'q3b1', text: t('Yes. Bright blue.', 'Sí. Azul brillante.'), asserts: [a('route.marker', 'blue-line')], cls: 'conflicts' },
            { id: 'q3b2', text: t('Hmm... maybe green. It was dark in there.', 'Mmm… tal vez verde. Ahí adentro estaba oscuro.'), asserts: [a('route.marker', 'green-line'), a('route.light', 'dark')], cls: 'supports', revises: true },
            { id: 'q3b3', text: t('Does the color really matter?', '¿De verdad importa el color?'), asserts: none, cls: 'inconclusive', note: t('Dodges the question instead of answering it.', 'Esquiva la pregunta en vez de responderla.') },
          ],
        },
      },
      {
        id: 'q3c',
        text: t('I stayed close to my group in the dark.', 'Me quedé cerca de mi grupo en la oscuridad.'),
        asserts: [a('route.light', 'dark')],
        cls: 'supports',
        followUp: {
          q: t('How many people were in your group?', '¿Cuántas personas había en tu grupo?'),
          responses: [
            { id: 'q3c1', text: t('Five or six.', 'Cinco o seis.'), asserts: [a('entry.group', 'small')], cls: 'supports' },
            { id: 'q3c2', text: t('Around forty. The whole crowd.', 'Unas cuarenta. Toda la multitud.'), asserts: [a('entry.group', 'crowd')], cls: 'conflicts' },
            { id: 'q3c3', text: t('Enough to keep bumping into each other.', 'Suficientes para chocar todo el rato.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q3d',
        text: t('Signs lit up the hallway, so it was easy.', 'Unos letreros iluminaban el pasillo, así que fue fácil.'),
        asserts: [a('route.light', 'bright')],
        cls: 'conflicts',
        note: t('The case file says the corridors were dark. (Signs themselves are not ruled out.)', 'Según el expediente los pasillos estaban oscuros. (Los letreros en sí no se descartan.)'),
        followUp: {
          q: t('What did the signs say?', '¿Qué decían los letreros?'),
          responses: [
            { id: 'q3d1', text: t('Arrows and the word EXIT.', 'Flechas y la palabra SALIDA.'), asserts: none, cls: 'inconclusive', note: t('Adds nothing checkable, and keeps the bright-hallway story going.', 'No agrega nada comprobable y sigue con la historia del pasillo iluminado.') },
            { id: 'q3d2', text: t('Sorry, it was too dark to read signs. I watched the floor.', 'Perdón, estaba demasiado oscuro para leer letreros. Miraba el piso.'), asserts: [a('route.light', 'dark')], cls: 'supports', revises: true },
            { id: 'q3d3', text: t("I didn't read them. I just walked.", 'No los leí. Solo caminé.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q3e',
        text: t('I kept watching the floor.', 'Iba mirando el piso.'),
        asserts: none,
        cls: 'inconclusive',
        note: t('Hints at something on the floor, but names nothing checkable.', 'Insinúa algo en el piso, pero no nombra nada comprobable.'),
        followUp: {
          q: t('What were you looking for?', '¿Qué buscabas?'),
          responses: [
            { id: 'q3e1', text: t('The green line that marked the way.', 'La línea verde que marcaba el camino.'), asserts: [a('route.marker', 'green-line')], cls: 'supports' },
            { id: 'q3e2', text: t('The blue line that marked the way.', 'La línea azul que marcaba el camino.'), asserts: [a('route.marker', 'blue-line')], cls: 'conflicts' },
            { id: 'q3e3', text: t('Anything I might trip over.', 'Cualquier cosa con la que pudiera tropezar.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
    ],
  },
  {
    id: 'q4',
    topic: 'route',
    text: t('What was it like walking through?', '¿Cómo era el recorrido por dentro?'),
    claims: [
      {
        id: 'q4a',
        text: t('Dark corridors. I could barely see my hands.', 'Pasillos oscuros. Apenas me veía las manos.'),
        asserts: [a('route.mode', 'walked'), a('route.light', 'dark')],
        cls: 'supports',
        followUp: {
          q: t('Then how did you find the way?', '¿Y cómo encontraste el camino?'),
          responses: [
            { id: 'q4a1', text: t('A green line on the floor.', 'Una línea verde en el piso.'), asserts: [a('route.marker', 'green-line')], cls: 'supports' },
            { id: 'q4a2', text: t('A blue line on the floor.', 'Una línea azul en el piso.'), asserts: [a('route.marker', 'blue-line')], cls: 'conflicts' },
            { id: 'q4a3', text: t('I kept one hand on the wall.', 'Iba con una mano en la pared.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q4b',
        text: t('Bright and open, like a school hallway.', 'Iluminado y amplio, como el pasillo de una escuela.'),
        asserts: [a('route.light', 'bright')],
        cls: 'conflicts',
        followUp: {
          q: t('Where was the light coming from?', '¿De dónde venía la luz?'),
          responses: [
            { id: 'q4b1', text: t('Big lights on the ceiling.', 'De unas lámparas grandes en el techo.'), asserts: [a('route.light', 'bright')], cls: 'conflicts' },
            { id: 'q4b2', text: t('Well... it was mostly dark. Just a faint glow.', 'Bueno… estaba casi todo oscuro. Solo un brillo tenue.'), asserts: [a('route.light', 'dark')], cls: 'supports', revises: true },
            { id: 'q4b3', text: t('Somewhere up ahead.', 'De algún lugar más adelante.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q4c',
        text: t('Narrow corridors. We had to walk one behind another.', 'Pasillos angostos. Teníamos que caminar uno detrás de otro.'),
        asserts: [a('route.mode', 'walked')],
        cls: 'supports',
        note: t('Matches walking through corridors, but says nothing about light or the floor line.', 'Coincide con recorrer pasillos, pero no dice nada de la luz ni de la línea del piso.'),
        followUp: {
          q: t('Who was at the front?', '¿Quién iba al frente?'),
          responses: [
            { id: 'q4c1', text: t('Me, following a green line.', 'Yo, siguiendo una línea verde.'), asserts: [a('route.marker', 'green-line')], cls: 'supports' },
            { id: 'q4c2', text: t('Me, following a blue line.', 'Yo, siguiendo una línea azul.'), asserts: [a('route.marker', 'blue-line')], cls: 'conflicts' },
            { id: 'q4c3', text: t('A tall guy. I stayed in the middle.', 'Un tipo alto. Yo iba en medio.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q4d',
        text: t("We sat in rows and watched. We didn't walk much.", 'Nos sentamos en filas a mirar. Casi no caminamos.'),
        asserts: [a('route.mode', 'seated')],
        cls: 'conflicts',
        followUp: {
          q: t('What were you watching?', '¿Qué estaban mirando?'),
          responses: [
            { id: 'q4d1', text: t('Actors on a stage.', 'Actores en un escenario.'), asserts: [a('route.mode', 'seated')], cls: 'conflicts' },
            { id: 'q4d2', text: t('Sorry, I mixed it up. We walked through dark corridors.', 'Perdón, me confundí. Recorrimos pasillos oscuros.'), asserts: [a('route.mode', 'walked'), a('route.light', 'dark')], cls: 'supports', revises: true },
            { id: 'q4d3', text: t('Whatever was in front of us.', 'Lo que hubiera enfrente.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q4e',
        text: t('Creepy music played the whole time.', 'Hubo música tétrica todo el tiempo.'),
        asserts: none,
        cls: 'inconclusive',
        note: t("Music isn't in the case file, so it can't be checked either way.", 'La música no aparece en el expediente, así que no se puede comprobar.'),
        followUp: {
          q: t('Did the music ever change?', '¿La música cambió en algún momento?'),
          responses: [
            { id: 'q4e1', text: t('It got loud when a cupboard started rattling.', 'Subió de volumen cuando un armario empezó a sacudirse.'), asserts: [a('incident.place', 'cupboard')], cls: 'supports' },
            { id: 'q4e2', text: t('It got loud when an actor without a mask showed up.', 'Subió de volumen cuando apareció un actor sin máscara.'), asserts: [a('incident.who', 'unmasked-actor')], cls: 'conflicts' },
            { id: 'q4e3', text: t('Not that I noticed.', 'No que yo notara.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
    ],
  },
  {
    id: 'q5',
    topic: 'incident',
    text: t('What made everyone move suddenly?', '¿Qué hizo que todos se movieran de repente?'),
    claims: [
      {
        id: 'q5a',
        text: t('A masked actor jumped out.', 'Salió de golpe un actor con máscara.'),
        asserts: [a('incident.who', 'masked-actor')],
        cls: 'supports',
        followUp: {
          q: t('Where did the actor come from?', '¿De dónde salió el actor?'),
          responses: [
            { id: 'q5a1', text: t('From beside a rattling cupboard.', 'De al lado de un armario que se sacudía.'), asserts: [a('incident.place', 'cupboard')], cls: 'supports' },
            { id: 'q5a2', text: t('From the top of a creaky staircase.', 'De lo alto de una escalera que crujía.'), asserts: [a('incident.place', 'staircase')], cls: 'conflicts' },
            { id: 'q5a3', text: t('Somewhere on my left.', 'De algún lado a mi izquierda.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q5b',
        text: t('An actor with no mask, just face paint.', 'Un actor sin máscara, solo con la cara pintada.'),
        asserts: [a('incident.who', 'unmasked-actor')],
        cls: 'conflicts',
        followUp: {
          q: t('What did the face paint look like?', '¿Cómo era la pintura de la cara?'),
          responses: [
            { id: 'q5b1', text: t('White, with big black eyes.', 'Blanca, con ojos negros enormes.'), asserts: none, cls: 'inconclusive', note: t('Adds nothing checkable, and keeps the no-mask story going.', 'No agrega nada comprobable y sigue con la historia sin máscara.') },
            { id: 'q5b2', text: t('Hmm, maybe it was a mask, not paint.', 'Mmm, tal vez era una máscara, no pintura.'), asserts: [a('incident.who', 'masked-actor')], cls: 'supports', revises: true },
            { id: 'q5b3', text: t('Scary. I looked away.', 'Daba miedo. Aparté la mirada.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q5c',
        text: t('A cupboard started rattling, and someone appeared beside it.', 'Un armario empezó a sacudirse y alguien apareció a su lado.'),
        asserts: [a('incident.place', 'cupboard')],
        cls: 'supports',
        followUp: {
          q: t('Who appeared?', '¿Quién apareció?'),
          responses: [
            { id: 'q5c1', text: t('An actor in a mask.', 'Un actor con máscara.'), asserts: [a('incident.who', 'masked-actor')], cls: 'supports' },
            { id: 'q5c2', text: t('An actor without a mask.', 'Un actor sin máscara.'), asserts: [a('incident.who', 'unmasked-actor')], cls: 'conflicts' },
            { id: 'q5c3', text: t("I didn't get a good look.", 'No alcancé a verlo bien.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q5d',
        text: t('A staircase creaked, and someone appeared on it.', 'Crujió una escalera y alguien apareció en ella.'),
        asserts: [a('incident.place', 'staircase')],
        cls: 'conflicts',
        followUp: {
          q: t('Who was on the staircase?', '¿Quién estaba en la escalera?'),
          responses: [
            { id: 'q5d1', text: t('An actor with no mask.', 'Un actor sin máscara.'), asserts: [a('incident.who', 'unmasked-actor')], cls: 'conflicts' },
            { id: 'q5d2', text: t('Wait, it was a masked actor, beside a rattling cupboard. Not a staircase.', 'Espera, era un actor con máscara, junto a un armario que se sacudía. No una escalera.'), asserts: [a('incident.who', 'masked-actor'), a('incident.place', 'cupboard')], cls: 'supports', revises: true },
            { id: 'q5d3', text: t("I didn't get a good look.", 'No alcancé a verlo bien.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q5e',
        text: t('Someone behind me screamed.', 'Alguien detrás de mí gritó.'),
        asserts: none,
        cls: 'inconclusive',
        note: t("A scream isn't in the case file, so it can't be checked either way.", 'Un grito no aparece en el expediente, así que no se puede comprobar.'),
        followUp: {
          q: t('What made them scream?', '¿Por qué gritó?'),
          responses: [
            { id: 'q5e1', text: t('A masked actor, right by a rattling cupboard.', 'Un actor con máscara, justo al lado de un armario que se sacudía.'), asserts: [a('incident.who', 'masked-actor'), a('incident.place', 'cupboard')], cls: 'supports' },
            { id: 'q5e2', text: t('An actor with no mask, on a staircase.', 'Un actor sin máscara, en una escalera.'), asserts: [a('incident.who', 'unmasked-actor'), a('incident.place', 'staircase')], cls: 'conflicts' },
            { id: 'q5e3', text: t("I didn't turn around to look.", 'No me volteé a ver.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
    ],
  },
  {
    id: 'q6',
    topic: 'incident',
    text: t('After everyone moved suddenly, where did your group go?', 'Cuando todos se movieron de repente, ¿a dónde fue tu grupo?'),
    claims: [
      {
        id: 'q6a',
        text: t('We hurried toward the exit.', 'Nos apresuramos hacia la salida.'),
        asserts: [a('incident.after', 'exit')],
        cls: 'supports',
        followUp: {
          q: t('What were you hurrying away from?', '¿De qué se estaban alejando?'),
          responses: [
            { id: 'q6a1', text: t('A masked actor by a rattling cupboard.', 'De un actor con máscara junto a un armario que se sacudía.'), asserts: [a('incident.who', 'masked-actor'), a('incident.place', 'cupboard')], cls: 'supports' },
            { id: 'q6a2', text: t('An actor with no mask, on a staircase.', 'De un actor sin máscara, en una escalera.'), asserts: [a('incident.who', 'unmasked-actor'), a('incident.place', 'staircase')], cls: 'conflicts' },
            { id: 'q6a3', text: t('Something scary behind us.', 'De algo que daba miedo detrás de nosotros.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q6b',
        text: t('We ran back to the entrance.', 'Regresamos corriendo a la entrada.'),
        asserts: [a('incident.after', 'back-to-entrance')],
        cls: 'conflicts',
        followUp: {
          q: t('Why go back to the entrance?', '¿Por qué regresar a la entrada?'),
          responses: [
            { id: 'q6b1', text: t('We wanted to start over.', 'Queríamos empezar de nuevo.'), asserts: none, cls: 'inconclusive', note: t('Adds nothing checkable, and keeps the back-to-the-entrance story going.', 'No agrega nada comprobable y sigue con la historia de regresar a la entrada.') },
            { id: 'q6b2', text: t('Sorry, I mean the exit. We hurried out.', 'Perdón, quise decir la salida. Salimos deprisa.'), asserts: [a('incident.after', 'exit')], cls: 'supports', revises: true },
            { id: 'q6b3', text: t('Everyone else went that way.', 'Todos los demás fueron por ahí.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q6c',
        text: t('We hurried away from the rattling cupboard.', 'Nos alejamos deprisa del armario que se sacudía.'),
        asserts: [a('incident.place', 'cupboard')],
        cls: 'supports',
        followUp: {
          q: t('Where did you go?', '¿A dónde fueron?'),
          responses: [
            { id: 'q6c1', text: t('Toward the exit.', 'Hacia la salida.'), asserts: [a('incident.after', 'exit')], cls: 'supports' },
            { id: 'q6c2', text: t('Back to the entrance.', 'De vuelta a la entrada.'), asserts: [a('incident.after', 'back-to-entrance')], cls: 'conflicts' },
            { id: 'q6c3', text: t('Wherever the group went.', 'A donde fuera el grupo.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q6d',
        text: t('We hurried away from the creaky staircase.', 'Nos alejamos deprisa de la escalera que crujía.'),
        asserts: [a('incident.place', 'staircase')],
        cls: 'conflicts',
        followUp: {
          q: t('Where did you go after that?', '¿A dónde fueron después?'),
          responses: [
            { id: 'q6d1', text: t('Back to the entrance.', 'De vuelta a la entrada.'), asserts: [a('incident.after', 'back-to-entrance')], cls: 'conflicts' },
            { id: 'q6d2', text: t('Toward the exit. And actually, it was a rattling cupboard, not stairs.', 'Hacia la salida. Y en realidad era un armario que se sacudía, no una escalera.'), asserts: [a('incident.after', 'exit'), a('incident.place', 'cupboard')], cls: 'supports', revises: true },
            { id: 'q6d3', text: t('Wherever the group went.', 'A donde fuera el grupo.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
      {
        id: 'q6e',
        text: t('I laughed. I get nervous.', 'Me reí. Me dan nervios.'),
        asserts: none,
        cls: 'inconclusive',
        note: t("Doesn't say where the group went, so there is nothing to check.", 'No dice a dónde fue el grupo, así que no hay nada que comprobar.'),
        followUp: {
          q: t('And what did your group do?', '¿Y qué hizo tu grupo?'),
          responses: [
            { id: 'q6e1', text: t('Hurried toward the exit.', 'Se apresuró hacia la salida.'), asserts: [a('incident.after', 'exit')], cls: 'supports' },
            { id: 'q6e2', text: t('Ran back to the entrance.', 'Regresó corriendo a la entrada.'), asserts: [a('incident.after', 'back-to-entrance')], cls: 'conflicts' },
            { id: 'q6e3', text: t('Laughed with me, I think.', 'Se rió conmigo, creo.'), asserts: none, cls: 'inconclusive' },
          ],
        },
      },
    ],
  },
];

// ---------------------------------------------------------------- final bluff challenges
/** One challenge per checkable detail. The engine only offers ones whose true value nobody stated. */
export const CHALLENGES: Challenge[] = [
  {
    slot: 'entrance.marker',
    q: t('What was at the entrance?', '¿Qué había en la entrada?'),
    options: [
      { value: 'red-curtain', text: t('A red curtain', 'Una cortina roja') },
      { value: 'blue-door', text: t('A blue door', 'Una puerta azul') },
      { value: 'glass-booth', text: t('A glass ticket booth', 'Una taquilla de vidrio') },
      { value: 'turnstile', text: t('A metal turnstile', 'Un torniquete de metal') },
    ],
  },
  {
    slot: 'tickets.who',
    q: t('Who collected the tickets?', '¿Quién recogía los boletos?'),
    options: [
      { value: 'guide', text: t('A guide', 'Un guía') },
      { value: 'machine', text: t('A ticket machine', 'Una máquina de boletos') },
      { value: 'guard', text: t('A security guard', 'Un guardia de seguridad') },
      { value: 'nobody', text: t('Nobody, entry was free', 'Nadie, la entrada era libre') },
    ],
  },
  {
    slot: 'entry.group',
    q: t('How did visitors go in?', '¿Cómo entraban los visitantes?'),
    options: [
      { value: 'small', text: t('In small groups', 'En grupos pequeños') },
      { value: 'alone', text: t('One at a time', 'De uno en uno') },
      { value: 'crowd', text: t('All at once, as a big crowd', 'Todos a la vez, en multitud') },
    ],
  },
  {
    slot: 'route.light',
    q: t('What were the corridors like?', '¿Cómo eran los pasillos?'),
    options: [
      { value: 'dark', text: t('Dark', 'Oscuros') },
      { value: 'bright', text: t('Brightly lit', 'Muy iluminados') },
      { value: 'colored', text: t('Full of flashing colored lights', 'Llenos de luces de colores') },
    ],
  },
  {
    slot: 'route.marker',
    q: t('What marked the route?', '¿Qué marcaba el camino?'),
    options: [
      { value: 'green-line', text: t('A green line on the floor', 'Una línea verde en el piso') },
      { value: 'blue-line', text: t('A blue line on the floor', 'Una línea azul en el piso') },
      { value: 'rope', text: t('A rope to hold on to', 'Una cuerda para sujetarse') },
      { value: 'candles', text: t('A row of candles', 'Una fila de velas') },
    ],
  },
  {
    slot: 'incident.who',
    q: t('Who appeared during the visit?', '¿Quién apareció durante la visita?'),
    options: [
      { value: 'masked-actor', text: t('A masked actor', 'Un actor con máscara') },
      { value: 'unmasked-actor', text: t('An actor with face paint and no mask', 'Un actor con la cara pintada y sin máscara') },
      { value: 'puppet', text: t('A giant puppet', 'Una marioneta gigante') },
      { value: 'magician', text: t('A magician', 'Un mago') },
    ],
  },
  {
    slot: 'incident.place',
    q: t('Where did they appear?', '¿Dónde apareció?'),
    options: [
      { value: 'cupboard', text: t('Beside a rattling cupboard', 'Junto a un armario que se sacudía') },
      { value: 'staircase', text: t('On a creaky staircase', 'En una escalera que crujía') },
      { value: 'coffin', text: t('Out of a coffin', 'De un ataúd') },
      { value: 'mirror', text: t('Behind a mirror', 'Detrás de un espejo') },
    ],
  },
  {
    slot: 'incident.after',
    q: t('What did the group do right after?', '¿Qué hizo el grupo justo después?'),
    options: [
      { value: 'exit', text: t('Hurried toward the exit', 'Se apresuró hacia la salida') },
      { value: 'back-to-entrance', text: t('Ran back to the entrance', 'Regresó corriendo a la entrada') },
      { value: 'clapped', text: t('Stopped and clapped', 'Se detuvo a aplaudir') },
      { value: 'sat', text: t('Sat down on the floor', 'Se sentó en el piso') },
    ],
  },
];

// ---------------------------------------------------------------- helpers

export const TRUTH: Record<string, string> = Object.fromEntries(FACTS.flatMap((f) => f.truth.map((x) => [x.slot, x.value])));

export function questionById(id: string): Question {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error('unknown question ' + id);
  return q;
}
export function claimById(id: string): { question: Question; claim: Claim } {
  for (const q of QUESTIONS) for (const c of q.claims) if (c.id === id) return { question: q, claim: c };
  throw new Error('unknown claim ' + id);
}
export function responseById(id: string): { question: Question; claim: Claim; response: Response } {
  for (const q of QUESTIONS) for (const c of q.claims) for (const r of c.followUp.responses) if (r.id === id) return { question: q, claim: c, response: r };
  throw new Error('unknown response ' + id);
}

/** Compare a line's asserted details with the case file (privileged: Detectives, reveal, tests). */
export function relateToFacts(asserts: Assert[]): { supports: string[]; conflicts: string[] } {
  const supports = new Set<string>();
  const conflicts = new Set<string>();
  for (const x of asserts) {
    for (const f of FACTS) {
      const tr = f.truth.find((y) => y.slot === x.slot);
      if (!tr) continue;
      if (tr.value === x.value) supports.add(f.id);
      else conflicts.add(f.id);
    }
  }
  for (const c of conflicts) supports.delete(c);
  return { supports: [...supports], conflicts: [...conflicts] };
}
export function classify(asserts: Assert[]): Cls {
  const r = relateToFacts(asserts);
  return r.conflicts.length ? 'conflicts' : r.supports.length ? 'supports' : 'inconclusive';
}
