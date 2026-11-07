/**
 * Variant B screen. Renders only viewForB(state, 'you'): a Liar screen gets no picture key until the
 * three unmarked candidates appear after the vote. No animations.
 */
import { router } from 'expo-router';
import { useEffect, useState, type ReactElement } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Face } from '../../components/ui';
import { useLang } from '../../lib/lang';
import { C } from '../../lib/theme';
import { QA_ENABLED } from '../../prototype/flags';
import { CARD_LABEL, type CardId, type Lang } from '../cards';
import { HUMAN } from '../engine';
import { CARD_IMAGES } from '../images';
import { s as str, type Key } from '../strings';
import { Big, Box, Chip, TopBar, st } from '../ui';
import { applyB, botActB, newGameB, pendingB, viewForB, type ActionB, type ScenarioB, type StateB, type ViewB } from './engine';
import { SCENE_IMAGES_B } from './images';
import type { SceneId } from './scenes';
import { sb, type KeyB } from './strings';

type HB = { [K in ActionB['type']]: Omit<Extract<ActionB, { type: K }>, 'pid'> }[ActionB['type']];

export function BScreen(props: { scenario: ScenarioB; me: { name: string; emoji?: string }; onExit: () => void }) {
  const { lang, setLang } = useLang();
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const B = (k: KeyB, p?: Record<string, string | number>) => sb(lang, k, p);
  const make = () => newGameB({ scenario: props.scenario, seed: props.scenario === 'b-qa-caught' ? 'qa-b' : String(Date.now() % 1000000), humanName: props.me.name || L('you'), humanEmoji: props.me.emoji });
  const [game, setGame] = useState<StateB>(make);
  const [panel, setPanel] = useState<null | 'leave' | 'picture'>(null);

  useEffect(() => {
    const bot = pendingB(game).find((id) => id !== HUMAN);
    if (!bot) return;
    const delay = 600 + ((game.seed.length * 97 + bot.charCodeAt(1) * 131 + game.log.length * 53) % 900);
    const timer = setTimeout(() => setGame((g) => botActB(g, bot)), delay);
    return () => clearTimeout(timer);
  }, [game]);

  const act = (a: HB) => setGame((g) => applyB(g, { ...a, pid: HUMAN } as ActionB));
  const v = viewForB(game, HUMAN);
  const name = (id: string) => (id === HUMAN ? L('you') : game.players.find((p) => p.id === id)?.name ?? id);
  const face = (id: string, size: number) => {
    const p = game.players.find((x) => x.id === id)!;
    return <Face suspectId={p.suspectId} emoji={p.emoji} size={size} />;
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }} style={{ backgroundColor: C.ink }}>
      <TopBar lang={lang} onHome={() => setPanel('leave')} onLang={() => setLang(lang === 'en' ? 'es' : 'en')}>
        {v.phase !== 'result' && <Chip testID="open-picture" label={v.role === 'liar' ? L('category') : L('picture')} onPress={() => setPanel(panel === 'picture' ? null : 'picture')} />}
      </TopBar>
      <View style={st.page}>
        {panel === 'leave' && (
          <Box>
            <Text style={st.h3}>{L('leaveQ')}</Text>
            <View style={st.row}>
              <Big testID="stay" kind="secondary" label={L('stay')} onPress={() => setPanel(null)} flex />
              <Big testID="leave" kind="danger" label={L('leave')} onPress={props.onExit} flex />
            </View>
          </Box>
        )}
        {panel === 'picture' && (
          <Box>
            <Secret v={v} lang={lang} />
            <Big testID="close-picture" kind="ghost" label={L('close')} onPress={() => setPanel(null)} />
          </Box>
        )}

        {v.phase === 'briefing' && (
          <>
            <Text style={st.h1}>{v.role === 'liar' ? L('youLiar') : L('youDetective')}</Text>
            <Box><Secret v={v} lang={lang} /></Box>
            <Text style={st.lead}>{B('tagline')}</Text>
            {(['rule1', 'rule2', 'rule3'] as const).map((k, i) => (
              <View key={k} style={st.how}>
                <Text style={st.howN}>{i + 1}</Text>
                <Text style={[st.body, { flex: 1 }]}>{B(k)}</Text>
              </View>
            ))}
            <Big testID="begin" label={L('start')} onPress={() => act({ type: 'start' })} />
          </>
        )}

        {v.phase === 'pick' && <Pick v={v} lang={lang} act={act} name={name} />}

        {v.phase === 'reveal' && (
          <>
            <Text style={st.h2}>{B('reveal')}</Text>
            <Cards v={v} lang={lang} name={name} face={face} />
            <Big testID="continue" label={L('continue')} onPress={() => act({ type: 'continue' })} />
          </>
        )}

        {v.phase === 'vote' && <Vote v={v} lang={lang} act={act} name={name} face={face} />}

        {v.phase === 'guess' && <Guess v={v} lang={lang} act={act} name={name} face={face} liarId={game.liarId} />}

        {v.phase === 'result' && v.end && (
          <>
            <Text testID="outcome" style={[st.h1, { color: v.end.outcome === 'found' ? C.green : C.amber }]}>{B(v.end.outcome)}</Text>
            <Text style={[st.h3, { textAlign: 'center' }]}>{L('theLiar', { name: name(v.end.liarId) })}</Text>
            <Text style={[st.body, { textAlign: 'center' }]}>{v.end.tie ? L('tieHappened') : L('identified', { name: name(v.end.identifiedId!) })}</Text>
            {v.end.guess && <Text testID="guess-line" style={[st.body, { textAlign: 'center' }]}>{B('liarGuessed', { name: v.candidates!.find((c) => c.key === v.end!.guess)!.name![lang] })}</Text>}
            <Box><Secret v={v} lang={lang} /></Box>
            <Cards v={v} lang={lang} name={name} face={face} tally={v.end.tally} liarId={v.end.liarId} />
            <Box>
              {Object.entries(v.end.votes).map(([from, to]) => (
                <Text key={from} style={st.small}>{name(from)} {L('votedFor', { name: name(to) })}</Text>
              ))}
            </Box>
            <Box>
              <Text style={st.h3}>{B('candidatesTitle')}</Text>
              <View style={st.wrap}>
                {v.candidates!.map((c) => (
                  <View key={c.key} style={{ width: '31%', gap: 2 }}>
                    <Pic scene={c.key} />
                    <Text style={st.statusName}>{c.name![lang]}</Text>
                  </View>
                ))}
              </View>
            </Box>
            <Text style={st.body}>{B('noteB')}</Text>
            <Big testID="replay" label={L('replay')} onPress={() => { setPanel(null); setGame(make()); }} />
            <Big testID="menu" kind="secondary" label={L('menu')} onPress={() => router.replace('/')} />
            {QA_ENABLED && <Debug game={game} lang={lang} name={name} />}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Pick(props: { v: ViewB; lang: Lang; act: (a: HB) => void; name: (id: string) => string }) {
  const { v, lang, act, name } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const [sel, setSel] = useState<CardId | null>(null);
  const locked = v.myPick;
  return (
    <>
      <Text style={st.h2}>{sb(lang, 'prompt')}</Text>
      <StatusRow v={v} lang={lang} name={name} />
      <View style={st.grid} accessibilityRole="radiogroup">
        {v.cards.map((c) => {
          const chosen = (locked ?? sel) === c;
          return (
            <Pressable
              key={c}
              testID={'card-' + c}
              accessibilityRole="radio"
              accessibilityState={{ selected: chosen, disabled: !!locked }}
              accessibilityLabel={CARD_LABEL[c][lang] + (chosen ? ', ' + L('selected') : '')}
              disabled={!!locked}
              onPress={() => setSel(c)}
              style={[st.card, chosen && st.cardOn, !!locked && !chosen && { opacity: 0.55 }]}
            >
              <Image source={CARD_IMAGES[c]} style={{ width: 76, height: 76 }} resizeMode="contain" />
              <Text style={st.cardLabel}>{CARD_LABEL[c][lang]}</Text>
              <Text style={st.cardNote}>{chosen ? '✓ ' + L('selected') : ' '}</Text>
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

function Vote(props: { v: ViewB; lang: Lang; act: (a: HB) => void; name: (id: string) => string; face: (id: string, n: number) => ReactElement }) {
  const { v, lang, act, name } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  const [sel, setSel] = useState<string | null>(null);
  return (
    <>
      <Text style={st.h2}>{L('voteTitle')}</Text>
      <Text style={st.body}>{L('votePrompt')}</Text>
      <Text style={[st.small, { color: C.amber }]}>{L('tieRule')}</Text>
      <Text style={st.small}>{sb(lang, 'rule3')}</Text>
      <Cards v={v} lang={lang} name={name} face={props.face} compact />
      {v.myVote ? (
        <>
          <Text testID="vote-locked" style={st.notice}>{L('voteWait')}</Text>
          <StatusRow v={v} lang={lang} name={name} />
        </>
      ) : (
        <>
          {v.players.filter((p) => p.id !== v.me).map((p) => (
            <Pressable key={p.id} testID={'vote-' + p.id} accessibilityRole="radio" accessibilityState={{ selected: sel === p.id }} onPress={() => setSel(p.id)} style={[st.voteRow, sel === p.id && st.cardOn]}>
              {props.face(p.id, 44)}
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

function Guess(props: { v: ViewB; lang: Lang; act: (a: HB) => void; name: (id: string) => string; face: (id: string, n: number) => ReactElement; liarId: string }) {
  const { v, lang, act, name } = props;
  const B = (k: KeyB, p?: Record<string, string | number>) => sb(lang, k, p);
  const [sel, setSel] = useState<SceneId | null>(null);
  const mine = v.role === 'liar';
  const idx = (k: SceneId) => v.candidates!.findIndex((c) => c.key === k) + 1;
  return (
    <>
      <Text style={st.h2}>{mine ? B('caughtYou') : B('waitGuess', { name: name(props.liarId) })}</Text>
      {mine && <Text style={st.body}>{B('guessHelp')}</Text>}
      <Cards v={v} lang={lang} name={name} face={props.face} compact />
      {v.candidates!.map((c, i) => (
        <Pressable key={c.key} testID={'guess-' + (i + 1)} disabled={!mine} accessibilityRole="radio" accessibilityState={{ selected: sel === c.key }} onPress={() => setSel(c.key)} style={[st.box, sel === c.key && st.cardOn]}>
          <Text style={st.h3}>{B('pictureN', { n: i + 1 })}{sel === c.key ? '  ✓' : ''}</Text>
          <Pic scene={c.key} />
        </Pressable>
      ))}
      {mine && <Big testID="confirm-guess" disabled={!sel} label={sel ? B('confirmGuess', { n: idx(sel) }) : B('guessHelp')} onPress={() => sel && act({ type: 'guess', scene: sel })} />}
    </>
  );
}

/** Detectives (and everyone at the result) see the secret picture; the Liar sees only the category. */
function Secret(props: { v: ViewB; lang: Lang }) {
  const { v, lang } = props;
  const L = (k: Key, p?: Record<string, string | number>) => str(lang, k, p);
  if (v.secret) {
    return (
      <View style={{ gap: 6 }}>
        <Text style={st.h3}>{v.secret.name ? sb(lang, 'secretWas', { name: v.secret.name[lang] }) : L('detBrief')}</Text>
        <Pic scene={v.secret.key} testID="scene" />
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

function Pic(props: { scene: SceneId; testID?: string }) {
  return (
    <View style={{ width: '100%', aspectRatio: 800 / 560, borderRadius: 8, overflow: 'hidden' }}>
      <Image testID={props.testID} source={SCENE_IMAGES_B[props.scene]} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="contain" />
    </View>
  );
}

function StatusRow(props: { v: ViewB; lang: Lang; name: (id: string) => string }) {
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

function Cards(props: { v: ViewB; lang: Lang; name: (id: string) => string; face: (id: string, n: number) => ReactElement; compact?: boolean; tally?: Record<string, number>; liarId?: string }) {
  const { v, lang, name } = props;
  const L = (k: Key) => str(lang, k);
  if (!v.reveal) return null;
  return (
    <Box>
      <View style={st.wrap}>
        {v.players.map((p) => {
          const c = v.reveal![p.id];
          return (
            <View key={p.id} testID={'choices-' + p.id} style={[st.row, { width: '48%', gap: 6 }]}>
              {props.face(p.id, props.compact ? 30 : 40)}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={st.statusName} numberOfLines={1}>
                  {name(p.id)}
                  {props.liarId === p.id ? ' — ' + L('liarTag') : ''}
                  {props.tally ? ' · ' + props.tally[p.id] : ''}
                </Text>
                <View style={[st.mini, { alignSelf: 'flex-start' }]}>
                  {!props.compact && <Image source={CARD_IMAGES[c]} style={{ width: 30, height: 30 }} />}
                  <Text style={st.miniText}>{CARD_LABEL[c][lang]}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Box>
  );
}

function Debug(props: { game: StateB; lang: Lang; name: (id: string) => string }) {
  const [open, setOpen] = useState(false);
  const { game, lang, name } = props;
  return (
    <>
      <Big testID="debug" kind="ghost" label={str(lang, 'debug') + (open ? ' ▲' : ' ▼')} onPress={() => setOpen(!open)} />
      {open && (
        <Box>
          {game.log.map((l, i) => (
            <Text key={i} style={st.small}>
              {name(l.pid)} · {l.step}{l.card ? ' · ' + CARD_LABEL[l.card][lang] : ''}{l.target ? ' → ' + name(l.target) : ''}{l.scene ? ' → ' + l.scene : ''}: {sb(lang, l.reason.code as KeyB, l.reason.p)}
              {l.reason.p?.tied ? str(lang, 'tiedPick', { n: l.reason.p.tied }) : ''}
            </Text>
          ))}
        </Box>
      )}
    </>
  );
}
