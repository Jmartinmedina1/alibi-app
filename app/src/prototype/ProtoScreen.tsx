/**
 * Case Logic Prototype screen. Bots act on relaxed timers; the human acts through `apply()`.
 * Everything the human sees during play comes from `viewFor()` (role-filtered). Only the reveal
 * reads privileged data, after the round is over.
 */
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Face } from '../components/ui';
import { useLang } from '../lib/lang';
import { loadProfile } from '../lib/profile';
import { C, COL, F, INSPECTOR } from '../lib/theme';
import { CHALLENGES, EVIDENCE_BLOCKS, LOCATION, QUESTIONS, TOPIC_LABEL, TRUTH, claimById, responseById, type Lang, type Topic } from './caseData';
import {
  apply,
  botAct,
  canExtraFollowUp,
  newGame,
  pending,
  player,
  result,
  viewFor,
  type Action,
  type HumanAction,
  type ScenarioId,
  type State,
} from './engine';
import { QA_ENABLED } from './flags';
import type { Judgment, PublicExchange, PublicLine } from './knowledge';
import { CLS_LABEL, JUDGMENT_LABEL, TRAIT_LABEL, explainLine, reasonText, s as str, tt, type Key } from './strings';

const BOT_DELAY: Partial<Record<State['phase'], number>> = { ask: 1500, answer: 1900, fuDecide: 1200, fuAnswer: 1700, judge: 700, vote: 700, challenge: 1600 };

