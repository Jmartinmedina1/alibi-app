import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { t } from '../lib/i18n';
import { useLang } from '../lib/lang';
import { loadProfile, randomAlias, saveProfile, type Profile } from '../lib/profile';
import { AVATARS, C, F } from '../lib/theme';
import { Btn, Face, Small, Title } from './ui';

/** Asks for a name + avatar the first time (prefilled with a funny alias — no typing needed). */
export function ProfileGate(props: { children: (p: Profile) => ReactNode }) {
  const { lang } = useLang();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [name, setName] = useState(randomAlias());
  const [emoji, setEmoji] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    loadProfile().then((p) => setProfile(p));
  }, []);
  if (profile === undefined) return null;
  if (profile) return <>{props.children(profile)}</>;
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <Title>{t(lang, 'whoAreYou')}</Title>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Face emoji={emoji} size={96} />
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
        {!editing && (
          <Pressable onPress={() => setEditing(true)}>
            <Small style={{ textDecorationLine: 'underline' }}>✏️ {t(lang, 'editName')}</Small>
          </Pressable>
        )}
      </View>
      <View style={st.avatars}>
        {AVATARS.map((a) => (
          <Pressable key={a} onPress={() => setEmoji(a)} style={[st.avatar, a === emoji && { borderColor: C.amber, backgroundColor: 'rgba(232,162,58,0.25)' }]}>
            <Text style={{ fontSize: 30 }}>{a}</Text>
          </Pressable>
        ))}
      </View>
      <Btn big label={t(lang, 'letsGo')} onPress={async () => setProfile(await saveProfile({ name: name.trim() || randomAlias(), emoji }))} />
    </View>
  );
}

const st = StyleSheet.create({
  name: { fontFamily: F.type, fontSize: 24, color: C.manila },
  input: { fontSize: 20, color: C.ink, backgroundColor: C.manila, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 200 },
  dice: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.slate, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  avatar: { width: 62, height: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate, borderWidth: 2, borderColor: 'transparent' },
});
