import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { commentLines, getLocation } from '../engine/content';
import type { Lang } from '../engine/types';
import type { View as GView, ViewCard } from '../engine/view';
import { AWARD_TEXT, INTRO_CARDS, QUESTIONS, t } from '../lib/i18n';
import { haptic, play } from '../lib/sound';
import { C, F } from '../lib/theme';
import { Btn, Face, Inspector, lineText, moodFor, Paper, s as us, Shake, Slam, Small, Title, Tr } from './ui';

export interface PhaseProps {
  v: GView;
  lang: Lang;
  send: (a: any) => void;
  offset: number;
}

const P = (v: GView, id?: string) => v.players.find((p) => p.id === id);
const nameOf = (v: GView, id?: string) => P(v, id)?.name ?? '?';
const FaceOf = ({ v, id, size }: { v: GView; id?: string; size?: number }) => {
  const p = P(v, id);
  return <Face suspectId={p?.suspectId} emoji={p?.emoji} size={size} />;
};

function ReadyButton({ v, lang, send, label, disabled }: PhaseProps & { label?: string; disabled?: boolean }) {
  const me = P(v, v.me);
  const waiting = v.players.filter((p) => !p.bot && p.connected && !p.ready).length;
  if (me?.ready) return <Small style={{ marginTop: 12 }}>⏳ {t(lang, 'waitingOthers')} ({waiting})</Small>;
  return <Btn big label={label ?? t(lang, 'continue')} disabled={disabled} onPress={() => send({ type: 'ready' })} style={{ marginTop: 14 }} />;
}

// ---------------- Intro (multiplayer, first game) ----------------
export function Intro(p: PhaseProps) {
  const [i, setI] = useState(0);
  const last = i === INTRO_CARDS.length - 1;
  const me = P(p.v, p.v.me);
  return (
    <View style={{ alignItems: 'center', gap: 16, paddingTop: 20 }}>
      <Small>{t(p.lang, 'howToPlay')} · {i + 1}/4</Small>
      <Slam key={i}>
        <Paper style={{ minHeight: 160, justifyContent: 'center' }} tilt={i % 2 ? 1 : -1}>
          <Text style={[st.big, { color: C.ink }]}>{INTRO_CARDS[i][p.lang]}</Text>
        </Paper>
      </Slam>
      {me?.ready ? (
        <ReadyButton {...p} />
      ) : (
        <Btn big style={{ alignSelf: 'stretch' }} label={last ? t(p.lang, 'gotIt') : t(p.lang, 'next')} onPress={() => (last ? p.send({ type: 'ready' }) : setI(i + 1))} />
      )}
      {!last && !me?.ready && <Btn kind="ghost" label={t(p.lang, 'skip')} onPress={() => p.send({ type: 'ready' })} />}
    </View>
  );
}