export function ProtoScreen() {
  const { lang, setLang } = useLang();
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const [game, setGame] = useState<State | null>(null);
  const [seed, setSeed] = useState(() => String(Date.now() % 100000));
  const [me, setMe] = useState<{ name: string; emoji?: string }>({ name: '' });
  const [panel, setPanel] = useState<'none' | 'case' | 'testimony' | 'leave'>('none');

  useEffect(() => {
    loadProfile().then((p) => p && setMe({ name: p.name, emoji: p.emoji }));
  }, []);

  // Bots: one action at a time, on a relaxed timer, decided from their own role knowledge.
  useEffect(() => {
    if (!game) return;
    const bot = pending(game).find((id) => player(game, id).kind === 'bot');
    if (!bot) return;
    const t = setTimeout(() => setGame((g) => (g ? botAct(g, bot) : g)), BOT_DELAY[game.phase] ?? 900);
    return () => clearTimeout(t);
  }, [game]);

  const start = (scenario: ScenarioId, sd = seed) => {
    setPanel('none');
    setGame(newGame({ scenario, seed: sd, humanName: me.name || (lang === 'es' ? 'Tú' : 'You'), humanEmoji: me.emoji }));
  };
  const act = (a: HumanAction) => setGame((g) => (g ? apply(g, { ...a, pid: g.humanId } as Action) : g));

  if (!game) {
    return (
      <ScrollView contentContainerStyle={st.page} testID="proto-start">
        <TopBar lang={lang} onHome={() => router.replace('/')} onLang={() => setLang(lang === 'en' ? 'es' : 'en')} />
        <Text style={st.h1}>{L('title')}</Text>
        <Text style={st.tag}>{L('devOnly')}</Text>
        <Text style={st.body}>{L('intro')}</Text>
        <Big testID="start-detective" label={'🕵️ ' + L('playDetective')} onPress={() => start('detective')} />
        <Big testID="start-liar" kind="secondary" label={'🎭 ' + L('playLiar')} onPress={() => start('liar')} />
        {QA_ENABLED && (
          <View style={st.card}>
            <Text style={st.h3}>{L('qa')}</Text>
            <Text style={st.small}>{L('qaNote')}</Text>
            <View style={st.row}>
              <Text style={st.small}>{L('seed')}</Text>
              <TextInput testID="qa-seed" value={seed} onChangeText={setSeed} style={st.input} autoCapitalize="none" />
            </View>
            {(['qa-contradiction', 'qa-bluff', 'qa-all-disclosed'] as const).map((id) => (
              <Big key={id} testID={'start-' + id} kind="ghost" label={QA_LABEL[id][lang]} onPress={() => start(id)} />
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  const v = viewFor(game, game.humanId);
  const name = (id: string) => (id === game.humanId ? L('you') : player(game, id).name);
  const nTestimony = v.testimony.length;

  return (
    <View style={{ flex: 1 }}>
      <TopBar lang={lang} onHome={() => setPanel('leave')} onLang={() => setLang(lang === 'en' ? 'es' : 'en')}>
        <Chip testID="open-case" label={v.role === 'detective' ? L('caseFile') : L('yourInfo')} onPress={() => setPanel('case')} />
        <Chip testID="open-testimony" label={`${L('testimony')} (${nTestimony})`} onPress={() => setPanel('testimony')} />
      </TopBar>
      <ScrollView contentContainerStyle={st.page} testID={'phase-' + v.phase}>
        <Roster game={game} lang={lang} />
        <PhaseBody game={game} lang={lang} act={act} name={name} openTestimony={() => setPanel('testimony')} onReplay={() => start(game.scenario, game.scenario.startsWith('qa') ? game.seed : String(Date.now() % 100000))} />
      </ScrollView>

      {panel !== 'none' && (
        <View style={st.overlay}>
          <ScrollView contentContainerStyle={[st.page, { paddingTop: 24 }]}>
            {panel === 'leave' && (
              <View style={st.card} testID="leave-confirm">
                <Text style={st.h3}>{L('leaveQ')}</Text>
                <Big testID="leave-yes" kind="danger" label={L('leave')} onPress={() => { setPanel('none'); setGame(null); }} />
                <Big testID="leave-no" kind="ghost" label={L('stay')} onPress={() => setPanel('none')} />
              </View>
            )}
            {panel === 'case' && (
              <View style={st.card} testID="case-panel">
                {v.role === 'detective' ? (
                  <>
                    <Text style={st.h3}>{L('caseFile')}</Text>
                    <EvidenceList lang={lang} />
                  </>
                ) : (
                  <>
                    <Text style={st.h3}>{L('yourInfo')}</Text>
                    <Text style={st.body}>
                      {L('category')}: <Text style={{ fontWeight: '800' }}>{v.category ? tt(v.category, lang) : ''}</Text>
                    </Text>
                    <Text style={st.small}>{L('liarInfoNote')}</Text>
                  </>
                )}
                <Big kind="ghost" label={L('close')} onPress={() => setPanel('none')} testID="close-panel" />
              </View>
            )}
            {panel === 'testimony' && (
              <View style={{ gap: 10 }} testID="testimony-panel">
                <Text style={st.h2}>{L('testimony')}</Text>
                {v.testimony.length === 0 && <Text style={st.small}>—</Text>}
                {v.testimony.map((e) => (
                  <ExchangeCard key={e.n} e={e} game={game} lang={lang} name={name} showJudgments />
                ))}
                <Big kind="ghost" label={L('close')} onPress={() => setPanel('none')} testID="close-panel" />
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const QA_LABEL: Record<string, { en: string; es: string }> = {
  'qa-contradiction': { en: 'QA: contradiction → follow-up (Detective)', es: 'QA: contradicción → seguimiento (Detective)' },
  'qa-bluff': { en: 'QA: believable Liar bluff (Detective)', es: 'QA: farol creíble del Mentiroso (Detective)' },
  'qa-all-disclosed': { en: 'QA: all details disclosed (Liar)', es: 'QA: todo revelado (Mentiroso)' },
};

// ---------------------------------------------------------------- phases

function PhaseBody(props: { game: State; lang: Lang; act: (a: HumanAction) => void; name: (id: string) => string; openTestimony: () => void; onReplay: () => void }) {
  const { game, lang, act, name } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const v = viewFor(game, game.humanId);
  const cur = v.current;
  const meId = game.humanId;
  const isMe = (id?: string) => id === meId;

  switch (v.phase) {
    case 'briefing':
      return (
        <View style={{ gap: 12 }} testID="briefing">
          <Text style={[st.h1, { color: v.role === 'liar' ? C.red : C.amber }]}>{v.role === 'liar' ? L('youAreLiar') : L('youAreDetective')}</Text>
          <Text style={st.body}>{v.role === 'liar' ? L('briefLiar') : L('briefDet')}</Text>
          {v.role === 'detective' ? (
            <View style={st.card}>
              <Text style={st.h3}>{L('caseFile')}</Text>
              <EvidenceList lang={lang} />
            </View>
          ) : (
            <View style={st.card}>
              <Text style={st.body}>
                {L('category')}: <Text style={{ fontWeight: '800' }}>{v.category ? tt(v.category, lang) : ''}</Text>
              </Text>
              <Text style={st.small}>{L('liarInfoNote')}</Text>
            </View>
          )}
          <Text style={st.small}>{L('roundPlan')}</Text>
          <Text style={st.small}>{L('scoringRules')}</Text>
          <Text style={st.small}>{L('tieRule')}</Text>
          <Big testID="begin" label={L('start')} onPress={() => act({ type: 'start' })} />
        </View>
      );

    case 'ask':
      return (
        <View style={{ gap: 12 }}>
          <Heading game={game} lang={lang} />
          {isMe(cur?.askerId) ? (
            <>
              <Narrator text={L('pickQuestionFor', { name: name(cur!.respondentId) })} />
              <QuestionPicker lang={lang} onPick={(id) => act({ type: 'ask', questionId: id })} />
            </>
          ) : (
            <Narrator text={L('botChoosing', { asker: name(cur!.askerId), name: name(cur!.respondentId) })} />
          )}
        </View>
      );

    case 'answer':
    case 'fuDecide':
    case 'fuAnswer':
    case 'judge':
    case 'judged': {
      const e = cur!;
      return (
        <View style={{ gap: 12 }}>
          <Heading game={game} lang={lang} />
          <ExchangeCard e={e} game={game} lang={lang} name={name} contextClaim={e.contextClaim} pendingFollowUp={v.phase === 'fuAnswer' ? v.followUpQ : null} showJudgments={v.phase === 'judged'} />
          {v.phase === 'answer' && (isMe(e.respondentId) ? <Choose key={'answer-' + e.n} lang={lang} prompt={L('pickAnswer')} options={v.options!} onConfirm={(id) => act({ type: 'answer', claimId: id })} testID="answer" /> : <Narrator text={L('thinking', { name: name(e.respondentId) })} />)}
          {v.phase === 'fuDecide' &&
            (isMe(e.askerId) ? (
              <View style={{ gap: 8 }}>
                <Text style={st.body}>{L('fuOffer')}</Text>
                <Big testID="fu-ask" label={L('askFollowUp', { q: v.followUpQ ? tt(v.followUpQ, lang) : '' })} onPress={() => act({ type: 'fuDecide', ask: true })} />
                <Big testID="fu-skip" kind="ghost" label={L('skip')} onPress={() => act({ type: 'fuDecide', ask: false })} />
              </View>
            ) : (
              <Narrator text={L('botFuDeciding', { asker: name(e.askerId) })} />
            ))}
          {v.phase === 'fuAnswer' && (isMe(e.respondentId) ? <Choose key={'respond-' + e.n} lang={lang} prompt={L('pickAnswer')} options={v.options!} onConfirm={(id) => act({ type: 'fuAnswer', responseId: id })} testID="respond" /> : <Narrator text={L('thinking', { name: name(e.respondentId) })} />)}
          {v.phase === 'judge' &&
            (isMe(e.respondentId) ? (
              <Narrator text={L('judgeWaitYou')} />
            ) : e.myJudgment ? (
              <Narrator text={`${tt(JUDGMENT_LABEL[e.myJudgment], lang)} — ${L('waitingFor', { n: e.waitingFor })}`} />
            ) : (
              <JudgePicker key={'judge-' + e.n} lang={lang} who={name(e.respondentId)} onConfirm={(j) => act({ type: 'judge', judgment: j })} />
            ))}
          {v.phase === 'judged' && <Big testID="continue" label={L('continue')} onPress={() => act({ type: 'continue' })} />}
        </View>
      );
    }

    case 'extraPick':
      return <ExtraPick game={game} lang={lang} name={name} act={act} openTestimony={props.openTestimony} />;

    case 'review':
      return (
        <View style={{ gap: 10 }} testID="review">
          <Text style={st.h2}>{L('reviewTitle')}</Text>
          {v.testimony.map((e) => (
            <ExchangeCard key={e.n} e={e} game={game} lang={lang} name={name} showJudgments />
          ))}
          <Text style={st.small}>{L('tieRule')}</Text>
          <Big testID="go-vote" label={L('goVote')} onPress={() => act({ type: 'continue' })} />
        </View>
      );

    case 'vote':
      return v.myVote ? (
        <Narrator text={L('voteWait')} />
      ) : (
        <View style={{ gap: 10 }}>
          <Text style={st.h2}>{L('voteTitle')}</Text>
          <Text style={st.body}>{v.role === 'liar' ? L('votePromptLiar') : L('votePrompt')}</Text>
          <Text style={st.small}>{L('tieRule')}</Text>
          <Choose
            lang={lang}
            prompt=""
            testID="vote"
            options={game.players.filter((p) => p.id !== meId).map((p) => ({ id: p.id, text: { en: p.name, es: p.name }, asserts: [] }))}
            onConfirm={(id) => act({ type: 'vote', targetId: id })}
            faces={game}
          />
        </View>
      );

    case 'voted': {
      const res = result(game);
      return (
        <View style={{ gap: 10 }} testID="voted">
          <Text style={st.h2}>{L('votesTitle')}</Text>
          <View style={st.card}>
            {Object.entries(game.votes).map(([a, b]) => (
              <Text key={a} style={st.body}>
                {L('votedFor', { a: name(a), b: name(b) })}
              </Text>
            ))}
          </View>
          <Text style={[st.h3, { color: C.amber }]}>
            {res.tie
              ? L('noSingle')
              : res.identifiedId === meId
                ? L('identifiedYou') + ' ' + (res.caught ? L('caughtYesYou') : L('caughtNo', { name: name(meId) }))
                : L('identified', { name: name(res.identifiedId!) }) + ' ' + (res.caught ? L('caughtYes', { name: name(res.identifiedId!) }) : L('caughtNo', { name: name(res.identifiedId!) }))}
          </Text>
          <Big testID="continue" label={L('continue')} onPress={() => act({ type: 'continue' })} />
        </View>
      );
    }

    case 'challenge':
      return (
        <View style={{ gap: 10 }}>
          <Text style={st.h2}>{L('challengeTitle')}</Text>
          {v.role === 'liar' && v.challenge ? (
            <>
              <Text style={st.body}>{L('challengeLiar')}</Text>
              <Choose lang={lang} prompt={tt(v.challenge.q, lang)} testID="challenge" options={v.challenge.options.map((o) => ({ id: o.value, text: o.text, asserts: [] }))} onConfirm={(id) => act({ type: 'challenge', value: id })} />
            </>
          ) : (
            <Narrator text={L('challengeWait', { name: name(game.liarId) })} />
          )}
        </View>
      );

    case 'reveal':
      return <Reveal game={game} lang={lang} name={name} onReplay={props.onReplay} />;
  }
  return null;
}

function ExtraPick(props: { game: State; lang: Lang; name: (id: string) => string; act: (a: HumanAction) => void; openTestimony: () => void }) {
  const { game, lang, name, act } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const [target, setTarget] = useState<string | null>(null);
  const earlier = target ? canExtraFollowUp(game, target) : [];
  return (
    <View style={{ gap: 10 }} testID="extra">
      <Text style={st.h2}>{L('extraTitle')}</Text>
      <Text style={st.body}>{L('extraPrompt')}</Text>
      <Big kind="ghost" label={L('testimony')} onPress={props.openTestimony} testID="extra-testimony" />
      <View style={{ gap: 8 }}>
        {game.players
          .filter((p) => p.id !== game.humanId)
          .map((p) => (
            <Option key={p.id} testID={'target-' + p.id} selected={target === p.id} onPress={() => setTarget(p.id)} lang={lang}>
              <View style={st.row}>
                <Face suspectId={p.suspectId} emoji={p.emoji} size={36} />
                <Text style={st.optText}>{p.name}</Text>
              </View>
            </Option>
          ))}
      </View>
      {target && (
        <>
          {earlier.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={st.h3}>{L('followEarlier')}</Text>
              {earlier.map((e) => {
                const c = claimById(e.claimId!).claim;
                return (
                  <Pressable key={e.n} testID={'extra-fu-' + e.n} accessibilityRole="button" style={({ pressed }) => [st.opt, pressed && st.pressed]} onPress={() => act({ type: 'extra', targetId: target, followUpOf: e.n })}>
                    <Text style={st.small}>{L('earlierClaim', { c: tt(c.text, lang) })}</Text>
                    <Text style={st.optText}>→ {tt(c.followUp.q, lang)}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <Text style={st.h3}>{L('newQuestion')}</Text>
          <QuestionPicker lang={lang} onPick={(id) => act({ type: 'extra', targetId: target, questionId: id })} />
        </>
      )}
      <Text style={st.small}>{name(game.humanId)}</Text>
    </View>
  );
}

function Reveal(props: { game: State; lang: Lang; name: (id: string) => string; onReplay: () => void }) {
  const { game, lang, name } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const res = result(game);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const ch = game.challenge?.slot ? CHALLENGES.find((c) => c.slot === game.challenge!.slot)! : null;
  const optText = (value: string | null) => (ch && value ? tt(ch.options.find((o) => o.value === value)!.text, lang) : '');
  return (
    <View style={{ gap: 12 }} testID="reveal">
      <Text style={st.h2}>{L('revealTitle')}</Text>
      <Text style={[st.h3, { color: C.red }]}>{game.liarId === game.humanId ? L('theLiarWasYou') : L('theLiarWas', { name: name(game.liarId) })}</Text>
      <Text style={[st.h3, { color: res.caught ? C.amber : C.manila }]}>
        {res.tie ? L('noSingle') : res.caught ? (game.liarId === game.humanId ? L('caughtYesYou') : L('caughtYes', { name: name(game.liarId) })) : L('caughtNo', { name: name(res.identifiedId!) })}
      </Text>
      <View style={st.card}>
        <Text style={st.small}>{L('theCase')}</Text>
        <Text style={st.h3}>{tt(LOCATION, lang)}</Text>
        <EvidenceList lang={lang} />
      </View>
      {game.challenge?.omitted && <Text style={st.body} testID="challenge-omitted">{L('challengeOmitted')}</Text>}
      {ch && game.challenge?.answer && (
        <Text style={st.body} testID="challenge-result">
          {L('challengeResult', { q: tt(ch.q, lang), name: name(game.liarId), a: optText(game.challenge.answer), c: optText(TRUTH[ch.slot]) })}
        </Text>
      )}
      <View style={st.card}>
        <Text style={st.h3}>{L('scores')}</Text>
        {game.players.map((p) => (
          <Text key={p.id} style={st.body}>
            {name(p.id)}: {res.points[p.id].total} {res.points[p.id].parts.length ? `(${res.points[p.id].parts.map((x) => PTS[x.code][lang]).join(', ')})` : `(${L('noPoints')})`}
          </Text>
        ))}
      </View>

      <Text style={st.h2}>{L('explainTitle')}</Text>
      <Text style={st.small}>{L('explainNote')}</Text>
      {game.ex.map((e) => {
        const pub = viewFor(game, game.humanId).testimony.find((x) => x.n === e.n)!;
        const claimId = e.followUpOf !== undefined ? game.ex[e.followUpOf].claimId : e.claimId;
        const q = claimId ? claimById(claimId).question : null;
        return (
          <View key={e.n} style={{ gap: 6 }}>
            <ExchangeCard e={pub} game={game} lang={lang} name={name} contextClaim={e.followUpOf !== undefined && claimId ? { id: claimId, text: claimById(claimId).claim.text, asserts: [] } : null} showJudgments />
            {e.claimId && <Explain id={e.claimId} kind="claim" lang={lang} />}
            {e.responseId && <Explain id={e.responseId} kind="response" lang={lang} />}
            {q && (
              <Pressable accessibilityRole="button" onPress={() => setOpen((o) => ({ ...o, [e.n]: !o[e.n] }))} style={st.linkBtn} testID={'all-options-' + e.n}>
                <Text style={st.link}>{open[e.n] ? L('hideOptions') : L('allOptions')}</Text>
              </Pressable>
            )}
            {q && open[e.n] && (
              <View style={{ gap: 6 }}>
                {(e.followUpOf !== undefined ? claimById(claimId!).claim.followUp.responses.map((r) => ({ id: r.id, kind: 'response' as const, text: r.text })) : q.claims.map((c) => ({ id: c.id, kind: 'claim' as const, text: c.text }))).map((o) => (
                  <View key={o.id} style={st.optCard}>
                    <Text style={st.optText}>“{tt(o.text, lang)}”</Text>
                    <Explain id={o.id} kind={o.kind} lang={lang} />
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <Text style={st.h2}>{L('botsTitle')}</Text>
      <View style={st.card} testID="bot-reasons">
        {game.decisions.map((d, i) => (
          <Text key={i} style={st.small}>
            <Text style={{ fontWeight: '800' }}>
              {name(d.pid)}
              {d.n !== undefined ? ` · #${d.n + 1}` : ''} · {STEP[d.step][lang]}:
            </Text>{' '}
            {reasonText(d.reason, lang)}
          </Text>
        ))}
      </View>

      <View style={[st.card, { borderColor: C.amber }]}>
        <Text style={st.body}>{L('founderQ')}</Text>
      </View>
      <Big testID="replay" label={L('replay')} onPress={props.onReplay} />
      <Big testID="main-menu" kind="ghost" label={L('mainMenu')} onPress={() => router.replace('/')} />
    </View>
  );
}

const PTS: Record<string, { en: string; es: string }> = {
  'pts.votedLiar': { en: '+1 voted for the Liar', es: '+1 votó por el Mentiroso' },
  'pts.escaped': { en: '+2 not identified', es: '+2 no identificado' },
  'pts.challenge': { en: '+1 final question correct', es: '+1 acertó la pregunta final' },
};
const STEP: Record<string, { en: string; es: string }> = {
  ask: { en: 'question', es: 'pregunta' },
  answer: { en: 'answer', es: 'respuesta' },
  followUp: { en: 'follow-up', es: 'seguimiento' },
  respond: { en: 'follow-up answer', es: 'respuesta de seguimiento' },
  judge: { en: 'judgment', es: 'juicio' },
  vote: { en: 'vote', es: 'voto' },
  challenge: { en: 'final question', es: 'pregunta final' },
};

// ---------------------------------------------------------------- pieces

function Explain(props: { id: string; kind: 'claim' | 'response'; lang: Lang }) {
  const x = explainLine(props.id, props.kind, props.lang);
  const color = x.cls === 'conflicts' ? C.red : x.cls === 'supports' ? C.green : C.muted;
  return (
    <View style={[st.explain, { borderLeftColor: color }]}>
      <Text style={[st.small, { fontWeight: '800', color: C.manila }]}>{tt(CLS_LABEL[x.cls], props.lang)}</Text>
      {x.lines.map((l, i) => (
        <Text key={i} style={st.small}>
          {l}
        </Text>
      ))}
    </View>
  );
}

function ExchangeCard(props: {
  e: PublicExchange;
  game: State;
  lang: Lang;
  name: (id: string) => string;
  contextClaim?: PublicLine | null;
  pendingFollowUp?: { en: string; es: string } | null;
  showJudgments?: boolean;
}) {
  const { e, lang, name } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const isExtraFu = e.followUpOf !== undefined;
  const claim = e.claim ?? (isExtraFu ? props.contextClaim : null);
  const fuQ = e.followUpQ ?? props.pendingFollowUp ?? null;
  return (
    <View style={st.card} testID={'exchange-' + e.n}>
      <Text style={st.small}>
        #{e.n + 1} ·{' '}
        {e.respondentId === props.game.humanId
          ? L('asksYou', { asker: name(e.askerId) })
          : e.askerId === props.game.humanId
            ? L('youAsk', { name: name(e.respondentId) })
            : L('asks', { asker: name(e.askerId), name: name(e.respondentId) })}
      </Text>
      {isExtraFu && claim && <Text style={st.small}>{L('earlierClaim', { c: tt(claim.text, lang) })}</Text>}
      {e.question && !isExtraFu && <Text style={st.q}>“{tt(e.question.text, lang)}”</Text>}
      {!isExtraFu && claim && (
        <Text style={st.a}>
          <Text style={st.who}>{name(e.respondentId)}: </Text>“{tt(claim.text, lang)}”
        </Text>
      )}
      {fuQ && (
        <Text style={st.q}>
          <Text style={st.who}>{L('followUp')}: </Text>“{tt(fuQ, lang)}”
        </Text>
      )}
      {e.response && (
        <Text style={st.a}>
          <Text style={st.who}>{name(e.respondentId)}: </Text>“{tt(e.response.text, lang)}”
        </Text>
      )}
      {!isExtraFu && claim && e.judgments && !e.followUpQ && <Text style={st.small}>{L('noFollowUp')}</Text>}
      {props.showJudgments && e.judgments && (
        <View style={{ marginTop: 6, gap: 2 }} testID={'judgments-' + e.n}>
          <Text style={[st.small, { fontWeight: '800' }]}>{L('judgmentsIn')}</Text>
          {Object.entries(e.judgments).map(([pid, j]) => (
            <Text key={pid} style={st.small}>
              {name(pid)}: {tt(JUDGMENT_LABEL[j], lang)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function Heading(props: { game: State; lang: Lang }) {
  const { game, lang } = props;
  const e = game.ex[game.ex.length - 1];
  const total = 5;
  return (
    <Text style={st.tag}>
      {e?.kind === 'extra' ? str(lang, 'extraTitle') : str(lang, 'interrogation')} {e ? `${e.n + 1}/${total}` : ''}
    </Text>
  );
}

function Roster(props: { game: State; lang: Lang }) {
  const { game, lang } = props;
  return (
    <View style={st.roster}>
      {game.players.map((p) => (
        <View key={p.id} style={{ alignItems: 'center', width: 76 }}>
          <Face suspectId={p.suspectId} emoji={p.emoji} size={40} />
          <Text style={st.tiny} numberOfLines={1}>
            {p.id === game.humanId ? str(lang, 'you') : p.name}
          </Text>
          {p.trait && <Text style={st.tiny}>{tt(TRAIT_LABEL[p.trait], lang)}</Text>}
        </View>
      ))}
    </View>
  );
}

function QuestionPicker(props: { lang: Lang; onPick: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const topics: Topic[] = ['entrance', 'route', 'incident'];
  return (
    <View style={{ gap: 8 }}>
      {topics.map((tp) => (
        <View key={tp} style={{ gap: 6 }}>
          <Text style={st.tag}>{tt(TOPIC_LABEL[tp], props.lang)}</Text>
          {QUESTIONS.filter((q) => q.topic === tp).map((q) => (
            <Pressable
              key={q.id}
              testID={'ask-' + q.id}
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setBusy(true);
                props.onPick(q.id);
              }}
              style={({ pressed }) => [st.opt, pressed && st.pressed, busy && { opacity: 0.6 }]}
            >
              <Text style={st.optText}>“{tt(q.text, props.lang)}”</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Select, then confirm. Same visual style for every option (no hints), full text wraps. */
function Choose(props: { lang: Lang; prompt: string; options: PublicLine[]; onConfirm: (id: string) => void; testID: string; faces?: State }) {
  const [sel, setSel] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const L = (k: Key) => str(props.lang, k);
  return (
    <View style={{ gap: 8 }} testID={props.testID + '-options'}>
      {!!props.prompt && <Text style={st.body}>{props.prompt}</Text>}
      {props.options.map((o, i) => {
        const p = props.faces?.players.find((x) => x.id === o.id);
        return (
          <Option key={o.id} testID={`${props.testID}-opt-${i}`} selected={sel === o.id} onPress={() => !sent && setSel(o.id)} lang={props.lang}>
            {p ? (
              <View style={st.row}>
                <Face suspectId={p.suspectId} emoji={p.emoji} size={36} />
                <Text style={st.optText}>{tt(o.text, props.lang)}</Text>
              </View>
            ) : (
              <Text style={st.optText}>“{tt(o.text, props.lang)}”</Text>
            )}
          </Option>
        );
      })}
      <Big
        testID={props.testID + '-confirm'}
        label={sent ? L('sending') : L('confirm')}
        disabled={!sel || sent}
        onPress={() => {
          if (!sel || sent) return;
          setSent(true);
          props.onConfirm(sel);
        }}
      />
    </View>
  );
}

function JudgePicker(props: { lang: Lang; who: string; onConfirm: (j: Judgment) => void }) {
  const [sel, setSel] = useState<Judgment | null>(null);
  const [sent, setSent] = useState(false);
  const L = (k: Key, p?: Record<string, string | number>) => str(props.lang, k, p);
  return (
    <View style={{ gap: 8 }} testID="judge-options">
      <Text style={st.h3}>{L('judgeTitle')}</Text>
      <Text style={st.small}>{L('judgePrompt', { name: props.who })}</Text>
      {(['fits', 'conflict', 'unclear'] as Judgment[]).map((j) => (
        <Option key={j} testID={'judge-' + j} selected={sel === j} onPress={() => !sent && setSel(j)} lang={props.lang}>
          <Text style={st.optText}>{tt(JUDGMENT_LABEL[j], props.lang)}</Text>
        </Option>
      ))}
      <Big
        testID="judge-confirm"
        label={sent ? L('sending') : L('confirm')}
        disabled={!sel || sent}
        onPress={() => {
          if (!sel || sent) return;
          setSent(true);
          props.onConfirm(sel);
        }}
      />
    </View>
  );
}

function Option(props: { children: ReactNode; selected: boolean; onPress: () => void; testID?: string; lang: Lang }) {
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      style={({ pressed }) => [st.opt, props.selected && st.optSel, pressed && st.pressed]}
    >
      {props.children}
      {props.selected && <Text style={st.selTag}>✓ {str(props.lang, 'selected')}</Text>}
    </Pressable>
  );
}

function EvidenceList(props: { lang: Lang }) {
  return (
    <View style={{ gap: 8 }}>
      {EVIDENCE_BLOCKS.map((b) => (
        <View key={b.block}>
          <Text style={[st.small, { fontWeight: '800' }]}>
            {b.block}. {tt(b.title, props.lang)}
          </Text>
          <Text style={st.body}>{tt(b.text, props.lang)}</Text>
        </View>
      ))}
    </View>
  );
}

function Narrator(props: { text: string }) {
  if (!props.text) return null;
  return (
    <View style={st.narr}>
      <Image source={INSPECTOR.default} style={{ width: 44, height: 44 }} resizeMode="contain" accessibilityIgnoresInvertColors />
      <Text style={[st.body, { flex: 1, color: C.ink }]}>{props.text}</Text>
    </View>
  );
}

function TopBar(props: { lang: Lang; onHome: () => void; onLang: () => void; children?: ReactNode }) {
  return (
    <View style={st.top}>
      <Chip testID="home" label={str(props.lang, 'home')} onPress={props.onHome} />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
        {props.children}
        <Chip testID="lang" label={props.lang === 'en' ? 'ES' : 'EN'} onPress={props.onLang} />
      </View>
    </View>
  );
}

function Chip(props: { label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={props.testID} accessibilityRole="button" onPress={props.onPress} style={({ pressed }) => [st.chip, pressed && st.pressed]} hitSlop={6}>
      <Text style={{ color: C.manila, fontWeight: '700', fontSize: 14 }}>{props.label}</Text>
    </Pressable>
  );
}

function Big(props: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; testID?: string }) {
  const kind = props.kind ?? 'primary';
  const bg = kind === 'primary' ? C.amber : kind === 'secondary' ? C.slate : kind === 'danger' ? C.red : 'transparent';
  const fg = kind === 'primary' ? C.ink : C.manila;
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [st.big, { backgroundColor: bg, opacity: props.disabled ? 0.45 : 1 }, kind === 'ghost' && { borderWidth: 1, borderColor: C.line }, pressed && st.pressed]}
    >
      <Text style={{ color: fg, fontWeight: '800', fontSize: 17, textAlign: 'center' }}>{props.label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  page: { ...COL, padding: 16, gap: 12, paddingBottom: 48 },
  top: { ...COL, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: C.line },
  h1: { fontFamily: F.type, fontSize: 28, color: C.manila, textAlign: 'center' },
  h2: { fontFamily: F.type, fontSize: 22, color: C.manila },
  h3: { fontSize: 18, fontWeight: '800', color: C.manila },
  tag: { color: C.amber, fontWeight: '800', fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase' },
  body: { color: C.manila, fontSize: 17, lineHeight: 24 },
  small: { color: C.muted, fontSize: 15, lineHeight: 21 },
  tiny: { color: C.muted, fontSize: 12 },
  q: { color: C.manila, fontSize: 17, lineHeight: 24, fontStyle: 'italic' },
  a: { color: C.paper, fontSize: 17, lineHeight: 24 },
  who: { fontWeight: '800', color: C.amber, fontStyle: 'normal' },
  card: { backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 12, gap: 6 },
  opt: { backgroundColor: C.slate, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', padding: 12, gap: 4 },
  optSel: { borderColor: C.amber, backgroundColor: C.slate2 },
  optText: { color: C.manila, fontSize: 17, lineHeight: 23, flexShrink: 1 },
  optCard: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 10, gap: 4 },
  selTag: { color: C.amber, fontWeight: '800', fontSize: 14 },
  pressed: { opacity: 0.75 },
  big: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roster: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  narr: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.manila, borderRadius: 12, padding: 10 },
  explain: { borderLeftWidth: 4, paddingLeft: 10, gap: 2 },
  linkBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  link: { color: C.amber, fontWeight: '700', textDecorationLine: 'underline', fontSize: 15 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,42,48,0.97)' },
  input: { flex: 1, backgroundColor: C.manila, color: C.ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16 },
});
