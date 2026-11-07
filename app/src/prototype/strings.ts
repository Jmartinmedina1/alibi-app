/** UI text, bot-reason text and reveal explanations for the Case Logic Prototype (EN/ES). */
import { FACTS, TOPIC_LABEL, claimById, relateToFacts, responseById, type Lang, type T, type Topic } from './caseData';
import type { Judgment, Reason, Trait } from './knowledge';

export const tt = (x: T, lang: Lang) => x[lang];

const S = {
  title: { en: 'Case Logic Prototype', es: 'Prototipo de lógica del caso' },
  devOnly: { en: 'Development build only', es: 'Solo en la versión de desarrollo' },
  intro: {
    en: 'One complete Haunted House round with three bots. Testimony is checked against evidence, not reactions.',
    es: 'Una ronda completa de la Casa embrujada con tres bots. El testimonio se compara con la evidencia, no con reacciones.',
  },
  playDetective: { en: 'Play as Detective', es: 'Jugar como Detective' },
  playLiar: { en: 'Play as Liar', es: 'Jugar como Mentiroso' },
  qa: { en: 'QA scenarios', es: 'Escenarios de QA' },
  qaNote: { en: 'Fixed roles and seed, for repeatable checks.', es: 'Roles y semilla fijos, para pruebas repetibles.' },
  seed: { en: 'Seed', es: 'Semilla' },
  home: { en: '← Home', es: '← Inicio' },
  leaveQ: { en: 'Leave this round? Your progress will be lost.', es: '¿Salir de esta ronda? Se perderá el progreso.' },
  leave: { en: 'Leave', es: 'Salir' },
  stay: { en: 'Stay', es: 'Quedarme' },
  caseFile: { en: '📁 Case file', es: '📁 Expediente' },
  yourInfo: { en: '🎭 Your info', es: '🎭 Tu información' },
  testimony: { en: '🗂 Testimony', es: '🗂 Testimonio' },
  close: { en: 'Close', es: 'Cerrar' },
  continue: { en: 'Continue', es: 'Continuar' },
  confirm: { en: 'Confirm', es: 'Confirmar' },
  sending: { en: 'Sending…', es: 'Enviando…' },
  selected: { en: 'Selected', es: 'Elegida' },
  you: { en: 'You', es: 'Tú' },
  // briefing
  youAreDetective: { en: 'You are a DETECTIVE', es: 'Eres DETECTIVE' },
  youAreLiar: { en: 'You are the LIAR', es: 'Eres el MENTIROSO' },
  briefDet: {
    en: 'You were at the secret place. Your case file has three pieces of evidence. One player was not there. Ask questions, compare answers with your evidence, and vote for the Liar. Careful: every true detail you say out loud also teaches the Liar.',
    es: 'Estuviste en el lugar secreto. Tu expediente tiene tres evidencias. Un jugador no estuvo ahí. Haz preguntas, compara las respuestas con tu evidencia y vota por el Mentiroso. Cuidado: cada detalle cierto que digas también le enseña al Mentiroso.',
  },
  briefLiar: {
    en: "You weren't there. You only know the category. Listen to the testimony and keep your story believable. If you are caught, you get one last question about a detail nobody said.",
    es: 'No estuviste ahí. Solo conoces la categoría. Escucha el testimonio y mantén una historia creíble. Si te atrapan, tendrás una última pregunta sobre un detalle que nadie dijo.',
  },
  category: { en: 'Category', es: 'Categoría' },
  liarInfoNote: { en: 'You do not have the case file.', es: 'No tienes el expediente.' },
  roundPlan: {
    en: 'The round: 4 interrogations (everyone answers once), 1 extra question for you, a testimony review, a secret vote.',
    es: 'La ronda: 4 interrogatorios (cada uno responde una vez), 1 pregunta extra para ti, repaso del testimonio y voto secreto.',
  },
  scoringRules: {
    en: 'Scoring: each Detective who votes for the Liar gets 1 point. The Liar gets 2 points if not identified. A caught Liar who answers the final question correctly gets 1 point.',
    es: 'Puntos: cada Detective que vote por el Mentiroso gana 1 punto. El Mentiroso gana 2 si no lo identifican. Un Mentiroso atrapado que acierte la pregunta final gana 1 punto.',
  },
  tieRule: {
    en: 'Tie rule: if the most votes are tied, no single suspect is identified and the Liar escapes.',
    es: 'Regla de empate: si los más votados empatan, no se identifica a nadie y el Mentiroso escapa.',
  },
  start: { en: 'Start the round', es: 'Empezar la ronda' },
  // interrogation
  interrogation: { en: 'Interrogation', es: 'Interrogatorio' },
  extraTitle: { en: 'Your extra question', es: 'Tu pregunta extra' },
  pickQuestionFor: { en: 'Choose a question for {name}.', es: 'Elige una pregunta para {name}.' },
  botChoosing: { en: '{asker} is choosing a question for {name}…', es: '{asker} está eligiendo una pregunta para {name}…' },
  asks: { en: '{asker} asks {name}:', es: '{asker} le pregunta a {name}:' },
  asksYou: { en: '{asker} asks you:', es: '{asker} te pregunta:' },
  youAsk: { en: 'You ask {name}:', es: 'Tú le preguntas a {name}:' },
  pickAnswer: { en: 'Pick your answer. Everyone will hear it.', es: 'Elige tu respuesta. Todos la escucharán.' },
  thinking: { en: '{name} is answering…', es: '{name} está respondiendo…' },
  answered: { en: '{name} answered:', es: '{name} respondió:' },
  fuOffer: { en: 'Ask the follow-up, or move on?', es: '¿Haces la pregunta de seguimiento o sigues?' },
  askFollowUp: { en: 'Ask: “{q}”', es: 'Preguntar: “{q}”' },
  skip: { en: 'Move on without a follow-up', es: 'Seguir sin pregunta de seguimiento' },
  botFuDeciding: { en: '{asker} is deciding whether to follow up…', es: '{asker} está decidiendo si hace una pregunta de seguimiento…' },
  followUp: { en: 'Follow-up', es: 'Seguimiento' },
  noFollowUp: { en: 'No follow-up asked.', es: 'Sin pregunta de seguimiento.' },
  // judging
  judgeTitle: { en: 'Your judgment', es: 'Tu juicio' },
  judgePrompt: {
    en: "Judge {name}'s testimony. It's your opinion, not a verdict, and it stays hidden until everyone has chosen.",
    es: 'Juzga el testimonio de {name}. Es tu opinión, no un veredicto, y queda oculta hasta que todos elijan.',
  },
  judgeWaitYou: { en: 'The others are judging your testimony…', es: 'Los demás están juzgando tu testimonio…' },
  waitingFor: { en: 'Waiting for {n} more…', es: 'Esperando a {n} más…' },
  judgmentsIn: { en: 'Judgments', es: 'Juicios' },
  // extra
  extraPrompt: {
    en: 'Pick one person to question again. You can check the testimony first.',
    es: 'Elige a una persona para interrogarla otra vez. Puedes revisar el testimonio antes.',
  },
  newQuestion: { en: 'Ask a new question', es: 'Hacer una pregunta nueva' },
  followEarlier: { en: 'Follow up an earlier answer', es: 'Seguir una respuesta anterior' },
  earlierClaim: { en: 'They said: “{c}”', es: 'Dijo: “{c}”' },
  // review & vote
  reviewTitle: { en: 'Testimony review', es: 'Repaso del testimonio' },
  goVote: { en: 'Go to the secret vote', es: 'Ir al voto secreto' },
  voteTitle: { en: 'Secret vote', es: 'Voto secreto' },
  votePrompt: { en: 'Who is the Liar? Pick one player.', es: '¿Quién es el Mentiroso? Elige a un jugador.' },
  votePromptLiar: { en: 'Vote like a Detective would. Pick one player.', es: 'Vota como lo haría un Detective. Elige a un jugador.' },
  voteWait: { en: 'Waiting for the other votes…', es: 'Esperando los demás votos…' },
  votesTitle: { en: 'Votes', es: 'Votos' },
  votedFor: { en: '{a} → {b}', es: '{a} → {b}' },
  identified: { en: '{name} was identified.', es: 'Identificaron a {name}.' },
  identifiedYou: { en: 'You were identified.', es: 'Te identificaron a ti.' },
  caughtYesYou: { en: 'You were the Liar!', es: '¡Tú eras el Mentiroso!' },
  theLiarWasYou: { en: 'The Liar was you.', es: 'El Mentiroso eras tú.' },
  noSingle: { en: 'Tie: no single suspect identified. The Liar escapes.', es: 'Empate: no se identificó a nadie. El Mentiroso escapa.' },
  caughtYes: { en: '{name} was the Liar!', es: '¡{name} era el Mentiroso!' },
  caughtNo: { en: '{name} was not the Liar. The Liar escapes.', es: '{name} no era el Mentiroso. El Mentiroso escapa.' },
  // challenge
  challengeTitle: { en: 'Final bluff', es: 'Última jugada' },
  challengeLiar: {
    en: 'You were caught. One last question about a detail nobody said out loud. Get it right for 1 point.',
    es: 'Te atraparon. Una última pregunta sobre un detalle que nadie dijo. Acierta para ganar 1 punto.',
  },
  challengeWait: { en: '{name} is answering the final question…', es: '{name} está respondiendo la pregunta final…' },
  challengeOmitted: {
    en: 'No final question: every detail that could be asked was already said out loud during the round.',
    es: 'Sin pregunta final: todos los detalles que se podían preguntar ya se dijeron durante la ronda.',
  },
  // reveal
  revealTitle: { en: 'The reveal', es: 'La revelación' },
  theLiarWas: { en: 'The Liar was {name}.', es: 'El Mentiroso era {name}.' },
  theCase: { en: 'The secret place', es: 'El lugar secreto' },
  evidence: { en: 'Evidence', es: 'Evidencia' },
  scores: { en: 'Scores', es: 'Puntos' },
  noPoints: { en: 'no points', es: 'sin puntos' },
  challengeResult: { en: 'Final question: {q} {name} answered “{a}”. Correct answer: “{c}”.', es: 'Pregunta final: {q} {name} respondió “{a}”. Respuesta correcta: “{c}”.' },
  explainTitle: { en: 'What the testimony shows', es: 'Lo que muestra el testimonio' },
  explainNote: {
    en: 'A matching answer is not proof of innocence (the Liar can repeat what others said), and a vague answer is not proof of guilt.',
    es: 'Una respuesta que coincide no prueba inocencia (el Mentiroso puede repetir lo que otros dijeron), y una respuesta vaga no prueba culpa.',
  },
  allOptions: { en: 'Show every answer option', es: 'Ver todas las opciones' },
  hideOptions: { en: 'Hide answer options', es: 'Ocultar opciones' },
  botsTitle: { en: 'Why the bots did what they did', es: 'Por qué los bots hicieron lo que hicieron' },
  replay: { en: 'Play again', es: 'Jugar otra vez' },
  mainMenu: { en: 'Main menu', es: 'Menú principal' },
  founderQ: {
    en: 'What did you suspect, why, and which follow-up changed your mind?',
    es: '¿Qué sospechaste, por qué, y qué pregunta de seguimiento te hizo cambiar de opinión?',
  },
} satisfies Record<string, T>;

