import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Lang } from '../engine/types';
import { t } from '../lib/i18n';
import { reportName, type GameConn } from '../lib/net';
import { isMuted, setMuted } from '../lib/sound';
import { C, F, COL } from '../lib/theme';
import * as Ph from './Phases';
import { Btn, Face, Small, TimerBar } from './ui';

const TIMED = ['pick', 'answer', 'react', 'vote', 'objection', 'guess'];

export function GameScreen(props: { conn: GameConn; lang: Lang; onExit: () => void }) {
  const { conn, lang } = props;
  const v = conn.view;
  const [confirm, setConfirm] = useState(false);
  const [muted, setM] = useState(isMuted());
  const [menu, setMenu] = useState<string | null>(null);
  const [reported, setReported] = useState<Record<string, boolean>>({});
  if (!v) return <Small style={{ marginTop: 60 }}>{t(lang, conn.status === 'reconnecting' ? 'reconnecting' : 'connecting')}</Small>;

  const pp: Ph.PhaseProps = { v, lang, send: conn.send, offset: conn.offset };
  const exit = () => {
    conn.leave();
    props.onExit();
  };
  const body = (() => {
    switch (v.phase) {
      case 'intro': return <Ph.Intro {...pp} />;
      case 'case': return <Ph.Case key={'case' + v.roundIndex} {...pp} />;
      case 'pick': return <Ph.Pick key={'pick' + v.phaseAt} {...pp} />;
      case 'answer': return <Ph.Answer key={'ans' + v.phaseAt} {...pp} />;
      case 'react': return <Ph.React_ key={'re' + v.phaseAt} {...pp} />;
      case 'vote': return <Ph.Vote key={'vote' + v.roundIndex} {...pp} />;
      case 'fingers': return <Ph.Fingers key={'f' + v.roundIndex} {...pp} />;
      case 'objection': return <Ph.Objection key={'o' + v.roundIndex} {...pp} />;
      case 'reveal': return <Ph.Reveal key={'rv' + v.roundIndex} {...pp} />;
      case 'guess': return <Ph.Guess key={'g' + v.roundIndex} {...pp} />;
      case 'result': return <Ph.Result key={'rs' + v.roundIndex} {...pp} />;
      case 'gameover': return <Ph.GameOver key={'go' + v.phaseAt} {...pp} onMenu={exit} />;
      default: return null;
    }
  })();

  return (
    <View style={{ flex: 1 }}>
      <View style={COL}>
      {/* Top bar: always a way home */}
      <View style={st.top}>
        <Pressable accessibilityLabel="Main menu" onPress={() => setConfirm(true)} style={st.iconBtn}>
          <Text style={st.icon}>🏠</Text>
        </Pressable>
        <Text style={st.round}>
          {v.phase === 'gameover' ? t(lang, 'caseClosed') : `${t(lang, 'round')} ${Math.min(v.roundIndex + 1, v.rounds)}/${v.rounds}`}
        </Text>
        <Pressable
          accessibilityLabel="Sound"
          onPress={() => {
            setMuted(!muted);
            setM(!muted);
          }}
          style={st.iconBtn}
        >
          <Text style={st.icon}>{muted ? '🔇' : '🔊'}</Text>
        </Pressable>
      </View>
      {/* Suspects strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.strip}>
        {v.players.map((p) => (
          <Pressable
            key={p.id}
            disabled={p.bot || p.id === v.me || v.settings.practice}
            onPress={() => setMenu(p.id)}
            style={{ alignItems: 'center', width: 62, opacity: p.connected || p.bot ? 1 : 0.35 }}
          >
            <View style={st.susTrack}>
              <View style={[st.susFill, { width: `${Math.min(100, p.suspicion * 22)}%` }]} />
            </View>
            <Face suspectId={p.suspectId} emoji={p.emoji} size={40} ring={v.current?.targetId === p.id ? C.red : C.amber} />
            <Text numberOfLines={1} style={st.stripName}>
              {p.name.split(' ').slice(-1)[0]}
            </Text>
            {p.id === v.me && <Text style={st.you}>({t(lang, 'you')})</Text>}
            {p.ready && ['case', 'reveal', 'result', 'intro'].includes(v.phase) && !p.bot && <Text style={st.you}>✓</Text>}
          </Pressable>
        ))}
      </ScrollView>
      {TIMED.includes(v.phase) && <TimerBar deadline={v.deadline} phaseAt={v.phaseAt} offset={conn.offset} />}
      {conn.status === 'reconnecting' && <Small style={{ color: C.amber }}>⚠️ {t(lang, 'reconnecting')}</Small>}
      {!!v.waitingNames?.length && <Small style={{ marginBottom: 4 }}>⏳ {v.waitingNames.join(', ')} → {t(lang, 'round')} {Math.min(v.roundIndex + 2, v.rounds)}</Small>}
      </View>
      <ScrollView contentContainerStyle={{ ...COL, padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View testID={`phase-${v.phase}`}>{body}</View>
      </ScrollView>

      <Modal transparent visible={!!menu} animationType="fade" onRequestClose={() => setMenu(null)}>
        <View style={st.modalBg}>
          <View style={st.modal}>
            {menu && (
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Face emoji={v.players.find((x) => x.id === menu)?.emoji} size={56} />
                <Text style={st.modalTitle}>{v.players.find((x) => x.id === menu)?.name}</Text>
              </View>
            )}
            <Btn
              kind="secondary"
              disabled={!!(menu && reported[menu])}
              label={menu && reported[menu] ? t(lang, 'reported') : t(lang, 'reportName')}
              onPress={() => {
                const pl = v.players.find((x) => x.id === menu);
                if (pl && menu) {
                  reportName(v.code, pl.name);
                  setReported((r) => ({ ...r, [menu]: true }));
                }
              }}
            />
            {v.me === v.hostId && (
              <Btn
                kind="danger"
                label={t(lang, 'removePlayer')}
                onPress={() => {
                  if (menu) conn.send({ type: 'kick', playerId: menu });
                  setMenu(null);
                }}
              />
            )}
            <Btn kind="ghost" label={t(lang, 'close')} onPress={() => setMenu(null)} />
          </View>
        </View>
      </Modal>

      <Modal transparent visible={confirm} animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={st.modalBg}>
          <View style={st.modal}>
            <Text style={st.modalTitle}>{t(lang, 'leaveConfirm')}</Text>
            <Btn kind="danger" label={t(lang, 'leave')} onPress={exit} />
            <Btn kind="ghost" label={t(lang, 'stay')} onPress={() => setConfirm(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: C.line },
  icon: { fontSize: 20 },
  round: { color: C.manila, fontFamily: F.type, fontSize: 17 },
  strip: { paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  susTrack: { width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 2, marginBottom: 3, overflow: 'hidden' },
  susFill: { height: 4, backgroundColor: C.amber },
  stripName: { color: C.manila, fontSize: 12, marginTop: 2, maxWidth: 60 },
  you: { color: C.muted, fontSize: 11 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: C.slate, borderRadius: 16, padding: 20, gap: 10, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: C.line },
  modalTitle: { color: C.manila, fontFamily: F.type, fontSize: 22, textAlign: 'center', marginBottom: 6 },
});