// ---------------- Case file ----------------
export function Case(p: PhaseProps) {
  const { v, lang } = p;
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const liar = v.role === 'liar';
  const loc = v.locationId ? getLocation(v.locationId) : null;
  const allFlipped = flipped.every(Boolean);
  const labels = [t(lang, 'sight'), t(lang, 'sound'), t(lang, 'smell')];
  const key = liar ? 'inspector.caseStartLiar' : 'inspector.caseStartDetective';
  return (
    <View style={{ gap: 12 }}>
      <Inspector text={lineText(v.line, lang, key)} mood="suspicious" compact />
      <Slam sound="stamp">
        <View style={{ alignItems: 'center' }}>
          <Text style={[st.stamp, { color: liar ? C.red : C.amber, borderColor: liar ? C.red : C.amber }]}>
            {liar ? '🤐 ' + t(lang, 'liar') : '🕵️ ' + t(lang, 'detective')}
          </Text>
        </View>
      </Slam>
      <Paper tilt={-1.5} style={{ alignSelf: 'center', alignItems: 'center', width: 230 }}>
        <Text style={{ fontSize: 54 }}>{liar ? '❓' : loc!.emoji}</Text>
        {liar ? (
          <Text style={[st.polaroid, { color: C.red }]}>{t(lang, 'youWerent')}</Text>
        ) : (
          <Tr lang={lang} text={loc!.fullName} style={st.polaroid} />
        )}
      </Paper>
      {liar && (
        <Paper style={{ backgroundColor: C.manila }}>
          <Text style={st.label}>{t(lang, 'yourHint')}</Text>
          <Tr lang={lang} text={v.hint ?? ''} style={[st.big, { fontSize: 18, color: C.ink }]} />
        </Paper>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {labels.map((label, i) => (
          <Pressable
            key={i}
            onPress={() => {
              if (liar) return;
              play('whoosh', 0.3);
              setFlipped((f) => f.map((x, j) => (j === i ? true : x)));
            }}
            style={[st.tile, flipped[i] && !liar ? { backgroundColor: C.paper } : null, !flipped[i] && !liar ? st.pulse : null]}
          >
            <Text style={st.tileLabel}>{label}</Text>
            {liar ? (
              <Text style={[st.redacted]}>REDACTED</Text>
            ) : flipped[i] ? (
              <Tr lang={lang} text={loc!.clues[i]} style={st.clue} />
            ) : (
              <Text style={{ fontSize: 30, textAlign: 'center', marginTop: 10 }}>👆</Text>
            )}
          </Pressable>
        ))}
      </View>
      {lang === 'es' && <Small>👆 {t(lang, 'holdToTranslate')}</Small>}
      <ReadyButton {...p} disabled={!liar && !allFlipped} label={!liar && !allFlipped ? t(lang, 'tapClues') : t(lang, 'startInterrogation')} />
    </View>
  );
}

// ---------------- Hot seat: pick ----------------
export function Pick(p: PhaseProps) {
  const { v, lang, send } = p;
  const ex = v.current!;
  const mine = ex.askerId === v.me;
  const [target, setTarget] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  if (!mine) return <Spotlight {...p} />;
  if (sent) return <Small style={{ marginTop: 30 }}>✓</Small>;
  if (!target) {
    return (
      <View style={{ gap: 12 }}>
        <Title>{t(lang, 'pickWho')}</Title>
        <View style={st.grid}>
          {(v.allowedTargets ?? []).map((id) => (
            <Pressable
              key={id}
              style={({ pressed }) => [st.faceBtn, pressed && { transform: [{ scale: 0.96 }] }]}
              onPress={() => {
                play('tap', 0.4);
                haptic('light');
                setTarget(id);
              }}
            >
              <FaceOf v={v} id={id} size={78} />
              <Text style={st.faceName}>{nameOf(v, id)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={{ gap: 12, alignItems: 'stretch' }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <FaceOf v={v} id={target} size={84} />
        <Text style={st.faceName}>🔦 {nameOf(v, target)}</Text>
      </View>
      <Title style={{ fontSize: 22 }}>{t(lang, 'pickQuestion')}</Title>
      {(ex.topicChoices ?? []).map((topic) => (
        <Btn
          key={topic}
          kind="secondary"
          label={QUESTIONS[topic][lang]}
          onPress={() => {
            setSent(true);
            send({ type: 'pickTarget', targetId: target, topic });
          }}
        />
      ))}
      <Btn kind="ghost" label="↩" onPress={() => setTarget(null)} />
    </View>
  );
}

/** While a bot/another player chooses: a spotlight sweeps across the suspects. */
function Spotlight({ v, lang }: PhaseProps) {
  const ids = v.players.map((x) => x.id);
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % ids.length), 260);
    play('drumroll', 0.25);
    return () => clearInterval(id);
  }, [ids.length]);
  return (
    <View style={{ alignItems: 'center', gap: 16, marginTop: 10 }}>
      <Text style={st.big}>{t(lang, 'choosing', { a: nameOf(v, v.current?.askerId) })}</Text>
      <View style={st.grid}>
        {v.players.map((pl, j) => (
          <View key={pl.id} style={[st.faceBtn, j === i && st.lit]}>
            <Face suspectId={pl.suspectId} emoji={pl.emoji} size={60} dim={j !== i} />
            <Text style={st.faceName}>{pl.id === v.me ? `${pl.name} (${t(lang, 'you')})` : pl.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------- Hot seat: answer ----------------
export function Answer(p: PhaseProps) {
  const { v, lang, send } = p;
  const ex = v.current!;
  const mine = ex.targetId === v.me;
  const [chosen, setChosen] = useState<string | null>(null);
  const q = ex.topic ? QUESTIONS[ex.topic][lang] : '';
  return (
    <View style={{ gap: 10 }}>
      <HotSeatHeader {...p} />
      <Title style={{ fontSize: 23 }}>{q}</Title>
      {mine ? (
        <>
          <Small>{t(lang, v.role === 'liar' ? 'liarGrilled' : 'youAreGrilled')}</Small>
          {v.role === 'liar' && v.hint && (
            <Paper style={{ backgroundColor: C.manila, padding: 10 }}>
              <Text style={[st.label, { marginBottom: 0 }]}>{t(lang, 'yourHint')} <Text style={{ fontWeight: '400' }}>{v.hint}</Text></Text>
            </Paper>
          )}
          <View style={{ gap: 8 }}>
            {(ex.options ?? []).map((o) => (
              <OptionCard
                key={o.id}
                card={o}
                lang={lang}
                chosen={chosen === o.id}
                disabled={!!chosen}
                onPress={() => {
                  setChosen(o.id);
                  play('thud', 0.5);
                  haptic('medium');
                  send({ type: 'answer', cardId: o.id });
                }}
              />
            ))}
          </View>
          {lang === 'es' && <Small>👆 {t(lang, 'holdToTranslate')}</Small>}
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: 10, marginTop: 6 }}>
          <Lamp>
            <FaceOf v={v} id={ex.targetId} size={130} />
          </Lamp>
          <Text style={st.big}>{t(lang, 'thinking', { b: nameOf(v, ex.targetId) })}</Text>
        </View>
      )}
    </View>
  );
}

function OptionCard(props: { card: ViewCard; lang: Lang; chosen: boolean; disabled: boolean; onPress: () => void }) {
  const { card } = props;
  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        st.option,
        props.chosen && { borderColor: C.amber, borderWidth: 3, backgroundColor: '#fff6df' },
        props.disabled && !props.chosen && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {card.joker && <Text style={st.jokerTag}>🃏 JOKER</Text>}
      <Tr lang={props.lang} text={card.text} style={st.optionText} />
      {card.real != null && (
        <Text style={st.heat}>{card.real ? '📍' + '🔥'.repeat(card.heat ?? 1) : ''}</Text>
      )}
      {props.chosen && <Text style={st.sent}>✓</Text>}
    </Pressable>
  );
}

function Lamp(props: { children: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 28, marginBottom: -6 }}>💡</Text>
      <View style={st.cone} />
      <View style={{ marginTop: -96 }}>{props.children}</View>
    </View>
  );
}

function HotSeatHeader({ v, lang }: PhaseProps) {
  const ex = v.current;
  if (!ex?.targetId) return null;
  const a = ex.askerId === v.me ? `${nameOf(v, ex.askerId)} (${t(lang, 'you')})` : nameOf(v, ex.askerId);
  const b = ex.targetId === v.me ? `${nameOf(v, ex.targetId)} (${t(lang, 'you')})` : nameOf(v, ex.targetId);
  return (
    <View style={st.banner}>
      <Text style={st.bannerText}>🔦 {t(lang, 'isGrilling', { a, b })}</Text>
    </View>
  );
}

// ---------------- Hot seat: react ----------------
export function React_(p: PhaseProps) {
  const { v, lang, send } = p;
  const ex = v.current!;
  const target = P(v, ex.targetId);
  const mine = ex.targetId === v.me;
  const [mineReaction, setMine] = useState<string | null>(null);
  const reacted = ex.reactions[v.me] ?? mineReaction;
  const susCount = Object.values(ex.reactions).filter((r) => r === 'sus').length;
  const prevSus = useRef(0);
  useEffect(() => {
    if (susCount >= 2 && prevSus.current < 2) play('ooh', 0.45);
    prevSus.current = susCount;
  }, [susCount]);
  const quip = ex.quip ? lineText(ex.quip, lang) : '';
  return (
    <View style={{ gap: 10 }}>
      <HotSeatHeader {...p} />
      <Slam sound="thud">
        <Paper tilt={-1}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Face suspectId={target?.suspectId} emoji={target?.emoji} size={36} />
            <Text style={{ fontWeight: '700', color: C.ink }}>{target?.name}</Text>
          </View>
          <Text style={st.qSmall}>{ex.topic ? QUESTIONS[ex.topic][lang].toUpperCase() : ''}</Text>
          {ex.picked?.joker && <Text style={st.jokerTag}>🃏 JOKER</Text>}
          <TypeText text={ex.picked?.text ?? ''} lang={lang} />
          {ex.timedOut && <Text style={{ color: C.red, fontStyle: 'italic', marginTop: 4 }}>{t(lang, 'stammers')}</Text>}
        </Paper>
      </Slam>
      {!!quip && (
        <View style={st.quip}>
          <Text style={st.quipText}>“{quip}”</Text>
        </View>
      )}
      <View style={st.reactions}>
        {Object.entries(ex.reactions).map(([id, r]) => (
          <Slam key={id} sound={null}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 30 }}>{r === 'sus' ? '🤨' : '😇'}</Text>
              <Text style={st.tiny}>{nameOf(v, id)}</Text>
            </View>
          </Slam>
        ))}
      </View>
      {mine ? (
        <Small>{t(lang, 'judging')}</Small>
      ) : reacted ? (
        <Small>{reacted === 'sus' ? '🤨' : '😇'} ✓</Small>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn style={{ flex: 1 }} kind="danger" big label={t(lang, 'sus')} onPress={() => { setMine('sus'); send({ type: 'react', reaction: 'sus' }); }} />
          <Btn style={{ flex: 1 }} kind="secondary" big label={t(lang, 'legit')} onPress={() => { setMine('legit'); send({ type: 'react', reaction: 'legit' }); }} />
        </View>
      )}
    </View>
  );
}

function TypeText({ text, lang }: { text: string; lang: Lang }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const step = Math.max(1, Math.ceil(text.length / 30));
    const id = setInterval(() => setN((x) => (x >= text.length ? (clearInterval(id), x) : x + step)), 30);
    return () => clearInterval(id);
  }, [text]);
  if (n >= text.length) return <Tr lang={lang} text={text} style={st.answer} />;
  return <Text style={st.answer}>{text.slice(0, n)}</Text>;
}

// ---------------- Vote ----------------
export function Vote(p: PhaseProps) {
  const { v, lang, send } = p;
  const [mine, setMine] = useState<string | null>(null);
  const voted = v.myVote ?? mine;
  return (
    <View style={{ gap: 12 }}>
      <Inspector text={lineText(v.line, lang)} mood="suspicious" compact />
      <Title>☝️ {t(lang, 'vote')}</Title>
      <View style={st.grid}>
        {v.players
          .filter((x) => x.id !== v.me)
          .map((x) => (
            <Pressable
              key={x.id}
              disabled={!!voted}
              onPress={() => {
                setMine(x.id);
                play('stamp', 0.4);
                haptic('medium');
                send({ type: 'vote', targetId: x.id });
              }}
              style={({ pressed }) => [st.faceBtn, voted === x.id && st.lit, pressed && { transform: [{ scale: 0.96 }] }, voted && voted !== x.id ? { opacity: 0.5 } : null]}
            >
              <Face suspectId={x.suspectId} emoji={x.emoji} size={74} />
              <Text style={st.faceName}>{x.name}</Text>
              <SusBar n={x.suspicion} />
            </Pressable>
          ))}
      </View>
      {voted && <Small>{t(lang, 'voted')}</Small>}
    </View>
  );
}

function SusBar({ n }: { n: number }) {
  return <Text style={{ fontSize: 12 }}>{'🤨'.repeat(Math.min(n, 6))}</Text>;
}

// ---------------- Fingers (vote reveal) ----------------
export function Fingers(p: PhaseProps) {
  const { v, lang } = p;
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) {
      play('ooh', 0.5);
      return;
    }
    play('tick', 0.5);
    const id = setTimeout(() => setCount((c) => c - 1), 650);
    return () => clearTimeout(id);
  }, [count]);
  if (count > 0)
    return (
      <View style={{ alignItems: 'center', marginTop: 60 }}>
        <Slam key={count}>
          <Text style={{ fontFamily: F.type, fontSize: 120, color: C.manila }}>{count}</Text>
        </Slam>
      </View>
    );
  const tally: Record<string, string[]> = {};
  for (const [voter, target] of Object.entries(v.votes ?? {})) (tally[target] ??= []).push(voter);
  const order = v.players.slice().sort((a, b) => (tally[b.id]?.length ?? 0) - (tally[a.id]?.length ?? 0));
  const acc = P(v, v.accusedId);
  return (
    <View style={{ gap: 10 }}>
      {v.accusedId && acc?.bot && v.line ? <Inspector text={`${acc.name}: “${lineText(v.line, lang)}”`} mood="shocked" compact /> : null}
      {v.tie && <Inspector text={t(lang, 'tie')} mood="shocked" compact />}
      {order.map((x) => (
        <Slam key={x.id} sound={null}>
          <View style={[st.row, x.id === v.accusedId && { borderColor: C.red, borderWidth: 2 }]}>
            <Face suspectId={x.suspectId} emoji={x.emoji} size={44} />
            <Text style={[st.faceName, { flex: 1, textAlign: 'left' }]}>{x.name}</Text>
            <Text style={{ fontSize: 22 }}>{'☝️'.repeat(tally[x.id]?.length ?? 0)}</Text>
          </View>
          {(tally[x.id] ?? []).length > 0 && <Text style={[st.tiny, { marginLeft: 56 }]}>← {(tally[x.id] ?? []).map((id) => nameOf(v, id)).join(', ')}</Text>}
        </Slam>
      ))}
    </View>
  );
}

