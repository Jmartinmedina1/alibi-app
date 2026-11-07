/**
 * Case Logic Prototype — the Haunted House case.
 *
 * Two kinds of data live here, and the engine keeps them apart:
 *  - PUBLIC meaning of a line: its text and `asserts` (the concrete details the sentence claims,
 *    e.g. "a blue line on the floor" asserts route.marker = blue-line). Anyone who reads the
 *    sentence knows this, so the Liar may see it.
 *  - PRIVILEGED authoring metadata: the case facts (`truth`), the reviewed `kind`
 *    (compatible / contradiction / extra / vague), `cls`, `why`, `reconcile` and `note`. Only Detectives (through their evidence), the reveal and the
 *    tests may use it. The Liar's decision code never receives it.
 *
 * A claim CONFLICTS only when it asserts a different value for a detail the case file states.
 * Something the case file never mentions (a queue, music, a scream) is INCONCLUSIVE, not false.
 */

export type Lang = 'en' | 'es';
export type T = { en: string; es: string };
export type Topic = 'entrance' | 'route' | 'incident';
export type Cls = 'supports' | 'conflicts' | 'inconclusive';
export type Kind = 'compatible' | 'contradiction' | 'extra' | 'vague';
export type Assert = { slot: string; value: string };

export interface Fact {
  id: string;
  block: 'A' | 'B' | 'C';
  text: T;
  truth: Assert[];
}
export interface Response {
  id: string;
  /** manually reviewed relationship to the case (see the contradiction audit) */
  kind: Kind;
  text: T;
  asserts: Assert[];
  /** contradictions only: which evidence it contradicts and why no reasonable reading reconciles them */
  why?: T;
  reconcile?: T;
  /** authoring classification (validated against `asserts` + facts by the tests) */
  cls: Cls;
  /** a self-correction: asserts a different value than the speaker's own claim in this exchange */
  revises?: boolean;
  note?: T;
}
export interface Claim extends Response {
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
  { id: 'actor', block: 'C', text: t('The actor who appeared beside the rattling cupboard wore a mask.', 'El actor que apareció junto al armario que se sacudía llevaba máscara.'), truth: [a('incident.who', 'masked-actor')] },
  { id: 'cupboard', block: 'C', text: t('The masked actor appeared beside a rattling cupboard.', 'El actor con máscara apareció junto a un armario que se sacudía.'), truth: [a('incident.place', 'cupboard')] },
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

// Line kinds (manually reviewed — see docs/prototype/contradiction-audit.md):
//  compatible    states case details that agree with the evidence (compatibility is not proof of attendance)
//  contradiction cannot reasonably be true about the same visit; each has `why` and `reconcile`
//  extra         a concrete detail the evidence never mentions: can't be checked, not automatically false
//  vague         says nothing checkable, or dodges
//  (a follow-up that changes the speaker's own earlier statement also carries `revises: true`)
type LineOpts = { why?: T; reconcile?: T; note?: T; revises?: boolean };
const CLS_OF: Record<Kind, Cls> = { compatible: 'supports', contradiction: 'conflicts', extra: 'inconclusive', vague: 'inconclusive' };
function L(id: string, kind: Kind, en: string, es: string, asserts: Assert[], o: LineOpts = {}): Response {
  return { id, kind, cls: CLS_OF[kind], text: t(en, es), asserts, ...o };
}
function C(line: Response, q: T, responses: Response[]): Claim {
  return { ...line, followUp: { q, responses } };
}
const SMALL = a('entry.group', 'small');
const GUIDE = [a('tickets.collected', 'yes'), a('tickets.who', 'guide')];
const CURTAIN = a('entrance.marker', 'red-curtain');
const DARK = a('route.light', 'dark');
const LINE = a('route.marker', 'green-line');
const MASKED = a('incident.who', 'masked-actor');
const CUPBOARD = a('incident.place', 'cupboard');
const EXIT = a('incident.after', 'exit');

const W = {
  groups: t('The case file says visitors entered in small groups.', 'Según el expediente, los visitantes entraban en grupos pequeños.'),
  guide: t('The case file says a guide collected the tickets.', 'Según el expediente, un guía recogía los boletos.'),
  dark: t('The case file says the corridors were dark.', 'Según el expediente, los pasillos estaban oscuros.'),
  line: t('The case file says a green floor line marked the route.', 'Según el expediente, una línea verde en el piso marcaba el camino.'),
  walked: t('The case file says visitors walked through the corridors.', 'Según el expediente, los visitantes recorrían los pasillos caminando.'),
  masked: t('The case file says the actor who appeared beside the rattling cupboard wore a mask.', 'Según el expediente, el actor que apareció junto al armario que se sacudía llevaba máscara.'),
  cupboard: t('The case file says the masked actor appeared beside a rattling cupboard.', 'Según el expediente, el actor con máscara apareció junto a un armario que se sacudía.'),
  exit: t('The case file says the group hurried toward the exit.', 'Según el expediente, el grupo se apresuró hacia la salida.'),
};
const NOREC = {
  crowd: t('None: a whole crowd at once is not a small group.', 'Ninguna: toda una multitud a la vez no es un grupo pequeño.'),
  alone: t('None: entering with no group, one person at a time, is not entering in small groups.', 'Ninguna: entrar sin grupo, de uno en uno, no es entrar en grupos pequeños.'),
  noStaff: t('A machine could exist next to a guide, but "no staff" rules the guide out.', 'Podría haber una máquina junto al guía, pero "no había personal" descarta al guía.'),
  noTickets: t('None: if nobody collected tickets, the guide did not collect them.', 'Ninguna: si nadie recogía boletos, el guía no los recogía.'),
  lit: t('A dark corridor can have some dim light, but "bright" describes a well-lit route, not a dark one.', 'Un pasillo oscuro puede tener algo de luz tenue, pero "iluminado" describe un camino con buena luz, no uno oscuro.'),
  noLine: t('Someone could miss the line, but this says nothing marked the way, which the case denies.', 'Alguien podría no ver la línea, pero esto afirma que nada marcaba el camino, y el expediente lo contradice.'),
  seated: t('None: staying seated the whole time rules out walking the corridors.', 'Ninguna: quedarse sentado todo el tiempo descarta recorrer los pasillos.'),
  unmasked: t('Considered: two people appearing at the cupboard. But the answer says who appeared there, and "no mask" also rules out paint under a mask.', 'Considerado: dos personas apareciendo junto al armario. Pero la respuesta dice quién apareció ahí, y "sin máscara" también descarta pintura bajo una máscara.'),
  place: t('Considered: a coffin next to the cupboard. But this says no cupboard was near where the masked actor came from.', 'Considerado: un ataúd junto al armario. Pero esto dice que no había ningún armario cerca de donde salió el actor con máscara.'),
  back: t('None: running back to the entrance is the opposite direction at the same moment.', 'Ninguna: regresar corriendo a la entrada es la dirección opuesta en el mismo momento.'),
  stayed: t('None: stopping to watch is not hurrying away.', 'Ninguna: quedarse a mirar no es alejarse deprisa.'),
};
const OTHER = t('Other actors or moments are never ruled out, so an unmasked actor or a staircase can\'t be checked. Not automatically false.', 'El expediente no descarta otros actores ni otros momentos, así que un actor sin máscara o una escalera no se pueden comprobar. No es falso por eso.');
const CONTINUES = t('Can\'t be checked on its own; it only keeps the earlier conflicting story going.', 'No se puede comprobar por sí solo; solo sigue con la historia contradictoria anterior.');

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    topic: 'entrance',
    text: t('What happened before you went inside?', '¿Qué pasó antes de que entraras?'),
    claims: [
      C(L('q1a', 'compatible', 'A guide took our tickets.', 'Un guía nos recogió los boletos.', GUIDE), t('What did the guide do after taking your ticket?', '¿Qué hizo el guía después de recoger tu boleto?'), [
        L('q1a1', 'compatible', 'Held a red curtain open and let a few of us in.', 'Abrió una cortina roja y nos dejó pasar a unos pocos.', [CURTAIN, SMALL]),
        L('q1a2', 'contradiction', 'Waved a big crowd in all at once.', 'Hizo pasar a una multitud entera a la vez.', [a('entry.group', 'crowd')], { why: W.groups, reconcile: NOREC.crowd }),
        L('q1a3', 'vague', 'Said something, but I was looking at my phone.', 'Dijo algo, pero yo estaba mirando mi teléfono.', none),
      ]),
      C(L('q1b', 'contradiction', 'We scanned our own tickets at a machine. No staff anywhere.', 'Escaneamos nuestros boletos en una máquina. No había nadie del personal.', [a('tickets.who', 'machine')], { why: W.guide, reconcile: NOREC.noStaff }), t('So how did you know when to go in?', '¿Y cómo sabían cuándo entrar?'), [
        L('q1b1', 'extra', 'A light flashed and a gate opened.', 'Parpadeó una luz y se abrió una reja.', none, { note: CONTINUES }),
        L('q1b2', 'compatible', 'Actually, a guide took the tickets after the machine.', 'En realidad, después de la máquina un guía recogió los boletos.', GUIDE, { revises: true }),
        L('q1b3', 'vague', 'Everyone just walked, so I did too.', 'Todos caminaron, así que yo también.', none),
      ]),
      C(L('q1c', 'compatible', 'We waited at a red curtain until they let a few of us in.', 'Esperamos junto a una cortina roja hasta que dejaron pasar a unos pocos.', [CURTAIN, SMALL]), t('Who decided when your group could go in?', '¿Quién decidía cuándo podía entrar tu grupo?'), [
        L('q1c1', 'compatible', 'A guide, once they had our tickets.', 'Un guía, cuando ya tenía nuestros boletos.', GUIDE),
        L('q1c2', 'contradiction', 'Nobody. There was no staff, just a ticket machine.', 'Nadie. No había personal, solo una máquina de boletos.', [a('tickets.who', 'machine')], { why: W.guide, reconcile: NOREC.noStaff }),
        L('q1c3', 'vague', 'I guess it was timed.', 'Supongo que era por tiempo.', none),
      ]),
      C(L('q1d', 'contradiction', 'We waited by the doors, then the whole crowd went in together.', 'Esperamos junto a las puertas y luego entró toda la multitud junta.', [a('entry.group', 'crowd')], { why: W.groups, reconcile: NOREC.crowd }), t('How many people went in with you?', '¿Cuántas personas entraron contigo?'), [
        L('q1d1', 'contradiction', 'Fifty or so. The whole line.', 'Unas cincuenta. Toda la fila.', [a('entry.group', 'crowd')], { why: W.groups, reconcile: NOREC.crowd }),
        L('q1d2', 'compatible', 'Hmm, maybe five or six of us.', 'Mmm, tal vez cinco o seis.', [SMALL], { revises: true }),
        L('q1d3', 'vague', "I didn't count.", 'No los conté.', none),
      ]),
      C(L('q1e', 'extra', 'We stood in line for a while.', 'Hicimos fila un buen rato.', none, { note: t('A line is never mentioned in the case file. It can\'t be checked, and it isn\'t automatically false.', 'La fila no aparece en el expediente. No se puede comprobar y no es falsa por eso.') }), t('What was at the front of the line?', '¿Qué había al frente de la fila?'), [
        L('q1e1', 'compatible', 'A red curtain, and a guide taking tickets.', 'Una cortina roja y un guía recogiendo boletos.', [CURTAIN, ...GUIDE]),
        L('q1e2', 'contradiction', 'A machine where you scanned your own ticket. No staff.', 'Una máquina donde escaneabas tu boleto. Nadie del personal.', [a('tickets.who', 'machine')], { why: W.guide, reconcile: NOREC.noStaff }),
        L('q1e3', 'vague', "I couldn't see past the people ahead.", 'No veía más allá de la gente de adelante.', none),
      ]),
    ],
  },
  {
    id: 'q2',
    topic: 'entrance',
    text: t('Who let you in, and where?', '¿Quién te dejó entrar, y dónde?'),
    claims: [
      C(L('q2a', 'compatible', 'A guide, at a red curtain.', 'Un guía, junto a una cortina roja.', [a('entry.staff', 'guide'), CURTAIN], { note: t('The red curtain matches. That the guide also let them in is a reasonable fit, but the case file only says the guide collected tickets.', 'La cortina roja coincide. Que el guía también los dejara pasar encaja, pero el expediente solo dice que recogía los boletos.') }), t('Did you go in by yourself?', '¿Entraste sin compañía?'), [
        L('q2a1', 'compatible', 'No, with a small group.', 'No, con un grupo pequeño.', [SMALL]),
        L('q2a2', 'contradiction', 'Yes, one person at a time.', 'Sí, de uno en uno.', [a('entry.group', 'alone')], { why: W.groups, reconcile: NOREC.alone }),
        L('q2a3', 'vague', 'With whoever was standing near me.', 'Con quien estuviera cerca de mí.', none),
      ]),
      C(L('q2b', 'contradiction', 'A ticket machine let us in. Nobody was working there.', 'Una máquina de boletos nos dejó pasar. No había nadie trabajando.', [a('tickets.who', 'machine'), a('entry.staff', 'none')], { why: W.guide, reconcile: NOREC.noStaff }), t('Nobody at all?', '¿Nadie en absoluto?'), [
        L('q2b1', 'contradiction', 'Nobody. Just the machine and a turnstile.', 'Nadie. Solo la máquina y un torniquete.', [a('tickets.who', 'machine'), a('entry.staff', 'none')], { why: W.guide, reconcile: NOREC.noStaff }),
        L('q2b2', 'compatible', 'Well, a guide took our tickets first, at a red curtain.', 'Bueno, primero un guía recogió los boletos, junto a una cortina roja.', [...GUIDE, a('entry.staff', 'guide'), CURTAIN], { revises: true }),
        L('q2b3', 'vague', 'Maybe someone was around. It was busy.', 'Quizá había alguien. Había mucha gente.', none),
      ]),
      C(L('q2c', 'compatible', 'Someone sent us in a few at a time.', 'Alguien nos hacía pasar de a pocos.', [SMALL]), t('What did you hand to that person?', '¿Qué le entregaste a esa persona?'), [
        L('q2c1', 'compatible', 'My ticket.', 'Mi boleto.', [a('tickets.collected', 'yes')]),
        L('q2c2', 'contradiction', 'Nothing. Nobody took tickets.', 'Nada. Nadie recogía boletos.', [a('tickets.collected', 'no')], { why: W.guide, reconcile: NOREC.noTickets }),
        L('q2c3', 'vague', "I don't remember.", 'No me acuerdo.', none),
      ]),
      C(L('q2d', 'contradiction', 'Nobody. I went in by myself, with no group.', 'Nadie. Entré por mi cuenta, sin ningún grupo.', [a('entry.staff', 'none'), a('entry.group', 'alone')], { why: W.groups, reconcile: NOREC.alone }), t('Nobody checked your ticket?', '¿Nadie revisó tu boleto?'), [
        L('q2d1', 'contradiction', 'Nope. Nobody was collecting tickets.', 'No. Nadie recogía boletos.', [a('tickets.collected', 'no')], { why: W.guide, reconcile: NOREC.noTickets }),
        L('q2d2', 'compatible', 'Oh, a guide took it first, at the red curtain.', 'Ah, primero un guía lo recogió, junto a la cortina roja.', [...GUIDE, a('entry.staff', 'guide'), CURTAIN], {
          revises: true,
          note: t('Corrects "nobody", but the earlier "I went in by myself, with no group" still stands.', 'Corrige el "nadie", pero lo de "entré sin ningún grupo" sigue en pie.'),
        }),
        L('q2d3', 'vague', 'Maybe someone did. It was busy.', 'Quizá alguien lo revisó. Había mucha gente.', none),
      ]),
      C(L('q2e', 'vague', "A staff member. I didn't notice much else.", 'Alguien del personal. No me fijé en mucho más.', none, { note: t('Could fit the guide, but it is too vague to check.', 'Podría ser el guía, pero es demasiado vago para comprobarlo.') }), t('What was that staff member standing next to?', '¿Junto a qué estaba esa persona del personal?'), [
        L('q2e1', 'compatible', 'A red curtain.', 'Una cortina roja.', [CURTAIN]),
        L('q2e2', 'extra', 'A table full of rubber bats.', 'Una mesa llena de murciélagos de goma.', none, { note: t('A table of props is never mentioned. It can\'t be checked, and it isn\'t automatically false.', 'Una mesa con utilería no aparece en el expediente. No se puede comprobar y no es falsa por eso.') }),
        L('q2e3', 'vague', "I honestly didn't notice.", 'La verdad, no me fijé.', none),
      ]),
    ],
  },
  {
    id: 'q3',
    topic: 'route',
    text: t('How did you know where to go?', '¿Cómo sabías por dónde ir?'),
    claims: [
      C(L('q3a', 'compatible', 'I followed a green line on the floor.', 'Seguí una línea verde en el piso.', [LINE]), t('Could you see anything else?', '¿Podías ver algo más?'), [
        L('q3a1', 'compatible', 'Not really. The corridors were dark.', 'No mucho. Los pasillos estaban oscuros.', [DARK]),
        L('q3a2', 'contradiction', 'Sure. It was bright the whole time.', 'Claro. Estuvo bien iluminado todo el tiempo.', [a('route.light', 'bright')], { why: W.dark, reconcile: NOREC.lit }),
        L('q3a3', 'vague', "Mostly the backs of people's heads.", 'Sobre todo la nuca de la gente.', none),
      ]),
      C(L('q3b', 'contradiction', 'Nothing marked the way. We just guessed.', 'Nada marcaba el camino. Solo adivinamos.', [a('route.marker', 'none')], { why: W.line, reconcile: NOREC.noLine }), t("So how didn't you get lost?", '¿Y cómo no se perdieron?'), [
        L('q3b1', 'extra', 'We did get lost, twice.', 'Sí nos perdimos, dos veces.', none, { note: CONTINUES }),
        L('q3b2', 'compatible', 'Actually, there was a line on the floor. Green, I think.', 'En realidad, había una línea en el piso. Verde, creo.', [LINE], { revises: true }),
        L('q3b3', 'vague', 'I just followed the others.', 'Solo seguí a los demás.', none),
      ]),
      C(L('q3c', 'compatible', 'I stayed close to my group in the dark.', 'Me quedé cerca de mi grupo en la oscuridad.', [DARK]), t('How many people were in your group?', '¿Cuántas personas había en tu grupo?'), [
        L('q3c1', 'compatible', 'Five or six.', 'Cinco o seis.', [SMALL]),
        L('q3c2', 'contradiction', 'Around forty. The whole crowd.', 'Unas cuarenta. Toda la multitud.', [a('entry.group', 'crowd')], { why: W.groups, reconcile: NOREC.crowd }),
        L('q3c3', 'vague', 'Enough to keep bumping into each other.', 'Suficientes para chocar todo el rato.', none),
      ]),
      C(
        L('q3d', 'extra', 'Glowing signs pointed the way.', 'Unos letreros luminosos marcaban el camino.', none, {
          note: t(
            'Glowing signs can exist in dark corridors, and the case file never mentions signs. It can\'t be checked either way, so it is not a contradiction.',
            'Puede haber letreros luminosos en pasillos oscuros, y el expediente no menciona letreros. No se puede comprobar, así que no es una contradicción.',
          ),
        }),
        t('What did the signs say?', '¿Qué decían los letreros?'),
        [
          L('q3d1', 'extra', 'Arrows and the word EXIT.', 'Flechas y la palabra SALIDA.', none, { note: t('Another detail the case file never mentions. Can\'t be checked.', 'Otro detalle que no aparece en el expediente. No se puede comprobar.') }),
          L('q3d2', 'compatible', 'I mostly followed the green line on the floor, honestly.', 'La verdad, seguí sobre todo la línea verde del piso.', [LINE]),
          L('q3d3', 'contradiction', 'Who needed signs? The hallway was brightly lit.', '¿Para qué letreros? El pasillo estaba muy iluminado.', [a('route.light', 'bright')], { why: W.dark, reconcile: NOREC.lit }),
        ],
      ),
      C(L('q3e', 'vague', 'I kept watching the floor.', 'Iba mirando el piso.', none, { note: t('Hints at something on the floor, but names nothing checkable.', 'Insinúa algo en el piso, pero no nombra nada comprobable.') }), t('What were you looking for?', '¿Qué buscabas?'), [
        L('q3e1', 'compatible', 'The green line that marked the way.', 'La línea verde que marcaba el camino.', [LINE]),
        L('q3e2', 'contradiction', "Something to follow. There wasn't anything.", 'Algo que seguir. No había nada.', [a('route.marker', 'none')], { why: W.line, reconcile: NOREC.noLine }),
        L('q3e3', 'vague', 'Anything I might trip over.', 'Cualquier cosa con la que pudiera tropezar.', none),
      ]),
    ],
  },
  {
    id: 'q4',
    topic: 'route',
    text: t('What was it like walking through?', '¿Cómo era el recorrido por dentro?'),
    claims: [
      C(L('q4a', 'compatible', 'Dark corridors. I could barely see my hands.', 'Pasillos oscuros. Apenas me veía las manos.', [a('route.mode', 'walked'), DARK]), t('Then how did you find the way?', '¿Y cómo encontraste el camino?'), [
        L('q4a1', 'compatible', 'A green line on the floor.', 'Una línea verde en el piso.', [LINE]),
        L('q4a2', 'contradiction', 'There was nothing to follow, so I felt along the walls.', 'No había nada que seguir, así que fui tocando las paredes.', [a('route.marker', 'none')], { why: W.line, reconcile: NOREC.noLine }),
        L('q4a3', 'extra', 'I kept one hand on the wall.', 'Iba con una mano en la pared.', none, { note: t('Never mentioned, and fits a dark corridor. Can\'t be checked.', 'No aparece en el expediente y encaja con un pasillo oscuro. No se puede comprobar.') }),
      ]),
      C(L('q4b', 'contradiction', 'Bright and open, like a school hallway.', 'Iluminado y amplio, como el pasillo de una escuela.', [a('route.light', 'bright')], { why: W.dark, reconcile: NOREC.lit }), t('Where was the light coming from?', '¿De dónde venía la luz?'), [
        L('q4b1', 'extra', 'Big lights on the ceiling.', 'De unas lámparas grandes en el techo.', none, { note: CONTINUES }),
        L('q4b2', 'compatible', 'Well... it was mostly dark. Just a faint glow.', 'Bueno… estaba casi todo oscuro. Solo un brillo tenue.', [DARK], { revises: true }),
        L('q4b3', 'vague', 'Somewhere up ahead.', 'De algún lugar más adelante.', none),
      ]),
      C(L('q4c', 'compatible', 'Narrow corridors. We walked one behind another.', 'Pasillos angostos. Caminábamos uno detrás de otro.', [a('route.mode', 'walked')]), t('Who was at the front?', '¿Quién iba al frente?'), [
        L('q4c1', 'compatible', 'Me, following a green line on the floor.', 'Yo, siguiendo una línea verde en el piso.', [LINE]),
        L('q4c2', 'contradiction', 'Me. Nothing marked the way, so I guessed.', 'Yo. Nada marcaba el camino, así que adiviné.', [a('route.marker', 'none')], { why: W.line, reconcile: NOREC.noLine }),
        L('q4c3', 'extra', 'A tall guy. I stayed in the middle.', 'Un señor alto. Yo iba en medio.', none, { note: t('Who walked first is never mentioned. Can\'t be checked.', 'Quién iba primero no aparece en el expediente. No se puede comprobar.') }),
      ]),
      C(L('q4d', 'contradiction', 'We stayed in our seats the whole time.', 'Nos quedamos en nuestros asientos todo el tiempo.', [a('route.mode', 'seated')], { why: W.walked, reconcile: NOREC.seated }), t('What were you watching?', '¿Qué estaban mirando?'), [
        L('q4d1', 'extra', 'Actors on a stage.', 'Actores en un escenario.', none, { note: CONTINUES }),
        L('q4d2', 'compatible', 'Sorry, I mixed it up. We walked through dark corridors.', 'Perdón, me confundí. Recorrimos pasillos oscuros.', [a('route.mode', 'walked'), DARK], { revises: true }),
        L('q4d3', 'vague', 'Whatever was in front of us.', 'Lo que hubiera enfrente.', none),
      ]),
      C(L('q4e', 'extra', 'Creepy music played the whole time.', 'Hubo música tétrica todo el tiempo.', none, { note: t('Music is never mentioned in the case file. It can\'t be checked, and it isn\'t automatically false.', 'La música no aparece en el expediente. No se puede comprobar y no es falsa por eso.') }), t('Did the music ever change?', '¿La música cambió en algún momento?'), [
        L('q4e1', 'compatible', 'It got loud when a cupboard started rattling.', 'Subió de volumen cuando un armario empezó a sacudirse.', [CUPBOARD]),
        L('q4e2', 'extra', 'It got loud when the scare happened: an actor with no mask.', 'Subió de volumen con el susto: un actor sin máscara.', none, { note: OTHER }),
        L('q4e3', 'vague', 'Not that I noticed.', 'No que yo notara.', none),
      ]),
    ],
  },
  {
    id: 'q5',
    topic: 'incident',
    text: t('What made everyone move suddenly?', '¿Qué hizo que todos se movieran de repente?'),
    claims: [
      C(L('q5a', 'compatible', 'A masked actor jumped out.', 'Salió de golpe un actor con máscara.', [MASKED]), t('Where did the actor come from?', '¿De dónde salió el actor?'), [
        L('q5a1', 'compatible', 'From beside a rattling cupboard.', 'De al lado de un armario que se sacudía.', [CUPBOARD]),
        L('q5a2', 'contradiction', 'Out of a coffin. There was no cupboard near it.', 'De un ataúd. No había ningún armario cerca.', [a('incident.place', 'coffin')], { why: W.cupboard, reconcile: NOREC.place }),
        L('q5a3', 'vague', 'Somewhere on my left.', 'De algún lado a mi izquierda.', none),
      ]),
      C(L('q5b', 'extra', 'An actor with no mask, just face paint.', 'Un actor sin máscara, solo con la cara pintada.', none, { note: OTHER }), t('What did the face paint look like?', '¿Cómo era la pintura de la cara?'), [
        L('q5b1', 'extra', 'White, with big black eyes.', 'Blanca, con ojos negros enormes.', none, { note: OTHER }),
        L('q5b2', 'compatible', 'Hmm, maybe it was a mask, not paint.', 'Mmm, tal vez era una máscara, no pintura.', [MASKED], { revises: true }),
        L('q5b3', 'vague', 'Scary. I looked away.', 'Daba miedo. Aparté la mirada.', none),
      ]),
      C(L('q5c', 'compatible', 'A cupboard started rattling, and someone appeared beside it.', 'Un armario empezó a sacudirse y alguien apareció a su lado.', [CUPBOARD]), t('Who appeared?', '¿Quién apareció?'), [
        L('q5c1', 'compatible', 'An actor in a mask.', 'Un actor con máscara.', [MASKED]),
        L('q5c2', 'contradiction', 'An actor with no mask.', 'Un actor sin máscara.', [a('incident.who', 'unmasked-actor')], { why: W.masked, reconcile: NOREC.unmasked }),
        L('q5c3', 'vague', "I didn't get a good look.", 'No alcancé a verlo bien.', none),
      ]),
      C(L('q5d', 'extra', 'Someone jumped down a creaky staircase.', 'Alguien bajó de un salto por una escalera que crujía.', none, { note: OTHER }), t('Who was on the staircase?', '¿Quién estaba en la escalera?'), [
        L('q5d1', 'extra', 'An actor with no mask.', 'Un actor sin máscara.', none, { note: OTHER }),
        L('q5d2', 'compatible', 'Wait, it was a masked actor beside a rattling cupboard. Not a staircase.', 'Espera, era un actor con máscara junto a un armario que se sacudía. No una escalera.', [MASKED, CUPBOARD], { revises: true }),
        L('q5d3', 'vague', "I didn't get a good look.", 'No alcancé a verlo bien.', none),
      ]),
      C(L('q5e', 'extra', 'Someone behind me screamed.', 'Alguien detrás de mí gritó.', none, { note: t('Fits a scare, but screams are never mentioned. Can\'t be checked.', 'Encaja con un susto, pero los gritos no aparecen en el expediente. No se puede comprobar.') }), t('What made them scream?', '¿Por qué gritó?'), [
        L('q5e1', 'compatible', 'A masked actor, right by a rattling cupboard.', 'Un actor con máscara, justo al lado de un armario que se sacudía.', [MASKED, CUPBOARD]),
        L('q5e2', 'extra', 'An actor with no mask, on a staircase.', 'Un actor sin máscara, en una escalera.', none, { note: OTHER }),
        L('q5e3', 'vague', "I didn't turn around to look.", 'No me volteé a ver.', none),
      ]),
    ],
  },
  {
    id: 'q6',
    topic: 'incident',
    text: t('After everyone moved suddenly, where did your group go?', 'Cuando todos se movieron de repente, ¿a dónde fue tu grupo?'),
    claims: [
      C(L('q6a', 'compatible', 'We hurried toward the exit.', 'Nos apresuramos hacia la salida.', [EXIT]), t('What were you hurrying away from?', '¿De qué se estaban alejando?'), [
        L('q6a1', 'compatible', 'A masked actor by a rattling cupboard.', 'De un actor con máscara junto a un armario que se sacudía.', [MASKED, CUPBOARD]),
        L('q6a2', 'extra', 'An actor with no mask, on a staircase.', 'De un actor sin máscara, en una escalera.', none, { note: OTHER }),
        L('q6a3', 'vague', 'Something scary behind us.', 'De algo que daba miedo detrás de nosotros.', none),
      ]),
      C(L('q6b', 'contradiction', 'We ran back to the entrance.', 'Regresamos corriendo a la entrada.', [a('incident.after', 'back-to-entrance')], { why: W.exit, reconcile: NOREC.back }), t('Why go back to the entrance?', '¿Por qué regresar a la entrada?'), [
        L('q6b1', 'extra', 'We wanted to start over.', 'Queríamos empezar de nuevo.', none, { note: CONTINUES }),
        L('q6b2', 'compatible', 'Sorry, I mean the exit. We hurried out.', 'Perdón, quise decir la salida. Salimos deprisa.', [EXIT], { revises: true }),
        L('q6b3', 'vague', 'Everyone else went that way.', 'Todos los demás fueron por ahí.', none),
      ]),
      C(L('q6c', 'compatible', 'We hurried away from the rattling cupboard.', 'Nos alejamos deprisa del armario que se sacudía.', [CUPBOARD]), t('Where did you go?', '¿A dónde fueron?'), [
        L('q6c1', 'compatible', 'Toward the exit.', 'Hacia la salida.', [EXIT]),
        L('q6c2', 'contradiction', 'Back to the entrance.', 'De vuelta a la entrada.', [a('incident.after', 'back-to-entrance')], { why: W.exit, reconcile: NOREC.back }),
        L('q6c3', 'vague', 'Wherever the group went.', 'A donde fuera el grupo.', none),
      ]),
      C(L('q6d', 'contradiction', 'We stopped and stayed to watch the actor.', 'Nos detuvimos y nos quedamos a mirar al actor.', [a('incident.after', 'stayed')], { why: W.exit, reconcile: NOREC.stayed }), t('How long did you stay?', '¿Cuánto tiempo se quedaron?'), [
        L('q6d1', 'extra', 'Until the actor took a bow.', 'Hasta que el actor hizo una reverencia.', none, { note: CONTINUES }),
        L('q6d2', 'compatible', 'Just a second. Then we hurried to the exit.', 'Solo un segundo. Luego nos apresuramos a la salida.', [EXIT], { revises: true }),
        L('q6d3', 'vague', 'I lost track of time.', 'Perdí la noción del tiempo.', none),
      ]),
      C(L('q6e', 'vague', 'I laughed. I get nervous.', 'Me reí. Me dan nervios.', none, { note: t("Doesn't say where the group went, so there is nothing to check.", 'No dice a dónde fue el grupo, así que no hay nada que comprobar.') }), t('And what did your group do?', '¿Y qué hizo tu grupo?'), [
        L('q6e1', 'compatible', 'Hurried toward the exit.', 'Se apresuró hacia la salida.', [EXIT]),
        L('q6e2', 'contradiction', 'Ran back to the entrance.', 'Regresó corriendo a la entrada.', [a('incident.after', 'back-to-entrance')], { why: W.exit, reconcile: NOREC.back }),
        L('q6e3', 'vague', 'Laughed with me, I think.', 'Se rió conmigo, creo.', none),
      ]),
    ],
  },
];

