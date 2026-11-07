/**
 * Visual Bluffing Prototype screen. Renders only what viewFor() returns for the human, so a Liar
 * screen never receives the scene key. No animations (reduced motion is respected by default).
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Face } from '../components/ui';
import { useLang } from '../lib/lang';
import { loadProfile } from '../lib/profile';
import { C } from '../lib/theme';
import { QA_ENABLED } from '../prototype/flags';
import { CARD_LABEL, type CardId, type Lang } from './cards';
import { HUMAN, apply, botAct, newGame, pending, viewFor, type Action, type ScenarioId, type State, type View as GameView } from './engine';
import { CARD_IMAGES, SCENE_IMAGES } from './images';
import { BScreen } from './b/BScreen';
import type { ScenarioB } from './b/engine';
import { sb } from './b/strings';
import { s as str, type Key } from './strings';
import { Big, Box, Chip, TopBar, st } from './ui';

type Panel = null | 'leave' | 'picture';
type Me = { name: string; emoji?: string };
/** An action without the player id (the screen always acts for the human). */
type HA = { [K in Action['type']]: Omit<Extract<Action, { type: K }>, 'pid'> }[Action['type']];

export function VisualScreen() {
  const { lang, setLang } = useLang();
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const [game, setGame] = useState<State | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [me, setMe] = useState<Me>({ name: '' });
  const [variantB, setVariantB] = useState<{ scenario: ScenarioB; n: number } | null>(null);
  useEffect(() => {
    loadProfile().then((p) => p && setMe({ name: p.name, emoji: p.emoji })).catch(() => {});
  }, []);

  // bots act one at a time after a short, seeded pause
  useEffect(() => {
    if (!game) return;
    const bot = pending(game).find((id) => id !== HUMAN);
    if (!bot) return;
    const delay = 600 + ((game.seed.length * 97 + bot.charCodeAt(1) * 131 + game.log.length * 53) % 900);
    const timer = setTimeout(() => setGame((g) => (g ? botAct(g, bot) : g)), delay);
    return () => clearTimeout(timer);
  }, [game]);

  const start = (scenario: ScenarioId, seed?: string) => {
    setPanel(null);
    setGame(newGame({ scenario, seed: seed ?? String(Date.now() % 1000000), humanName: me.name || L('you'), humanEmoji: me.emoji }));
  };
  const act = (a: HA) => setGame((g) => (g ? apply(g, { ...a, pid: HUMAN } as Action) : g));
  const toggleLang = () => setLang(lang === 'en' ? 'es' : 'en');

  if (variantB) return <BScreen key={variantB.n} scenario={variantB.scenario} me={me} onExit={() => setVariantB(null)} />;
  const startB = (scenario: ScenarioB) => setVariantB({ scenario, n: Date.now() });

  if (!game) {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} style={{ backgroundColor: C.ink }}>
        <TopBar lang={lang} onHome={() => router.replace('/')} onLang={toggleLang} />
        <View style={st.page}>
          <Text style={st.h1}>{L('title')}</Text>
          <Text style={st.lead}>{L('instruction')}</Text>
          <Box>
            <Text style={st.h3}>{sb(lang, 'variantB')}</Text>
            <Text style={st.small}>{sb(lang, 'tagline')}</Text>
            <Big testID="start-b-detective" label={sb(lang, 'playDetective')} onPress={() => startB('b-detective')} />
            <Big testID="start-b-liar" kind="secondary" label={sb(lang, 'playLiar')} onPress={() => startB('b-liar')} />
          </Box>
          <Box>
            <Text style={st.h3}>{sb(lang, 'baselineA')}</Text>
            <HowCards lang={lang} />
            <Big testID="start-detective" label={L('playDetective')} onPress={() => start('detective')} />
            <Big testID="start-liar" kind="secondary" label={L('playLiar')} onPress={() => start('liar')} />
          </Box>
          {QA_ENABLED && (
            <View style={st.qa}>
              <Text style={st.small}>{L('qaTitle')}</Text>
              <Big testID="start-qa-tie" kind="ghost" label={L('qaTie')} onPress={() => start('qa-tie', 'qa-tie')} />
              <Big testID="start-b-qa-caught" kind="ghost" label={sb(lang, 'qaCaught')} onPress={() => startB('b-qa-caught')} />
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  const v = viewFor(game, HUMAN);
  const name = (id: string) => (id === HUMAN ? L('you') : game.players.find((p) => p.id === id)?.name ?? id);
  const playing = v.phase !== 'result';

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }} style={{ backgroundColor: C.ink }}>
      <TopBar lang={lang} onHome={() => setPanel('leave')} onLang={toggleLang}>
        {playing && <Chip testID="open-picture" label={v.role === 'liar' ? L('category') : L('picture')} onPress={() => setPanel(panel === 'picture' ? null : 'picture')} />}
      </TopBar>
      <View style={st.page}>
        {panel === 'leave' && (
          <Box>
            <Text style={st.h3}>{L('leaveQ')}</Text>
            <View style={st.row}>
              <Big testID="stay" kind="secondary" label={L('stay')} onPress={() => setPanel(null)} flex />
              <Big testID="leave" kind="danger" label={L('leave')} onPress={() => { setPanel(null); setGame(null); }} flex />
            </View>
          </Box>
        )}
        {panel === 'picture' && (
          <Box>
            <SecretInfo v={v} lang={lang} />
            <Big testID="close-picture" kind="ghost" label={L('close')} onPress={() => setPanel(null)} />
          </Box>
        )}
        <Body game={game} v={v} lang={lang} act={act} name={name} onReplay={() => start(game.scenario, game.scenario.startsWith('qa') ? game.seed : undefined)} />
      </View>
    </ScrollView>
  );
}

