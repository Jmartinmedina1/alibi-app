import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { GameScreen } from '../../components/GameScreen';
import { ProfileGate } from '../../components/ProfileGate';
import { Btn, Face, Inspector, Small } from '../../components/ui';
import { Chip } from '../../components/Chip';
import { GameOptions } from '../../components/GameOptions';
import { QR } from '../../components/QR';
import { langForPack, t } from '../../lib/i18n';
import { serverUrl, useRoom, type GameConn } from '../../lib/net';
import { setSavedRoom, type Profile } from '../../lib/profile';
import { C, F, COL } from '../../lib/theme';
import { useLang } from '../../lib/lang';

export default function RoomRoute() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <ProfileGate>{(p) => <Room code={String(code).toUpperCase()} profile={p} />}</ProfileGate>;
}

function Room({ code, profile }: { code: string; profile: Profile }) {
  const conn = useRoom(code, profile);
  const { lang: uiLang } = useLang();
  const v = conn.view;
  const lang = v ? langForPack(v.settings.pack) : uiLang;
  const exit = () => {
    setSavedRoom(null);
    router.replace('/');
  };
  if (conn.status === 'error') {
    return (
      <View style={{ ...COL, padding: 20, gap: 14 }}>
        <Inspector text={t(uiLang, conn.error === 'kicked' ? 'kicked' : 'roomNotFound')} mood="bored" />
        <Btn label={t(uiLang, 'mainMenu')} onPress={exit} />
      </View>
    );
  }
  if (v && v.phase === 'lobby') return <Lobby conn={conn} lang={lang} onExit={() => { conn.leave(); exit(); }} />;
  if (v?.waiting) return <Waiting v={v} lang={lang} onExit={() => { conn.leave(); exit(); }} />;
  return <GameScreen conn={conn} lang={lang} onExit={exit} />;
}

