import { Text, View } from 'react-native';
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
      <Chip
        active={p.joker}
        onPress={() => p.onChange({ joker: !p.joker })}
        title={t(lang, 'jokerMode')}
        sub={t(lang, p.joker ? 'jokerOn' : 'jokerOff')}
      />
    </View>
  );
}