function Body(props: { game: State; v: GameView; lang: Lang; act: (a: HA) => void; name: (id: string) => string; onReplay: () => void }) {
  const { game, v, lang, act, name } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  switch (v.phase) {
    case 'briefing':
      return (
        <>
          <Text style={st.h1}>{v.role === 'liar' ? L('youLiar') : L('youDetective')}</Text>
          <Box><SecretInfo v={v} lang={lang} /></Box>
          <HowCards lang={lang} />
          <Text style={st.small}>{L('tieRule')}</Text>
          <Big testID="begin" label={L('start')} onPress={() => act({ type: 'start' })} />
        </>
      );
    case 'pick':
      return <PickPhase key={'pick' + v.round} v={v} lang={lang} act={act} name={name} />;
    case 'reveal':
      return (
        <>
          <Text style={st.h2}>{v.round === 0 ? L('reveal1') : L('reveal2')}</Text>
          <Choices v={v} lang={lang} name={name} rounds={v.round === 0 ? [0] : [0, 1]} highlight={v.round} />
          <Big testID="continue" label={L('continue')} onPress={() => act({ type: 'continue' })} />
        </>
      );
    case 'challenge':
      return <ChallengePhase v={v} lang={lang} act={act} name={name} game={game} />;
    case 'vote':
      return <VotePhase v={v} lang={lang} act={act} name={name} game={game} />;
    case 'result':
      return <ResultPhase v={v} lang={lang} name={name} game={game} onReplay={props.onReplay} />;
  }
}

function PickPhase(props: { v: GameView; lang: Lang; act: (a: HA) => void; name: (id: string) => string }) {
  const { v, lang, act, name } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const [sel, setSel] = useState<CardId | null>(null);
  const locked = v.myPicks[v.round];
  return (
    <>
      <Text style={st.tag}>{L('selection', { n: v.round + 1 })}</Text>
      <Text style={st.h2}>{v.round === 0 ? L('prompt1') : L('prompt2')}</Text>
      {v.round === 1 && <Choices v={v} lang={lang} name={name} rounds={[0]} compact title={L('reveal1')} />}
      <Status v={v} lang={lang} name={name} />
      <View style={st.grid} accessibilityRole="radiogroup">
        {v.cards.map((c) => {
          const blocked = v.blocked.includes(c);
          const chosen = (locked ?? sel) === c;
          return (
            <Pressable
              key={c}
              testID={'card-' + c}
              accessibilityRole="radio"
              accessibilityState={{ selected: chosen, disabled: blocked || !!locked }}
              accessibilityLabel={CARD_LABEL[c][lang] + (blocked ? ', ' + L('yourFirst') : chosen ? ', ' + L('selected') : '')}
              disabled={blocked || !!locked}
              onPress={() => setSel(c)}
              style={[st.card, chosen && st.cardOn, blocked && { opacity: 0.4 }, !!locked && !chosen && { opacity: 0.55 }]}
            >
              <Image source={CARD_IMAGES[c]} style={{ width: 76, height: 76 }} resizeMode="contain" />
              <Text style={st.cardLabel}>{CARD_LABEL[c][lang]}</Text>
              <Text style={st.cardNote}>{blocked ? L('yourFirst') : chosen ? '✓ ' + L('selected') : ' '}</Text>
            </Pressable>
          );
        })}
      </View>
      {locked ? (
        <Text testID="locked" style={st.notice}>{L('lockedWait', { card: CARD_LABEL[locked][lang] })}</Text>
      ) : (
        <Big testID="lock-in" disabled={!sel} label={sel ? L('lockIn', { card: CARD_LABEL[sel][lang] }) : L('chooseFirst')} onPress={() => sel && act({ type: 'pick', card: sel })} />
      )}
    </>
  );
}

