import { useEffect, useState, type ReactNode } from 'react';
import { cleanName } from '../engine/names';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { t } from '../lib/i18n';
import { useLang } from '../lib/lang';
import { loadProfile, randomAlias, saveProfile, type Profile } from '../lib/profile';
import { AVATARS, C, COL, F } from '../lib/theme';
import { Btn, Face, Small, Title } from './ui';

/** Asks for a name + avatar the first time (prefilled with a funny alias — no typing needed). */
export function ProfileGate(props: { children: (p: Profile) => ReactNode; edit?: boolean }) {
  const { lang } = useLang();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [name, setName] = useState(randomAlias());
  const [emoji, setEmoji] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [editing, setEditing] = useState(false);
  const [kid, setKid] = useState<boolean | null>(null);
  const [nameNote, setNameNote] = useState(false);
  useEffect(() => {
    loadProfile().then((p) => {
      if (p?.ageAsked) setKid(!!p.kid);
      if (p && !p.ageAsked) {
        // Existing player from before the age question: ask once, keep their name and avatar.
        setName(p.name);
        setEmoji(p.emoji);
        setProfile(null);
      } else if (props.edit && p) {
        setName(p.name);
        setEmoji(p.emoji);
        setProfile(null);
      } else setProfile(p);
    });
  }, [props.edit]);
  if (profile === undefined) return null;
  if (profile) return <>{props.children(profile)}</>;
  if (kid === null) {
    // Neutral age question: every option looks the same, nothing hints at a "right" answer.
    const ages = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18+'];
    return (
      <View style={{ ...COL, padding: 20, gap: 16 }}>
        <Title>{t(lang, 'howOld')}</Title>
        <View style={st.ages}>
          {ages.map((a) => (
            <Pressable
              key={a}
              accessibilityRole="button"
              onPress={() => {
                const under13 = a !== '18+' && Number(a) < 13;
                setKid(under13);
                if (under13) setName(randomAlias());
              }}
              style={({ pressed }) => [st.age, pressed && { backgroundColor: C.amber }]}
            >
              <Text style={st.ageText}>{a}</Text>
            </Pressable>
          ))}
        </View>
        <Small>{t(lang, 'ageWhy')}</Small>
      </View>
    );
  }
  const save = async () => {
    const clean = kid ? name : cleanName(name);
    if (!clean) {
      // Not allowed (or empty): offer a detective name and let them look before continuing.
      setName(randomAlias());
      setEditing(false);
      setNameNote(!!name.trim());
      return;
    }
    setProfile(await saveProfile({ name: clean, emoji, ageAsked: true, kid: !!kid }));
  };
  return (
    <View style={{ ...COL, padding: 20, gap: 16 }}>
      <Title>{t(lang, 'whoAreYou')}</Title>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Face emoji={emoji} size={120} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {editing ? (
            <TextInput value={name} onChangeText={setName} maxLength={18} autoFocus style={st.input} onBlur={() => setEditing(false)} />
          ) : (
            <Text style={st.name}>{name}</Text>
          )}
          <Pressable onPress={() => setName(randomAlias())} style={st.dice} accessibilityLabel="Random name">
            <Text style={{ fontSize: 22 }}>🎲</Text>
          </Pressable>
        </View>
        {!editing && !kid && (
          <Pressable onPress={() => setEditing(true)}>
            <Small style={{ textDecorationLine: 'underline' }}>✏️ {t(lang, 'editName')}</Small>
          </Pressable>
        )}
        {kid && <Small>{t(lang, 'kidNames')}</Small>}
        {nameNote && <Small style={{ color: C.amber }}>{t(lang, 'nameChanged')}</Small>}
      </View>
      <View style={st.avatars}>
        {AVATARS.map((a) => (
          <Pressable key={a} onPress={() => setEmoji(a)} style={[st.avatar, a === emoji && { borderColor: C.amber, backgroundColor: 'rgba(232,162,58,0.25)' }]}>
            <Face emoji={a} size={58} ring={a === emoji ? C.amber : 'transparent'} />
          </Pressable>
        ))}
      </View>
      <Btn big label={t(lang, 'letsGo')} onPress={save} />
    </View>
  );
}

const st = StyleSheet.create({
  name: { fontFamily: F.type, fontSize: 24, color: C.manila },
  input: { fontSize: 20, color: C.ink, backgroundColor: C.manila, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 200 },
  dice: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.slate, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  ages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  age: { width: 64, height: 54, borderRadius: 12, backgroundColor: C.slate, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  ageText: { color: C.manila, fontSize: 20, fontWeight: '800' },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  avatar: { width: 68, height: 68, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate, borderWidth: 2, borderColor: 'transparent' },
});