// ---------------- Objection ----------------
export function Objection(p: PhaseProps) {
  const { v, lang, send } = p;
  const mine = v.accusedId === v.me;
  const excuses = commentLines('objection.excuses');
  const [sent, setSent] = useState(false);
  useEffect(() => {
    play('objection', 0.6);
    haptic('heavy');
  }, []);
  return (
    <View style={{ gap: 12 }}>
      <Shake trigger={v.phaseAt}>
        <Slam>
          <Text style={st.objection}>{t(lang, 'objection')}</Text>
        </Slam>
      </Shake>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <FaceOf v={v} id={v.accusedId} size={90} />
        <Text style={st.faceName}>{nameOf(v, v.accusedId)}</Text>
      </View>
      {v.excuseIdx != null ? (
        <>
          <Slam sound="whoosh">
            <Paper tilt={1}>
              <Text style={[st.big, { color: C.ink, fontSize: 22 }]}>“{(excuses[v.excuseIdx] as any)?.[lang] ?? excuses[v.excuseIdx]?.en}”</Text>
            </Paper>
          </Slam>
          <Inspector text={lineText(v.line, lang)} mood="smug" compact />
        </>
      ) : mine ? (
        <>
          <Small>{t(lang, 'pickExcuse')}</Small>
          {(v.excuseChoices ?? []).map((i) => (
            <Btn
              key={i}
              kind="secondary"
              disabled={sent}
              label={(excuses[i] as any)?.[lang] ?? excuses[i]?.en}
              onPress={() => {
                setSent(true);
                send({ type: 'excuse', idx: i });
              }}
            />
          ))}
        </>
      ) : (
        <Small>{t(lang, 'isAccused', { a: nameOf(v, v.accusedId) })}</Small>
      )}
    </View>
  );
}