export type Key = keyof typeof S;
export function s(lang: Lang, key: Key, p: Record<string, string | number> = {}): string {
  return S[key][lang].replace(/\{(\w+)\}/g, (_, k) => String(p[k] ?? ''));
}

export const JUDGMENT_LABEL: Record<Judgment, T> = {
  fits: { en: '✅ Fits the case', es: '✅ Encaja con el caso' },
  conflict: { en: '⚠️ Something conflicts', es: '⚠️ Algo no cuadra' },
  unclear: { en: '❔ Not enough information', es: '❔ Falta información' },
};
export const TRAIT_LABEL: Record<Trait, T> = {
  cautious: { en: 'Cautious', es: 'Cauteloso' },
  steady: { en: 'Steady', es: 'Constante' },
  bold: { en: 'Bold', es: 'Atrevido' },
};
export const CLS_LABEL = {
  supports: { en: 'Matches the case file', es: 'Coincide con el expediente' },
  conflicts: { en: 'Conflicts with the case file', es: 'Contradice el expediente' },
  inconclusive: { en: "Can't be checked", es: 'No se puede comprobar' },
} satisfies Record<string, T>;

export const topicLabel = (tp: Topic | string, lang: Lang) => (TOPIC_LABEL as Record<string, T>)[tp]?.[lang].toLowerCase() ?? tp;

