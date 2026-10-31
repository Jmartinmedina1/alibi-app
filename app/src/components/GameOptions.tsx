import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Difficulty, Lang } from '../engine/types';
import { t } from '../lib/i18n';
import { C } from '../lib/theme';
import { Chip } from './Chip';

/** Difficulty + Joker mode, used by Practice and by the host in the lobby. */
export function GameOptions(p: {
  lang: Lang;
  difficulty: Difficulty;
  joker: boolean;
  onChange: (s: { difficulty?: Difficulty; joker?: boolean }) => void;
}) {
  const { lang } = p;
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: C.manila, fontWeight: '700' }}>{t(lang, 'difficulty')}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <Chip key={d} active={p.difficulty === d} onPress={() => p.onChange({ difficulty: d })} title={t(lang, d)} sub={t(lang, `${d}Sub`)} />
        ))}
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: p.joker }}
        onPress={() => p.onChange({ joker: !p.joker })}
        style={st.toggleRow}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.manila, fontWeight: '800', fontSize: 16 }}>{t(lang, 'jokerMode')}</Text>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{t(lang, p.joker ? 'jokerOn' : 'jokerOff')}</Text>
        </View>
        <View style={[st.track, p.joker && { backgroundColor: C.amber }]}>
          <View style={[st.knob, p.joker && { transform: [{ translateX: 20 }] }]} />
        </View>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: C.slate, borderWidth: 1, borderColor: C.line },
  track: { width: 46, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.4)', padding: 3 },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.paper },
});