// ---------------- Reveal ----------------
export function Reveal(p: PhaseProps) {
  const { v, lang } = p;
  const liar = P(v, v.liarId);
  const mug = commentLines(v.caught ? 'mugshot.chargeFallback' : 'mugshot.escapedLine');
  const decoy = [...v.history].reverse().find((ex) => ex.targetId === v.liarId && ex.picked && ex.picked.real === false);
  const charge = v.caught
    ? decoy
      ? (lang === 'es' ? 'ACUSADO DE: decir ' : 'CHARGED WITH: saying ') + `“${decoy.picked!.text}”`
      : (mug[0] as any)?.[lang] ?? mug[0]?.en
    : (mug[(v.phaseAt / 1000) % mug.length | 0] as any)?.[lang] ?? mug[0]?.en;
  useEffect(() => {
    play(v.caught ? 'ding' : 'buzzer', 0.5);
    haptic(v.caught ? 'success' : 'error');
  }, [v.caught]);
  return (
    <View style={{ gap: 12 }}>
      <Inspector text={lineText(v.line, lang)} mood={moodFor(v.line?.key)} compact />
      <Paper style={st.mugshot}>
        <View style={st.heightLines} />
        <Small style={{ color: C.ink }}>{t(lang, 'liarWas')}</Small>
        <Face suspectId={liar?.suspectId} emoji={liar?.emoji} size={110} ring={C.ink} />
        <Text style={[st.faceName, { color: C.ink, fontSize: 18 }]}>{liar?.name}{liar?.id === v.me ? ` (${t(lang, 'you')})` : ''}</Text>
        <Slam delay={500} sound="stamp">
          <Text style={[st.stamp, { color: C.red, borderColor: C.red, fontSize: 26 }]}>
            {v.caught ? t(lang, 'caught') : t(lang, 'stillAtLarge')}
          </Text>
        </Slam>
        <Text style={{ color: C.ink, textAlign: 'center', marginTop: 6, fontFamily: F.type }}>{charge}</Text>
      </Paper>
      {v.history.map((ex, i) => (
        <View key={i} style={[st.row, ex.picked?.real === false && { borderColor: C.red, borderWidth: 2 }]}>
          <Face suspectId={P(v, ex.targetId)?.suspectId} emoji={P(v, ex.targetId)?.emoji} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={st.tiny}>{nameOf(v, ex.targetId)}</Text>
            <Text style={{ color: C.manila }}>{ex.picked?.text}</Text>
            {ex.picked?.real === false && <Text style={{ color: C.red, fontWeight: '800', fontSize: 12 }}>❌ {lang === 'es' ? 'NO ES DE AQUÍ' : 'NOT FROM HERE'}</Text>}
          </View>
        </View>
      ))}
      <ReadyButton {...p} />
    </View>
  );
}