// ---------------------------------------------------------------- bot reasons (describe the rule actually used)

const R: Record<string, T> = {
  'ask.det.coverage': { en: 'Asked about the {topic}: the part of the visit asked about least so far{tied}.', es: 'Preguntó sobre {topic}: la parte de la visita por la que menos se había preguntado{tied}.' },
  'ask.liar.learn': { en: 'Asked about the {topic}: the part it had heard the fewest details about{tied}.', es: 'Preguntó sobre {topic}: la parte de la que menos detalles había escuchado{tied}.' },
  'det.true': { en: 'Gave a detail that matches its case file{unused}{random}.', es: 'Dio un detalle que coincide con su expediente{unused}{random}.' },
  'det.vague': { en: 'Gave a vague answer so the Liar would not learn a detail. {trait} bots do this {pct}% of the time (random draw).', es: 'Dio una respuesta vaga para que el Mentiroso no aprendiera un detalle. Los bots {trait} lo hacen el {pct}% de las veces (sorteo).' },
  'liar.safe': { en: 'Repeated {details} detail(s) other players had already stated, so it would sound right.', es: 'Repitió {details} detalle(s) que otros ya habían dicho, para sonar creíble.' },
  'liar.gamble': { en: 'Had not heard about this part yet and gambled on a specific detail. {trait} bots gamble {pct}% of the time (random draw).', es: 'Aún no había escuchado nada de esta parte y se arriesgó con un detalle concreto. Los bots {trait} se arriesgan el {pct}% de las veces (sorteo).' },
  'liar.vague': { en: 'Had not heard about this part yet, so it stayed vague instead of guessing.', es: 'Aún no había escuchado nada de esta parte, así que fue vago en vez de adivinar.' },
  'liar.noSafe': { en: 'Every option contradicted something said earlier; it picked one at random.', es: 'Todas las opciones contradecían algo dicho antes; eligió una al azar.' },
  'qa.det.greedy': { en: 'QA script: gave the true answer that revealed the most new details.', es: 'Script de QA: dio la respuesta verdadera que revelaba más detalles nuevos.' },
  'qa.liar.forcedConflict': { en: 'QA script: the test harness forced a conflicting answer here. The bot did not choose it.', es: 'Script de QA: el arnés de prueba forzó aquí una respuesta contradictoria. No la eligió el bot.' },
  'qa.det.alwaysFollow': { en: 'QA script: always asks the follow-up.', es: 'Script de QA: siempre hace la pregunta de seguimiento.' },
  'fu.det.conflict': { en: 'Asked the follow-up because the answer conflicted with its case file.', es: 'Hizo la pregunta de seguimiento porque la respuesta contradecía su expediente.' },
  'fu.det.vague': { en: 'Asked the follow-up because the answer had nothing it could check.', es: 'Hizo la pregunta de seguimiento porque la respuesta no tenía nada comprobable.' },
  'fu.det.skipFits': { en: 'Skipped the follow-up because the answer matched its case file.', es: 'No hizo pregunta de seguimiento porque la respuesta coincidía con su expediente.' },
  'fu.liar.more': { en: 'Asked the follow-up to hear more details (the answer stated {details}).', es: 'Hizo la pregunta de seguimiento para oír más detalles (la respuesta dio {details}).' },
  'fu.liar.enough': { en: 'Skipped the follow-up: the answer already stated {details} details.', es: 'No hizo pregunta de seguimiento: la respuesta ya daba {details} detalles.' },
  'judge.det.conflict': { en: 'Something conflicts: a detail contradicts its case file.', es: 'Algo no cuadra: un detalle contradice su expediente.' },
  'judge.det.revised': { en: 'Not enough information: the story changed toward the case file, which proves nothing either way.', es: 'Falta información: la historia cambió hacia el expediente, y eso no prueba nada.' },
  'judge.det.fits': { en: 'Fits the case: the details match its case file.', es: 'Encaja: los detalles coinciden con su expediente.' },
  'judge.det.nothing': { en: 'Not enough information: nothing it could check against the case file.', es: 'Falta información: nada que pudiera comparar con el expediente.' },
  'judge.liar.differs': { en: 'Something conflicts: a detail differed from what others had said.', es: 'Algo no cuadra: un detalle no coincidía con lo que otros dijeron.' },
  'judge.liar.matches': { en: 'Fits the case: the details matched what others had said.', es: 'Encaja: los detalles coincidían con lo que otros dijeron.' },
  'judge.liar.blend': { en: "Said “fits” to blend in: it couldn't check, but nothing heard so far contradicted the answer.", es: 'Dijo “encaja” para pasar desapercibido: no podía comprobarlo, pero nada de lo oído lo contradecía.' },
  'judge.liar.nothing': { en: 'Not enough information: the answer was vague.', es: 'Falta información: la respuesta era vaga.' },
  'vote.det': { en: 'Voted for the highest suspicion score ({score}). Its rule: a conflict with its case file +3, a changed story +2, a vague answer +1, a matching answer −1{tied}.', es: 'Votó por la puntuación de sospecha más alta ({score}). Su regla: contradicción con su expediente +3, cambio de historia +2, respuesta vaga +1, respuesta que coincide −1{tied}.' },
  'vote.liar': { en: "Voted for the player who drew the most doubt in others' judgments (score {score}; “conflicts” counts 2, “not enough information” 1){tied}.", es: 'Votó por quien más dudas generó en los juicios de los demás (puntuación {score}; “no cuadra” vale 2, “falta información” 1){tied}.' },
  'challenge.heard': { en: 'Picked the answer other players had stated.', es: 'Eligió la respuesta que otros habían dicho.' },
  'challenge.guess': { en: 'Had heard nothing about it, so it guessed at random among {n} options.', es: 'No había oído nada al respecto, así que adivinó al azar entre {n} opciones.' },
};