function Lobby({ conn, lang, onExit }: { conn: GameConn; lang: 'en' | 'es'; onExit: () => void }) {
  const v = conn.view!;
  const host = v.me === v.hostId;
  const [sheet, setSheet] = useState(false);
  const [qr, setQr] = useState(false);
  const link = Platform.OS === 'web' && typeof location !== 'undefined' ? `${location.origin}/room/${v.code}` : `${serverUrl()}/room/${v.code}`;
  const set = (settings: any) => conn.send({ type: 'settings', settings });
  const n = v.players.length;
  const enough = n >= 3;
  const s = v.settings;
  const summary = [
    t(lang, 'rounds', { n: String(s.rounds) }),
    t(lang, s.difficulty),
    t(lang, s.joker ? 'jokerOnShort' : 'jokerOffShort'),
    ...(s.pace === 'slow' ? [t(lang, 'paceSlow')] : s.pace === 'normal' ? [t(lang, 'paceNormal')] : []),
  ].join(' · ');
  const invite = () =>
    Share.share({ message: (lang === 'es' ? `¡Juega ALIBI conmigo! Código ${v.code}: ` : `Play ALIBI with me! Code ${v.code}: `) + link }).catch(() => {});

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ ...COL, padding: 16, gap: 12, paddingBottom: 24 }}>
        {/* Header: leave + room code */}
        <View style={st.header}>
          <Pressable onPress={onExit} hitSlop={10}>
            <Text style={{ color: C.manila, fontSize: 15 }}>🏠 {t(lang, 'leave')}</Text>
          </Pressable>
          <Pressable onPress={() => setQr(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityRole="button">
            <View style={st.qrBtn}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: C.ink }}>QR</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={st.codeLabel}>{t(lang, 'roomCode')}</Text>
              <Text style={st.code}>{v.code}</Text>
            </View>
          </Pressable>
        </View>

        {/* Your crew */}
        <Text style={st.section}>
          {t(lang, 'yourCrew')} <Text style={st.sectionSub}>· {t(lang, enough ? 'crewMax' : 'crewMin', { n: String(n) })}</Text>
        </Text>
        <View style={st.crew}>
          {v.players.map((p) => (
            <View key={p.id} style={st.member}>
              <View>
                <Face suspectId={p.suspectId} emoji={p.emoji} size={56} ring={p.id === v.me ? C.amber : C.manilaDark} />
                {p.id === v.hostId && <Text style={st.crown}>👑</Text>}
                {host && p.id !== v.me && (
                  <Pressable onPress={() => conn.send(p.bot ? { type: 'removePlayer', playerId: p.id } : { type: 'kick', playerId: p.id })} style={st.remove} hitSlop={8}>
                    <Text style={{ color: C.ink, fontSize: 11, fontWeight: '900' }}>✕</Text>
                  </Pressable>
                )}
              </View>
              <Text style={st.memberName} numberOfLines={1}>
                {p.id === v.me ? t(lang, 'you') : p.name}
              </Text>
            </View>
          ))}
          {Array.from({ length: Math.max(0, 3 - n) }).map((_, i) => (
            <View key={'empty' + i} style={st.member}>
              <View style={st.emptySeat}>
                <Text style={{ color: C.muted, fontSize: 22 }}>?</Text>
              </View>
              <Text style={[st.memberName, { color: C.muted }]}> </Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn kind="secondary" label={t(lang, 'invite')} onPress={invite} style={{ flex: 1, minHeight: 46, paddingVertical: 10 }} />
          {host && n < 8 && (
            <Btn kind="ghost" label={t(lang, 'bot')} onPress={() => conn.send({ type: 'addBot' })} style={{ flex: 1, minHeight: 46, paddingVertical: 10 }} />
          )}
        </View>

        {/* Choose your case */}
        <Text style={[st.section, { marginTop: 6 }]}>{t(lang, 'chooseCase')}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }} pointerEvents={host ? 'auto' : 'none'}>
          <Chip active={s.pack === 'party'} onPress={() => set({ pack: 'party' })} title={t(lang, 'party')} sub={t(lang, 'partySub')} />
          <Chip active={s.pack === 'espanol'} onPress={() => set({ pack: 'espanol' })} title={t(lang, 'espanol')} sub={t(lang, 'espanolShort')} />
        </View>
        <Pressable
          disabled={!host}
          onPress={() => setSheet(true)}
          style={({ pressed }) => [st.summary, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 20 }}>⚡</Text>
          <Text style={st.summaryText}>{summary}</Text>
          {host && <Text style={{ fontSize: 18 }}>⚙️</Text>}
        </Pressable>
        {!host && <Small>{t(lang, 'hostPicks')}</Small>}
      </ScrollView>

      {/* Sticky start */}
      <View style={st.footer}>
        <View style={{ ...COL, gap: 6, paddingHorizontal: 16 }}>
          {host ? (
            <>
              <Btn big label={t(lang, 'startGame')} disabled={!enough} onPress={() => conn.send({ type: 'start' })} />
              {!enough && <Small>{t(lang, 'needMore', { n: String(3 - n) })}</Small>}
            </>
          ) : (
            <Small style={{ paddingVertical: 14, fontSize: 15 }}>{t(lang, 'waitingHost')}</Small>
          )}
        </View>
      </View>

      {/* QR to join from another phone in the same room */}
      <Modal visible={qr} transparent animationType="fade" onRequestClose={() => setQr(false)}>
        <Pressable style={st.qrBackdrop} onPress={() => setQr(false)}>
          <View style={st.qrCard}>
            <Text style={st.sheetTitle}>{t(lang, 'scanToJoin')}</Text>
            <QR value={link} size={240} />
            <Text style={[st.code, { fontSize: 40 }]}>{v.code}</Text>
            <Small>{t(lang, 'scanSub')}</Small>
            <Btn label={t(lang, 'done')} onPress={() => setQr(false)} style={{ alignSelf: 'stretch' }} />
          </View>
        </Pressable>
      </Modal>

      {/* Case settings bottom sheet */}
      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <Pressable style={st.backdrop} onPress={() => setSheet(false)} />
        <View style={st.sheet}>
          <View style={{ ...COL, gap: 12 }}>
            <View style={st.grabber} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={st.sheetTitle}>{t(lang, 'caseSettings')}</Text>
              <Text style={{ color: C.muted }}>{t(lang, 'optional')}</Text>
            </View>
            <Text style={{ color: C.manila, fontWeight: '700' }}>{t(lang, 'gameLength')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[2, 3, 5].map((r) => (
                <Chip key={r} active={s.rounds === r} onPress={() => set({ rounds: r })} title={t(lang, r === 2 ? 'quick' : r === 3 ? 'normal' : 'long')} />
              ))}
            </View>
            <GameOptions lang={lang} difficulty={s.difficulty} joker={!!s.joker} pace={s.pace} onChange={set} />
            <Small>⚡ {summary}</Small>
            <Btn label={t(lang, 'done')} onPress={() => setSheet(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Arrived mid-game: watch the scoreboard until the next round starts. */
function Waiting({ v, lang, onExit }: { v: NonNullable<GameConn['view']>; lang: 'en' | 'es'; onExit: () => void }) {
  return (
    <ScrollView contentContainerStyle={{ ...COL, padding: 16, gap: 14 }}>
      <Pressable onPress={onExit} hitSlop={10}>
        <Text style={{ color: C.manila, fontSize: 15 }}>🏠 {t(lang, 'leave')}</Text>
      </Pressable>
      <Inspector text={t(lang, 'waitingSub')} mood="suspicious" />
      <Text style={st.section}>
        {t(lang, 'waitingTitle')} <Text style={st.sectionSub}>· {t(lang, 'round')} {v.roundIndex + 1}/{v.rounds}</Text>
      </Text>
      <View style={{ gap: 6 }}>
        {v.players
          .slice()
          .sort((a, b) => b.score - a.score)
          .map((p) => (
            <View key={p.id} style={st.waitRow}>
              <Face suspectId={p.suspectId} emoji={p.emoji} size={40} />
              <Text style={{ color: C.manila, fontWeight: '700', flex: 1, fontSize: 16 }}>{p.name}</Text>
              <Text style={{ color: C.amber, fontWeight: '800', fontSize: 16 }}>{p.score}</Text>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  waitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 8 },
  qrBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  qrBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  qrCard: { backgroundColor: C.ink, borderRadius: 18, padding: 20, gap: 12, alignItems: 'center', width: '100%', maxWidth: 360, borderWidth: 1, borderColor: 'rgba(232,162,58,0.4)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeLabel: { color: C.muted, fontSize: 11, letterSpacing: 1 },
  code: { fontFamily: F.type, fontSize: 30, color: C.amber, letterSpacing: 6 },
  section: { color: C.manila, fontWeight: '900', letterSpacing: 1.5, fontSize: 13 },
  sectionSub: { color: C.muted, fontWeight: '600', letterSpacing: 0 },
  crew: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 12 },
  member: { width: 74, alignItems: 'center', gap: 4 },
  memberName: { color: C.manila, fontSize: 12, fontWeight: '700', maxWidth: 74, textAlign: 'center' },
  crown: { position: 'absolute', top: -10, left: -4, fontSize: 18 },
  remove: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: C.manila, alignItems: 'center', justifyContent: 'center' },
  emptySeat: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: C.slate, borderWidth: 1, borderColor: 'rgba(232,162,58,0.35)' },
  summaryText: { flex: 1, color: C.manila, fontWeight: '700', fontSize: 15 },
  footer: { paddingTop: 10, paddingBottom: 18, backgroundColor: 'rgba(15,42,48,0.94)', borderTopWidth: 1, borderTopColor: C.line },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: C.ink, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderColor: 'rgba(232,162,58,0.35)' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: C.line },
  sheetTitle: { fontFamily: F.type, fontSize: 22, color: C.manila },
});