function ChallengePhase(props: { v: GameView; lang: Lang; act: (a: HA) => void; name: (id: string) => string; game: State }) {
  const { v, lang, act, name, game } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const [target, setTarget] = useState<string | null>(null);
  const [card, setCard] = useState<CardId | null>(null);
  const others = v.players.filter((p) => p.id !== v.me);
  const theirs = target ? ([v.reveals[0][target], v.reveals[1][target]] as CardId[]) : [];
  return (
    <>
      <Choices v={v} lang={lang} name={name} rounds={[0, 1]} title={L('everyone')} />
      <Box>
        <Text style={st.h3}>{L('challengeTitle')}</Text>
        {v.challenge ? (
          <View testID="answer" style={{ gap: 8 }}>
            <Text style={st.body}>{L('you')}: “{L('whyQ', { card: CARD_LABEL[v.challenge.card][lang] })}”</Text>
            <View style={st.row}>
              <Face suspectId={game.players.find((p) => p.id === v.challenge!.targetId)?.suspectId} size={40} />
              <Text style={[st.body, { flex: 1 }]}>{name(v.challenge.targetId)}: “{v.challenge.text[lang]}”</Text>
            </View>
            <Text style={st.small}>{L('answerNote')}</Text>
          </View>
        ) : (
          <>
            <Text style={st.small}>{L('challengeHelp')}</Text>
            <View style={st.wrap}>
              {others.map((p) => (
                <Pressable key={p.id} testID={'target-' + p.id} accessibilityRole="radio" accessibilityState={{ selected: target === p.id }} onPress={() => { setTarget(p.id); setCard(null); }} style={[st.pill, target === p.id && st.pillOn]}>
                  <Face suspectId={p.suspectId} emoji={p.emoji} size={30} />
                  <Text style={st.pillText}>{p.name}{target === p.id ? ' ✓' : ''}</Text>
                </Pressable>
              ))}
            </View>
            {target && (
              <View style={st.wrap}>
                {theirs.map((c) => (
                  <Pressable key={c} testID={'ask-card-' + c} accessibilityRole="radio" accessibilityState={{ selected: card === c }} onPress={() => setCard(c)} style={[st.pill, card === c && st.pillOn]}>
                    <Image source={CARD_IMAGES[c]} style={{ width: 28, height: 28 }} />
                    <Text style={st.pillText}>{CARD_LABEL[c][lang]}{card === c ? ' ✓' : ''}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {target && card && <Big testID="ask" kind="secondary" label={L('ask') + ': ' + L('whyQ', { card: CARD_LABEL[card][lang] })} onPress={() => act({ type: 'ask', targetId: target, card })} />}
          </>
        )}
      </Box>
      <Big testID="to-vote" label={v.challenge ? L('toVote') : L('skip')} onPress={() => act({ type: 'continue' })} />
    </>
  );
}

function VotePhase(props: { v: GameView; lang: Lang; act: (a: HA) => void; name: (id: string) => string; game: State }) {
  const { v, lang, act, name } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const [sel, setSel] = useState<string | null>(null);
  return (
    <>
      <Text style={st.h2}>{L('voteTitle')}</Text>
      <Text style={st.body}>{L('votePrompt')}</Text>
      <Text style={[st.small, { color: C.amber }]}>{L('tieRule')}</Text>
      <Choices v={v} lang={lang} name={name} rounds={[0, 1]} compact />
      {v.challenge && <Text style={st.small}>{name(v.challenge.targetId)}: “{v.challenge.text[lang]}”</Text>}
      {v.myVote ? (
        <>
          <Text testID="vote-locked" style={st.notice}>{L('voteWait')}</Text>
          <Status v={v} lang={lang} name={name} />
        </>
      ) : (
        <>
          {v.players.filter((p) => p.id !== v.me).map((p) => (
            <Pressable key={p.id} testID={'vote-' + p.id} accessibilityRole="radio" accessibilityState={{ selected: sel === p.id }} onPress={() => setSel(p.id)} style={[st.voteRow, sel === p.id && st.cardOn]}>
              <Face suspectId={p.suspectId} emoji={p.emoji} size={44} />
              <Text style={[st.h3, { flex: 1 }]}>{p.name}</Text>
              <Text style={st.cardNote}>{sel === p.id ? '✓ ' + L('selected') : ''}</Text>
            </Pressable>
          ))}
          <Big testID="confirm-vote" disabled={!sel} label={sel ? L('voteFor', { name: name(sel) }) : L('votePrompt')} onPress={() => sel && act({ type: 'vote', targetId: sel })} />
        </>
      )}
    </>
  );
}

function ResultPhase(props: { v: GameView; lang: Lang; name: (id: string) => string; game: State; onReplay: () => void }) {
  const { v, lang, name, game } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const [debug, setDebug] = useState(false);
  const end = v.end!;
  return (
    <>
      <Text testID="outcome" style={[st.h1, { color: end.caught ? C.green : C.amber }]}>{end.caught ? L('found') : L('blended')}</Text>
      <Text style={[st.h3, { textAlign: 'center' }]}>{L('theLiar', { name: name(end.liarId) })}</Text>
      <Text style={[st.body, { textAlign: 'center' }]}>{end.tie ? L('tieHappened') : L('identified', { name: name(end.identifiedId!) })}</Text>
      <Box><SecretInfo v={v} lang={lang} /></Box>
      <Choices v={v} lang={lang} name={name} rounds={[0, 1]} title={L('everyone')} liarId={end.liarId} tally={end.tally} />
      <Box>
        {Object.entries(end.votes).map(([from, to]) => (
          <Text key={from} style={st.small}>{name(from)} {L('votedFor', { name: name(to) })}</Text>
        ))}
        {v.challenge && <Text style={[st.small, { marginTop: 6 }]}>{L('you')}: “{L('whyQ', { card: CARD_LABEL[v.challenge.card][lang] })}” — {name(v.challenge.targetId)}: “{v.challenge.text[lang]}”</Text>}
      </Box>
      <Text style={st.body}>{L('judgingNote')}</Text>
      <Big testID="replay" label={L('replay')} onPress={props.onReplay} />
      <Big testID="menu" kind="secondary" label={L('menu')} onPress={() => router.replace('/')} />
      {QA_ENABLED && (
        <>
          <Big testID="debug" kind="ghost" label={L('debug') + (debug ? ' ▲' : ' ▼')} onPress={() => setDebug(!debug)} />
          {debug && (
            <Box>
              {game.log.map((l, i) => (
                <Text key={i} style={st.small}>
                  {name(l.pid)} · {l.step}{l.card ? ' · ' + CARD_LABEL[l.card][lang] : ''}{l.target ? ' → ' + name(l.target) : ''}: {str(lang, l.reason.code as Key, l.reason.p)}
                  {l.reason.p?.tied ? str(lang, 'tiedPick', { n: l.reason.p.tied }) : ''}
                </Text>
              ))}
            </Box>
          )}
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- pieces

/** Detectives (and everyone at the result) see the picture; the Liar sees only the category. */
function SecretInfo(props: { v: GameView; lang: Lang }) {
  const { v, lang } = props;
  const L = (k: Key) => str(lang, k);
  if (v.scene) {
    return (
      <View style={{ gap: 6 }}>
        <Text style={st.h3}>{v.phase === 'result' ? L('secretPicture') + (v.scene.name ? ': ' + v.scene.name[lang] : '') : L('detBrief')}</Text>
        <View style={{ width: '100%', aspectRatio: 800 / 560, borderRadius: 10, overflow: 'hidden' }}>
          <Image testID="scene" source={SCENE_IMAGES[v.scene.key]} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="contain" accessibilityLabel={v.scene.description[lang]} />
        </View>
        <Text style={st.small}>{L('protoArt')}</Text>
      </View>
    );
  }
  return (
    <View testID="category-box" style={{ gap: 6 }}>
      <Text style={st.body}>{L('liarOnlyCategory')}</Text>
      <Text style={[st.h2, { color: C.amber }]}>{v.category?.[lang]}</Text>
      <Text style={st.body}>{L('liarBrief')}</Text>
    </View>
  );
}

function HowCards({ lang }: { lang: Lang }) {
  return (
    <View style={{ gap: 8 }}>
      {(['how1', 'how2', 'how3'] as const).map((k, i) => (
        <View key={k} style={st.how}>
          <Text style={st.howN}>{i + 1}</Text>
          <Text style={[st.body, { flex: 1 }]}>{str(lang, k)}</Text>
        </View>
      ))}
    </View>
  );
}

function Status(props: { v: GameView; lang: Lang; name: (id: string) => string }) {
  const { v, lang, name } = props;
  return (
    <View style={st.statusRow}>
      {v.players.map((p) => (
        <View key={p.id} testID={'status-' + p.id} style={st.statusCell} accessibilityLabel={name(p.id) + ': ' + (p.done ? str(lang, 'ready') : str(lang, 'choosing'))}>
          <Face suspectId={p.suspectId} emoji={p.emoji} size={34} dim={!p.done} />
          <Text style={st.statusName} numberOfLines={1}>{name(p.id)}</Text>
          <Text style={[st.statusText, p.done && { color: C.amber }]}>{p.done ? '✓ ' + str(lang, 'ready') : str(lang, 'choosing')}</Text>
        </View>
      ))}
    </View>
  );
}

function Choices(props: { v: GameView; lang: Lang; name: (id: string) => string; rounds: number[]; title?: string; compact?: boolean; highlight?: number; liarId?: string; tally?: Record<string, number> }) {
  const { v, lang, name, rounds } = props;
  const L = (k: Key) => str(lang, k);
  const size = props.compact ? 26 : 40;
  return (
    <Box>
      {props.title && <Text style={st.h3}>{props.title}</Text>}
      {props.compact ? (
        <View style={st.wrap}>
          {v.players.map((p) => (
            <View key={p.id} testID={'choices-' + p.id} style={[st.row, { width: '48%', gap: 6 }]}>
              <Face suspectId={p.suspectId} emoji={p.emoji} size={28} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={st.statusName} numberOfLines={1}>{name(p.id)}</Text>
                {rounds.map((r) => v.reveals[r]?.[p.id] && <Text key={r} style={st.miniLine} numberOfLines={1}>{rounds.length > 1 ? (r === 0 ? L('first') : L('second')) + ' ' : ''}{CARD_LABEL[v.reveals[r][p.id]][lang]}</Text>)}
              </View>
            </View>
          ))}
        </View>
      ) : v.players.map((p) => (
        <View key={p.id} testID={'choices-' + p.id} style={[st.row, { paddingVertical: 4 }]}>
          <Face suspectId={p.suspectId} emoji={p.emoji} size={props.compact ? 30 : 40} />
          <View style={{ flex: 1 }}>
            <Text style={st.pillText}>
              {name(p.id)}
              {props.liarId === p.id ? ' — ' + L('liarTag') : ''}
              {props.tally ? ' · ' + props.tally[p.id] + ' ' + (props.tally[p.id] === 1 ? L('vote1') : L('votes')) : ''}
            </Text>
            <View style={[st.row, { flexWrap: 'wrap', gap: 6 }]}>
              {rounds.map((r) => {
                const c = v.reveals[r]?.[p.id];
                if (!c) return null;
                return (
                  <View key={r} style={[st.mini, props.highlight === r && { borderColor: C.manila }]}>
                    <Image source={CARD_IMAGES[c]} style={{ width: size, height: size }} />
                    <Text style={st.miniText}>{rounds.length > 1 ? (r === 0 ? L('first') : L('second')) + ' ' : ''}{CARD_LABEL[c][lang]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      ))}
    </Box>
  );
}