export function reasonText(r: Reason, lang: Lang): string {
  const p = r.p ?? {};
  const tied = (n: number) => (n ? (lang === 'es' ? ' (empate: elegido al azar)' : ' (tied: picked at random)') : '');
  const extra: Record<string, string> = {
    topic: topicLabel(String(p.topic ?? ''), lang),
    tied: r.code.startsWith('vote') ? tied(Number(p.tied ?? 0)) : tied(Number(p.tied ?? 0)),
    // EN: starts a sentence ("Steady bots do this…"); ES: follows "Los bots" ("Los bots constantes…")
    trait: p.trait ? (lang === 'es' ? TRAIT_LABEL[p.trait as Trait].es.toLowerCase() + 's' : TRAIT_LABEL[p.trait as Trait].en) : '',
    unused: p.unused ? (lang === 'es' ? ', una que nadie había dicho' : ', choosing one nobody had said yet') : '',
    random: Number(p.options ?? 0) > 1 ? (lang === 'es' ? ` (al azar entre ${p.options})` : ` (random pick among ${p.options})`) : '',
  };
  const tpl = R[r.code]?.[lang] ?? r.code;
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (k in extra ? extra[k] : String(p[k] ?? '')));
}

// ---------------------------------------------------------------- reveal explanations (privileged, after the round)