// ---------------------------------------------------------------- final bluff challenges
/** One challenge per checkable detail. The engine only offers ones whose true value nobody stated. */
export const CHALLENGES: Challenge[] = [
  {
    slot: 'entrance.marker',
    q: t('What was at the entrance where tickets were collected?', '¿Qué había en la entrada donde se recogían los boletos?'),
    options: [
      { value: 'red-curtain', text: t('A red curtain', 'Una cortina roja') },
      { value: 'glass-booth', text: t('A glass ticket booth', 'Una taquilla de vidrio') },
      { value: 'turnstile', text: t('A metal turnstile', 'Un torniquete de metal') },
      { value: 'gate', text: t('A wooden gate', 'Una reja de madera') },
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
      { value: 'green-line', text: t('A line on the floor', 'Una línea en el piso') },
      { value: 'signs', text: t('Glowing signs on the walls', 'Letreros luminosos en las paredes') },
      { value: 'rope', text: t('A rope to hold on to', 'Una cuerda para sujetarse') },
      { value: 'none', text: t('Nothing; visitors found their own way', 'Nada; cada quien encontraba el camino') },
    ],
  },
  {
    slot: 'incident.who',
    q: t('Who appeared beside the rattling cupboard?', '¿Quién apareció junto al armario que se sacudía?'),
    options: [
      { value: 'masked-actor', text: t('A masked actor', 'Un actor con máscara') },
      { value: 'unmasked-actor', text: t('An actor with face paint and no mask', 'Un actor con la cara pintada y sin máscara') },
      { value: 'puppet', text: t('A giant puppet', 'Una marioneta gigante') },
      { value: 'magician', text: t('A magician', 'Un mago') },
    ],
  },
  {
    slot: 'incident.place',
    q: t('Where did the masked actor appear?', '¿Dónde apareció el actor con máscara?'),
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
      { value: 'stayed', text: t('Stopped and stayed to watch', 'Se detuvo a mirar') },
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
