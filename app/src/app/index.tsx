import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, Inspector, Small } from '../components/ui';
import { t } from '../lib/i18n';
import { useLang } from '../lib/lang';
import { C, F, SUSPECT_FALLBACK, SUSPECT_IMAGES } from '../lib/theme';

export default function Landing() {
  const { lang, setLang } = useLang();
  const cast = [...Object.keys(SUSPECT_IMAGES), ...Object.keys(SUSPECT_FALLBACK)];
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => setLang(lang === 'en' ? 'es' : 'en')} style={st.lang}>
          <Text style={{ color: C.manila, fontWeight: '700' }}>{lang === 'en' ? '🇪🇸 Español' : '🇬🇧 English'}</Text>
        </Pressable>
      </View>
      <Text style={st.logo}>
        ALIBI<Text style={{ color: C.red }}>.</Text>
      </Text>
      <Text style={st.tag}>{t(lang, 'tagline')}</Text>
      <View style={st.cast}>
        {cast.map((id, i) => (
          <View key={id} style={[st.castFace, { transform: [{ rotate: `${(i % 2 ? 4 : -4)}deg` }] }]}>
            {SUSPECT_IMAGES[id] ? (
              <Image source={SUSPECT_IMAGES[id]} style={{ width: 64, height: 64 }} />
            ) : (
              <Text style={{ fontSize: 36 }}>{SUSPECT_FALLBACK[id]}</Text>
            )}
          </View>
        ))}
      </View>
      <Inspector
        text={lang === 'es' ? 'Uno de ustedes miente sobre dónde estuvo. Interróguense… y atrapen al Mentiroso.' : 'One of you is lying about where you were. Grill each other… and catch the Liar.'}
        mood="suspicious"
      />
      <Btn big label={'🕵️ ' + t(lang, 'practice')} onPress={() => router.push('/practice')} />
      <Small>{t(lang, 'practiceSub')}</Small>
      <Btn big kind="secondary" label={'👥 ' + t(lang, 'playFriends')} onPress={() => router.push('/play')} />
      <Small>{t(lang, 'playFriendsSub')}</Small>
      <Btn kind="ghost" label={'📖 ' + t(lang, 'howToPlay')} onPress={() => router.push('/how')} />
      <Small style={{ marginTop: 8 }}>{t(lang, 'alsoSpanish')}</Small>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  logo: { fontFamily: F.type, fontSize: 78, color: C.manila, textAlign: 'center', marginTop: 6 },
  tag: { fontFamily: F.type, fontSize: 18, color: C.amber, textAlign: 'center', lineHeight: 25 },
  cast: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginVertical: 6 },
  castFace: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: C.amber, backgroundColor: C.slate2, alignItems: 'center', justifyContent: 'center' },
  lang: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: C.line },
});