const q = (x: string) => (x ? `“${x}”` : '');

/** Why one line supports, conflicts or can't be checked — always tied to explicit case facts. */
export function explainLine(id: string, kind: 'claim' | 'response', lang: Lang): { cls: keyof typeof CLS_LABEL; lines: string[] } {
  const x = kind === 'claim' ? claimById(id).claim : responseById(id).response;
  const rel = relateToFacts(x.asserts);
  const factText = (fid: string) => FACTS.find((f) => f.id === fid)!.text[lang];
  const lines: string[] = [];
  for (const f of rel.conflicts) lines.push((lang === 'es' ? 'Contradice: ' : 'Conflicts with: ') + q(factText(f)));
  for (const f of rel.supports) {
    // a full match states every detail of the fact; otherwise it only fits part of it
    const full = FACTS.find((y) => y.id === f)!.truth.every((tr) => x.asserts.some((a) => a.slot === tr.slot && a.value === tr.value));
    lines.push((full ? (lang === 'es' ? 'Coincide con: ' : 'Matches: ') : lang === 'es' ? 'Encaja con parte de: ' : 'Fits part of: ') + q(factText(f)));
  }
  if (x.note) lines.push(x.note[lang]);
  if (kind === 'response' && (x as { revises?: boolean }).revises)
    lines.push(lang === 'es' ? 'Cambia su respuesta anterior hacia el expediente. Corregirse no prueba nada por sí solo.' : 'Changes the earlier answer toward the case file. A correction is not proof either way.');
  if (!rel.conflicts.length && !rel.supports.length && !x.note)
    lines.push(lang === 'es' ? 'No menciona nada del expediente, así que no se puede comprobar. Ser vago no prueba que alguien mienta.' : "Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying.");
  return { cls: x.cls, lines };
}
