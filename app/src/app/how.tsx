import { router } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';
import { Btn, Paper, Title } from '../components/ui';
import { INTRO_CARDS, t } from '../lib/i18n';
import { useLang } from '../lib/lang';
import { C, F } from '../lib/theme';

export default function How() {
  const { lang } = useLang();
  const extra =
    lang === 'es'
      ? ['🤨 Después de cada respuesta, todos votan: ¿SOSPECHOSO o CREÍBLE?', '🗯️ Al acusado le toca defenderse con una excusa… absurda.', '🏆 +100 por descubrir al Mentiroso. El Mentiroso gana +200 si escapa.']
      : ['🤨 After every answer, everyone reacts: SUS or LEGIT?', '🗯️ The accused gets one (absurd) excuse.', '🏆 +100 for spotting the Liar. The Liar gets +200 for escaping.'];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: C.manila, fontSize: 16 }}>← ALIBI</Text>
      </Pressable>
      <Title>{t(lang, 'howToPlay')}</Title>
      {[...INTRO_CARDS.map((c) => c[lang]), ...extra].map((line, i) => (
        <Paper key={i} tilt={i % 2 ? 0.8 : -0.8}>
          <Text style={{ fontFamily: F.type, fontSize: 17, color: C.ink }}>
            {i + 1}. {line}
          </Text>
        </Paper>
      ))}
      <Btn big label={'🕵️ ' + t(lang, 'practice')} onPress={() => router.replace('/practice')} />
    </ScrollView>
  );
}
