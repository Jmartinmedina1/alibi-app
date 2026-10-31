import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameScreen } from '../components/GameScreen';
import { ProfileGate } from '../components/ProfileGate';
import { Btn, Inspector, Small } from '../components/ui';
import { Chip } from '../components/Chip';
import { GameOptions } from '../components/GameOptions';
import type { Difficulty, Pace, Pack } from '../engine/types';
import { langForPack, t } from '../lib/i18n';
import { useLang } from '../lib/lang';
import { usePractice } from '../lib/practice';
import { bumpPracticeCount, getPracticeCount, type Profile } from '../lib/profile';
import { C, F, COL } from '../lib/theme';

export default function PracticeRoute() {
  return <ProfileGate>{(p) => <PracticeSetup profile={p} />}</ProfileGate>;
}

function PracticeSetup({ profile }: { profile: Profile }) {
  const { lang: uiLang } = useLang();
  const [pack, setPack] = useState<Pack>(uiLang === 'es' ? 'espanol' : 'party');
  const [started, setStarted] = useState<{ asLiar: boolean; n: number } | null>(null);
  const [opts, setOpts] = useState<{ difficulty: Difficulty; joker: boolean; pace: Pace }>({ difficulty: 'medium', joker: false, pace: 'relaxed' });
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    getPracticeCount().then((n) => {
      setCount(n);
      if (n === 0) setOpts((o) => ({ ...o, difficulty: 'easy' })); // a newcomer's first case starts on Easy
    });
  }, []);
  const lang = langForPack(pack);
  const [sheet, setSheet] = useState(false);
  const summary = [
    t(lang, opts.difficulty),
    t(lang, opts.pace === 'slow' ? 'paceSlow' : opts.pace === 'normal' ? 'paceNormal' : 'paceRelaxed'),
    t(lang, opts.joker ? 'jokerOnShort' : 'jokerOffShort'),
  ].join(' · ');
  const start = (asLiar: boolean) => {
    bumpPracticeCount();
    setStarted({ asLiar, n: Date.now() });
  };
  if (started)
    return <PracticeGame key={started.n} profile={profile} pack={pack} asLiar={started.asLiar} {...opts} coach={(count ?? 0) < 3} firstGame={count === 0 && !started.asLiar} />;
  return (
    <ScrollView contentContainerStyle={{ ...COL, padding: 16, gap: 14 }}>
      <Pressable onPress={() => router.replace('/')}>
        <Text style={{ color: C.manila, fontSize: 16 }}>← ALIBI</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Chip active={pack === 'party'} onPress={() => setPack('party')} title={t(lang, 'party')} />
        <Chip active={pack === 'espanol'} onPress={() => setPack('espanol')} title={t(lang, 'espanol')} sub={t(lang, 'espanolSub')} />
      </View>
      <Pressable onPress={() => setSheet(true)} style={({ pressed }) => [st.summary, pressed && { opacity: 0.8 }]} accessibilityRole="button">
        <Text style={{ fontSize: 20 }}>⚡</Text>
        <Text style={st.summaryText}>{summary}</Text>
        <Text style={{ fontSize: 18 }}>⚙️</Text>
      </Pressable>
      <Inspector text={lang === 'es' ? 'Elige Detective para encontrar al mentiroso, o Mentiroso para engañarlos a todos.' : 'Choose Detective to find the bluff, or Liar to fake your way through.'} mood="suspicious" />
      <RoleCard emoji="🕵️" title={t(lang, 'playDetective')} sub={t(lang, 'playDetectiveSub')} onPress={() => start(false)} highlight />
      <RoleCard emoji="🤐" title={t(lang, 'playLiar')} sub={t(lang, 'playLiarSub')} onPress={() => start(true)} />
      <Small>{lang === 'es' ? '2 rondas · juegas los dos papeles' : '2 rounds · you play both roles'}</Small>
      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={() => setSheet(false)} />
        <View style={st.sheet}>
          <View style={{ ...COL, gap: 12 }}>
            <Text style={st.sheetTitle}>{t(lang, 'caseSettings')}</Text>
            <GameOptions lang={lang} difficulty={opts.difficulty} joker={opts.joker} pace={opts.pace} onChange={(x) => setOpts((o) => ({ ...o, ...x }))} />
            <Btn label={t(lang, 'done')} onPress={() => setSheet(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function PracticeGame(p: { profile: Profile; pack: Pack; asLiar: boolean; difficulty: Difficulty; joker: boolean; pace: Pace; coach: boolean; firstGame: boolean }) {
  const { profile, pack } = p;
  const conn = usePractice(profile, { pack, startAsLiar: p.asLiar, difficulty: p.difficulty, joker: p.joker, pace: p.pace, coach: p.coach, firstGame: p.firstGame });
  return <GameScreen conn={conn} lang={langForPack(pack)} onExit={() => router.replace('/')} />;
}

function RoleCard(p: { emoji: string; title: string; sub: string; onPress: () => void; highlight?: boolean }) {
  return (
    <Pressable onPress={p.onPress} style={({ pressed }) => [st.role, p.highlight && { backgroundColor: C.manila }, pressed && { transform: [{ scale: 0.98 }] }]}>
      <Text style={{ fontSize: 36 }}>{p.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[st.roleTitle, p.highlight && { color: C.ink }]}>{p.title}</Text>
        <Text style={[st.roleSub, p.highlight && { color: '#4b4030' }]}>{p.sub}</Text>
      </View>
      <Text style={{ fontSize: 22, color: p.highlight ? C.ink : C.manila }}>→</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: C.slate, borderWidth: 1, borderColor: 'rgba(232,162,58,0.35)' },
  summaryText: { flex: 1, color: C.manila, fontWeight: '700', fontSize: 15 },
  sheet: { backgroundColor: C.ink, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderColor: 'rgba(232,162,58,0.35)' },
  sheetTitle: { fontFamily: F.type, fontSize: 22, color: C.manila },
  role: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 14, backgroundColor: C.slate, borderWidth: 1, borderColor: 'rgba(232,162,58,0.4)' },
  roleTitle: { fontFamily: F.type, fontSize: 22, color: C.manila },
  roleSub: { color: C.muted, marginTop: 2 },
});
