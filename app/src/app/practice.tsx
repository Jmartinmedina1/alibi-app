import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameScreen } from '../components/GameScreen';
import { ProfileGate } from '../components/ProfileGate';
import { Inspector, Small } from '../components/ui';
import { Chip } from '../components/Chip';
import type { Pack } from '../engine/types';
import { langForPack, t } from '../lib/i18n';
import { useLang } from '../lib/lang';
import { usePractice } from '../lib/practice';
import type { Profile } from '../lib/profile';
import { C, F, COL } from '../lib/theme';

export default function PracticeRoute() {
  return <ProfileGate>{(p) => <PracticeSetup profile={p} />}</ProfileGate>;
}

function PracticeSetup({ profile }: { profile: Profile }) {
  const { lang: uiLang } = useLang();
  const [pack, setPack] = useState<Pack>(uiLang === 'es' ? 'espanol' : 'party');
  const [started, setStarted] = useState<{ asLiar: boolean; n: number } | null>(null);
  const lang = langForPack(pack);
  if (started) return <PracticeGame key={started.n} profile={profile} pack={pack} asLiar={started.asLiar} />;
  return (
    <ScrollView contentContainerStyle={{ ...COL, padding: 16, gap: 14 }}>
      <Pressable onPress={() => router.replace('/')}>
        <Text style={{ color: C.manila, fontSize: 16 }}>← ALIBI</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Chip active={pack === 'party'} onPress={() => setPack('party')} title={t(lang, 'party')} />
        <Chip active={pack === 'espanol'} onPress={() => setPack('espanol')} title={t(lang, 'espanol')} sub={t(lang, 'espanolSub')} />
      </View>
      <Inspector text={lang === 'es' ? 'Elige Detective para encontrar al mentiroso, o Mentiroso para engañarlos a todos.' : 'Choose Detective to find the bluff, or Liar to fake your way through.'} mood="suspicious" />
      <RoleCard emoji="🕵️" title={t(lang, 'playDetective')} sub={t(lang, 'playDetectiveSub')} onPress={() => setStarted({ asLiar: false, n: Date.now() })} highlight />
      <RoleCard emoji="🤐" title={t(lang, 'playLiar')} sub={t(lang, 'playLiarSub')} onPress={() => setStarted({ asLiar: true, n: Date.now() })} />
      <Small>{lang === 'es' ? '2 rondas · juegas los dos papeles' : '2 rounds · you play both roles'}</Small>
    </ScrollView>
  );
}

function PracticeGame({ profile, pack, asLiar }: { profile: Profile; pack: Pack; asLiar: boolean }) {
  const conn = usePractice(profile, { pack, startAsLiar: asLiar });
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
  role: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 14, backgroundColor: C.slate, borderWidth: 1, borderColor: 'rgba(232,162,58,0.4)' },
  roleTitle: { fontFamily: F.type, fontSize: 22, color: C.manila },
  roleSub: { color: C.muted, marginTop: 2 },
});
