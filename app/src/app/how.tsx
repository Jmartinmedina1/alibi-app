import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, Paper, Title } from '../components/ui';
import { INTRO_CARDS, t } from '../lib/i18n';
import { useLang } from '../lib/lang';
import { C, F, COL } from '../lib/theme';

export default function How() {
  const { lang } = useLang();
  const extra =
    lang === 'es'
      ? ['🤨 Después de cada respuesta, todos votan: ¿SOSPECHOSO o CREÍBLE?', '🗯️ Al acusado le toca defenderse con una excusa… absurda.', '⚖️ ¿Empate? Desempate entre los empatados; si sigue empatado, el Mentiroso escapa.', '🏆 +100 por descubrir al Mentiroso. El Mentiroso gana +200 si escapa.']
      : ['🤨 After every answer, everyone reacts: SUS or LEGIT?', '🗯️ The accused gets one (absurd) excuse.', '⚖️ A tie? Runoff vote between the tied suspects. Still tied, the Liar escapes.', '🏆 +100 for spotting the Liar. The Liar gets +200 for escaping.'];
  return (
    <ScrollView contentContainerStyle={{ ...COL, padding: 16, gap: 12 }}>
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

const POSTERS = { en: require('../../assets/video/poster-en.jpg'), es: require('../../assets/video/poster-es.jpg') };
const VIDEOS = { en: require('../../assets/video/how-en.mp4'), es: require('../../assets/video/how-es.mp4') };

/** 45-second cartoon: the Inspector explains the game while the detectives act it out. */
function HowVideo({ lang }: { lang: 'en' | 'es' }) {
  const player = useVideoPlayer(VIDEOS[lang], (p) => {
    p.loop = false;
  });
  // A poster with a big play button, so the box never looks empty or broken.
  const [started, setStarted] = useState(false);
  return (
    <View style={{ width: '100%', maxWidth: 360, aspectRatio: 9 / 16, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', borderWidth: 2, borderColor: C.amber }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} nativeControls={started} contentFit="contain" />
      {!started && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={lang === 'es' ? 'Ver el video' : 'Watch the video'}
          onPress={() => {
            setStarted(true);
            player.play();
          }}
          style={StyleSheet.absoluteFill}
        >
          <Image source={POSTERS[lang]} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="contain" />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
            <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 40, color: C.ink, marginLeft: 6 }}>▶</Text>
            </View>
            <Text style={{ marginTop: 12, color: C.paper, fontWeight: '800', fontSize: 18, textShadowColor: '#000', textShadowRadius: 6 }}>
              {lang === 'es' ? 'Ver cómo se juega (48 s)' : 'Watch how to play (48 s)'}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}
