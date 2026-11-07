import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Btn, Inspector, Small } from '../components/ui';
import { t } from '../lib/i18n';
import { useLang } from '../lib/lang';
import { C, F, SUSPECT_FALLBACK, SUSPECT_IMAGES, COL } from '../lib/theme';
import { PROTOTYPE_ENABLED } from '../prototype/flags';

export default function Landing() {
  const { lang, setLang } = useLang();
  const cast = [...Object.keys(SUSPECT_IMAGES), ...Object.keys(SUSPECT_FALLBACK)];
  const { width } = useWindowDimensions();
  // All suspects on one row: shrink the photos to fit the phone width (max 64px).
  const face = Math.max(38, Math.min(64, Math.floor((Math.min(width, 520) - 40 - (cast.length - 1) * 6) / cast.length)));
  return (
    <ScrollView contentContainerStyle={{ ...COL, padding: 20, paddingTop: 12, gap: 11 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.push('/how')} style={st.lang} accessibilityRole="button">
          <Text style={{ color: C.manila, fontWeight: '700' }}>📖 {t(lang, 'howToPlay')}</Text>
        </Pressable>
        <Pressable onPress={() => setLang(lang === 'en' ? 'es' : 'en')} style={st.lang}>
          <Text style={{ color: C.manila, fontWeight: '700' }}>{lang === 'en' ? '🇪🇸 Español' : '🇬🇧 English'}</Text>
        </Pressable>
      </View>
      <Text style={st.logo}>
        ALIBI<Text style={{ color: C.red }}>.</Text>
      </Text>
      <Text style={st.tag}>{t(lang, 'tagline')}</Text>
      <View style={st.badge}>
        <Text style={st.badgeText}>{t(lang, 'freeBadge')}</Text>
      </View>
      <View style={st.cast}>
        {cast.map((id, i) => (
          <View key={id} style={[st.castFace, { width: face, height: face,  transform: [{ rotate: `${(i % 2 ? 4 : -4)}deg` }] }]}>
            {SUSPECT_IMAGES[id] ? (
              <Image source={SUSPECT_IMAGES[id]} style={{ width: face, height: face }} />
            ) : (
              <Text style={{ fontSize: face * 0.55 }}>{SUSPECT_FALLBACK[id]}</Text>
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
      {PROTOTYPE_ENABLED && (
        <Btn testID="open-prototype" kind="secondary" label={'🧪 Case Logic Prototype (dev)'} onPress={() => router.push('/prototype')} />
      )}
      {PROTOTYPE_ENABLED && (
        <Btn testID="open-visual-prototype" kind="secondary" label={'🧪 Visual Bluffing Prototype (dev)'} onPress={() => router.push('/visual-prototype')} />
      )}
      <Small style={{ marginTop: 8 }}>{t(lang, 'alsoSpanish')}</Small>
      <Pressable onPress={() => router.push('/privacy')} hitSlop={8} style={{ alignSelf: 'center', marginTop: 6 }}>
        <Text style={{ color: C.muted, fontSize: 14, textDecorationLine: 'underline' }}>{t(lang, 'privacy')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  logo: { fontFamily: F.type, fontSize: 60, color: C.manila, textAlign: 'center' },
  tag: { fontFamily: F.type, fontSize: 18, color: C.amber, textAlign: 'center', lineHeight: 25 },
  cast: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginVertical: 2 },
  castFace: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: C.amber, backgroundColor: C.slate2, alignItems: 'center', justifyContent: 'center' },
  badge: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(62,142,90,0.25)', borderWidth: 1, borderColor: 'rgba(62,142,90,0.7)' },
  badgeText: { color: C.manila, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  lang: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: C.line },
});
