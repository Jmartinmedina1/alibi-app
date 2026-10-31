import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProfileGate } from '../components/ProfileGate';
import { Btn, Face, Inspector, Small } from '../components/ui';
import { t } from '../lib/i18n';
import { useLang } from '../lib/lang';
import { createRoom, roomInfo } from '../lib/net';
import { getSavedRoom, setSavedRoom, type Profile } from '../lib/profile';
import { C, F } from '../lib/theme';

export default function PlayRoute() {
  return <ProfileGate>{(p) => <Play profile={p} />}</ProfileGate>;
}

function Play({ profile }: { profile: Profile }) {
  const { lang } = useLang();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  // Offer "Rejoin" only if that room is still running — never auto-redirect.
  useEffect(() => {
    getSavedRoom().then(async (c) => {
      if (!c) return;
      try {
        const info = await roomInfo(c);
        if (info.exists && info.phase !== 'gameover') setSaved(c);
        else setSavedRoom(null);
      } catch {}
    });
  }, []);

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const c = await createRoom(profile, { pack: lang === 'es' ? 'espanol' : 'party' });
      await setSavedRoom(c);
      router.push(`/room/${c}`);
    } catch {
      setErr(lang === 'es' ? 'No pudimos crear la sala. Revisa tu conexión.' : "Couldn't create a room. Check your connection.");
    } finally {
      setBusy(false);
    }
  };
  const join = async () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 4) return;
    setBusy(true);
    setErr('');
    try {
      const info = await roomInfo(c);
      if (!info.exists || (!info.joinable && saved !== c)) {
        setErr(t(lang, 'roomNotFound'));
        return;
      }
      await setSavedRoom(c);
      router.push(`/room/${c}`);
    } catch {
      setErr(t(lang, 'roomNotFound'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.replace('/')}>
        <Text style={{ color: C.manila, fontSize: 16 }}>← ALIBI</Text>
      </Pressable>
      {saved && (
        <View style={st.rejoin}>
          <Text style={{ color: C.manila, fontWeight: '700' }}>
            {t(lang, 'youreInRoom')} {saved}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn style={{ flex: 1 }} label={t(lang, 'rejoin')} onPress={() => router.push(`/room/${saved}`)} />
            <Btn style={{ flex: 1 }} kind="ghost" label={t(lang, 'leave')} onPress={() => { setSavedRoom(null); setSaved(null); }} />
          </View>
        </View>
      )}
      <Inspector text={lang === 'es' ? 'Reúne a tus sospechosos. Cada uno juega desde su teléfono.' : 'Gather your suspects. Everyone plays on their own phone.'} mood="suspicious" />
      <Pressable onPress={() => router.push('/profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <Face emoji={profile.emoji} size={56} />
        <View>
          <Text style={{ color: C.manila, fontFamily: F.type, fontSize: 20 }}>{profile.name}</Text>
          <Text style={{ color: C.muted, fontSize: 12, textDecorationLine: 'underline' }}>✏️ {lang === 'es' ? 'Cambiar' : 'Change'}</Text>
        </View>
      </Pressable>
      <Btn big label={'➕ ' + t(lang, 'createRoom')} onPress={create} disabled={busy} />
      <Text style={st.or}>— {lang === 'es' ? 'o' : 'or'} —</Text>
      <TextInput
        value={code}
        onChangeText={(x) => setCode(x.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4))}
        placeholder={t(lang, 'roomCode')}
        placeholderTextColor="#8a9a9a"
        autoCapitalize="characters"
        autoCorrect={false}
        style={st.code}
        onSubmitEditing={join}
      />
      <Btn kind="secondary" label={t(lang, 'joinRoom')} onPress={join} disabled={busy || code.length !== 4} />
      {!!err && <Small style={{ color: C.red }}>{err}</Small>}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  rejoin: { backgroundColor: C.slate, borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: C.amber },
  or: { color: C.muted, textAlign: 'center' },
  code: { backgroundColor: C.manila, borderRadius: 12, fontSize: 30, letterSpacing: 10, textAlign: 'center', paddingVertical: 12, color: C.ink, fontFamily: F.type },
});
