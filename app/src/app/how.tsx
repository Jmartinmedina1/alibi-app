import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
      <Pressable onPress={() => router.replace('/')}>
        <Text style={{ color: C.manila, fontSize: 16 }}>← ALIBI</Text>
      </Pressable>
      <Title>{t(lang, 'howToPlay')}</Title>
      <HowVideo key={lang} lang={lang} />
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

const VIDEOS = { en: require('../../assets/video/how-en.mp4'), es: require('../../assets/video/how-es.mp4') };

/** 45-second cartoon: the Inspector explains the game while the detectives act it out. */
function HowVideo({ lang }: { lang: 'en' | 'es' }) {
  const player = useVideoPlayer(VIDEOS[lang], (p) => {
    p.loop = false;
  });
  return (
    <View style={{ width: '100%', maxWidth: 360, aspectRatio: 9 / 16, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', borderWidth: 2, borderColor: C.amber }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} nativeControls contentFit="contain" />
    </View>
  );
}