// ---------------- Liar's last guess ----------------
export function Guess(p: PhaseProps) {
  const { v, lang, send } = p;
  const mine = v.liarId === v.me;
  const [sent, setSent] = useState<string | null>(null);
  return (
    <View style={{ gap: 12 }}>
      <Title style={{ fontSize: 22 }}>{mine ? t(lang, 'lastChance') : t(lang, 'liarGuessing', { a: nameOf(v, v.liarId) })}</Title>
      <View style={st.grid}>
        {(v.guessChoices ?? []).map((id) => {
          const l = getLocation(id);
          return (
            <Pressable
              key={id}
              disabled={!mine || !!sent}
              onPress={() => {
                setSent(id);
                play('drumroll', 0.4);
                send({ type: 'guess', locationId: id });
              }}
              style={({ pressed }) => [st.locBtn, sent === id && st.lit, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <Text style={{ fontSize: 40 }}>{l.emoji}</Text>
              <Text style={[st.faceName, { color: C.ink }]}>{l.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------- Round result ----------------
export function Result(p: PhaseProps) {
  const { v, lang } = p;
  const loc = getLocation(v.locationId!);
  const fact = loc.facts[v.factIdx ?? 0];
  const liar = P(v, v.liarId);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  return (
    <View style={{ gap: 12 }}>
      {v.line && <Inspector text={lineText(v.line, lang)} mood={moodFor(v.line.key)} compact />}
      <Small>{t(lang, 'thePlaceWas')}</Small>
      <Slam sound="whoosh">
        <Paper tilt={-1.5} style={{ alignSelf: 'center', alignItems: 'center', width: 240 }}>
          <Text style={{ fontSize: 54 }}>{loc.emoji}</Text>
          <Text style={st.polaroid}>{loc.fullName}</Text>
          {lang === 'es' && loc.nameEn ? <Text style={{ color: '#6b5a3a', fontStyle: 'italic', textAlign: 'center' }}>{loc.nameEn}</Text> : null}
        </Paper>
      </Slam>
      {v.caught && v.guessId && (
        <Small style={{ color: v.guessId === v.locationId ? C.green : C.red, fontSize: 15 }}>
          {liar?.name} {v.guessId === v.locationId ? t(lang, 'guessedRight') : `${t(lang, 'guessedWrong')} (${getLocation(v.guessId).name})`}
        </Small>
      )}
      {fact && (
        <Paper style={{ backgroundColor: C.manila }}>
          <Text style={st.label}>💡 {t(lang, 'didYouKnow')}</Text>
          <Text style={{ color: C.ink, fontSize: 15 }}>{lang === 'es' ? fact.es : fact.en}</Text>
          {lang === 'es' && fact.en ? <Text style={{ color: '#6b5a3a', fontStyle: 'italic', marginTop: 4 }}>{fact.en}</Text> : null}
        </Paper>
      )}
      {lang === 'es' && loc.vocab && (
        <View style={{ gap: 6 }}>
          <Text style={[st.label, { color: C.amber }]}>{t(lang, 'wordsOfCase')}</Text>
          <Small>{t(lang, 'tapToFlip')}</Small>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {loc.vocab.map((w, i) => (
              <Pressable key={i} onPress={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))} style={st.vocab}>
                <Text style={{ color: C.ink, fontWeight: '700', fontStyle: flipped[i] ? 'italic' : 'normal' }}>{flipped[i] ? w.en : w.es}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <Scores {...p} />
      <ReadyButton {...p} />
    </View>
  );
}

function Scores({ v, lang }: PhaseProps) {
  const order = v.players.slice().sort((a, b) => b.score - a.score);
  return (
    <View style={{ gap: 6 }}>
      {order.map((x) => {
        const d = v.deltas?.[x.id];
        return (
          <View key={x.id} style={st.row}>
            <Face suspectId={x.suspectId} emoji={x.emoji} size={34} />
            <Text style={[st.faceName, { flex: 1, textAlign: 'left' }]}>{x.name}{x.id === v.me ? ` (${t(lang, 'you')})` : ''}</Text>
            {d && d.pts > 0 && <Text style={{ color: C.green, fontWeight: '800' }}>+{d.pts}</Text>}
            <Text style={{ color: C.amber, fontWeight: '800', width: 54, textAlign: 'right' }}>{x.score}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------- Game over ----------------
export function GameOver(p: PhaseProps & { onMenu: () => void }) {
  const { v, lang, send } = p;
  const winner = v.players.slice().sort((a, b) => b.score - a.score)[0];
  const shareText = useMemo(() => {
    const aw = (v.awards ?? []).map((a) => `${AWARD_TEXT[a.id]?.[lang].split(' —')[0]}: ${nameOf(v, a.playerId)}`).join('\n');
    return `🕵️ ALIBI — ${t(lang, 'caseClosed')}\n🏆 ${winner?.name} (${winner?.score})\n${aw}\n${lang === 'es' ? '¿Puedes atrapar al Mentiroso?' : 'Can you catch the Liar?'}`;
  }, [v, lang, winner]);
  useEffect(() => {
    play('ding', 0.5);
  }, []);
  return (
    <View style={{ gap: 12 }}>
      <Inspector text={lineText(v.line, lang)} mood="smug" compact />
      <Title>🏁 {t(lang, 'caseClosed')}</Title>
      <Scores {...p} />
      {(v.awards ?? []).map((a, i) => (
        <Slam key={a.id} delay={300 + i * 350} sound="stamp">
          <View style={[st.row, { borderColor: C.amber, borderWidth: 1 }]}>
            <Text style={{ fontSize: 22 }}>🏆</Text>
            <Text style={{ color: C.manila, flex: 1, fontWeight: '700' }}>{AWARD_TEXT[a.id]?.[lang]}</Text>
            <FaceOf v={v} id={a.playerId} size={34} />
            <Text style={st.faceName}>{nameOf(v, a.playerId)}</Text>
          </View>
        </Slam>
      ))}
      <Btn big label={t(lang, 'rematch')} onPress={() => send({ type: 'rematch' })} />
      <Btn kind="secondary" label={'📤 ' + t(lang, 'share')} onPress={() => Share.share({ message: shareText }).catch(() => {})} />
      <Btn kind="ghost" label={t(lang, 'mainMenu')} onPress={p.onMenu} />
    </View>
  );
}

const st = StyleSheet.create({
  big: { fontFamily: F.type, fontSize: 20, color: C.manila, textAlign: 'center', lineHeight: 27 },
  stamp: { fontFamily: F.type, fontSize: 30, borderWidth: 3, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 6, transform: [{ rotate: '-4deg' }], textAlign: 'center' },
  polaroid: { fontFamily: F.type, fontSize: 19, color: C.ink, textAlign: 'center', marginTop: 6 },
  label: { fontWeight: '800', color: '#7a5a2a', fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  tile: { flex: 1, minHeight: 130, backgroundColor: C.manila, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: C.manilaDark },
  pulse: { borderColor: C.amber, borderWidth: 2 },
  tileLabel: { fontSize: 11, fontWeight: '800', color: '#7a5a2a', textAlign: 'center' },
  clue: { fontSize: 13, color: C.ink, marginTop: 6, lineHeight: 17 },
  redacted: { marginTop: 30, textAlign: 'center', color: C.red, fontWeight: '900', borderWidth: 2, borderColor: C.red, transform: [{ rotate: '-8deg' }], fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  faceBtn: { alignItems: 'center', gap: 4, padding: 8, borderRadius: 12, minWidth: 96, backgroundColor: 'rgba(0,0,0,0.18)' },
  faceName: { color: C.manila, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  lit: { backgroundColor: 'rgba(232,162,58,0.3)', borderColor: C.amber, borderWidth: 2 },
  option: { backgroundColor: C.paper, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: C.manilaDark, flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionText: { flex: 1, color: C.ink, fontSize: 16, lineHeight: 21 },
  heat: { fontSize: 12 },
  jokerTag: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, color: '#8a3fb0', marginBottom: 2 },
  sent: { color: C.green, fontSize: 22, fontWeight: '900' },
  cone: { width: 0, height: 0, borderLeftWidth: 90, borderRightWidth: 90, borderBottomWidth: 130, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(255,214,140,0.16)' },
  banner: { backgroundColor: C.amber, borderRadius: 8, padding: 8 },
  bannerText: { color: C.ink, fontWeight: '800', textAlign: 'center' },
  qSmall: { fontSize: 11, color: '#7a5a2a', fontWeight: '800', letterSpacing: 1 },
  answer: { fontSize: 22, color: C.ink, lineHeight: 29, marginTop: 4 },
  quip: { alignSelf: 'flex-start', backgroundColor: C.slate, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.line },
  quipText: { color: C.manila, fontStyle: 'italic' },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', minHeight: 50 },
  tiny: { color: C.muted, fontSize: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 10, padding: 8 },
  objection: { fontFamily: F.type, fontSize: 52, color: C.red, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 6 },
  mugshot: { alignItems: 'center', gap: 6, backgroundColor: '#d8c9a6' },
  heightLines: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderTopWidth: 0, opacity: 0.25 },
  locBtn: { width: '46%', alignItems: 'center', padding: 14, backgroundColor: C.manila, borderRadius: 10, gap: 4 },
  vocab: { backgroundColor: C.manila, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
});

// keep a reference so unused-style lint doesn't complain on web builds
void us;
void Animated;
