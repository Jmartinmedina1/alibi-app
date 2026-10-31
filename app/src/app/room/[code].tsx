import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { GameScreen } from '../../components/GameScreen';
import { ProfileGate } from '../../components/ProfileGate';
import { Btn, Face, Inspector, Small } from '../../components/ui';
import { Chip } from '../../components/Chip';
import { GameOptions } from '../../components/GameOptions';
import { langForPack, t } from '../../lib/i18n';
import { serverUrl, useRoom, type GameConn } from '../../lib/net';
import { setSavedRoom, type Profile } from '../../lib/profile';
import { C, F, COL } from '../../lib/theme';
import { useLang } from '../../lib/lang';

export default function RoomRoute() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <ProfileGate>{(p) => <Room code={String(code).toUpperCase()} profile={p} />}</ProfileGate>;
}

function Room({ code, profile }: { code: string; profile: Profile }) {
  const conn = useRoom(code, profile);
  const { lang: uiLang } = useLang();
  const v = conn.view;
  const lang = v ? langForPack(v.settings.pack) : uiLang;
  const exit = () => {
    setSavedRoom(null);
    router.replace('/');
  };
  if (conn.status === 'error') {
    return (
      <View style={{ ...COL, padding: 20, gap: 14 }}>
        <Inspector text={t(uiLang, 'roomNotFound')} mood="bored" />
        <Btn label={t(uiLang, 'mainMenu')} onPress={exit} />
      </View>
    );
  }
  if (v && v.phase === 'lobby') return <Lobby conn={conn} lang={lang} onExit={() => { conn.leave(); exit(); }} />;
  return <GameScreen conn={conn} lang={lang} onExit={exit} />;
}

function Lobby({ conn, lang, onExit }: { conn: GameConn; lang: 'en' | 'es'; onExit: () => void }) {
  const v = conn.view!;
  const host = v.me === v.hostId;
  const link = Platform.OS === 'web' && typeof location !== 'undefined' ? `${location.origin}/room/${v.code}` : `${serverUrl()}/room/${v.code}`;
  const set = (settings: any) => conn.send({ type: 'settings', settings });
  const enough = v.players.length >= 3;
  return (
    <ScrollView contentContainerStyle={{ ...COL, padding: 16, gap: 14 }}>
      <Pressable onPress={onExit}>
        <Text style={{ color: C.manila, fontSize: 16 }}>🏠 {t(lang, 'leave')}</Text>
      </Pressable>
      <Small>{t(lang, 'roomCode')}</Small>
      <Text style={st.code}>{v.code}</Text>
      <Btn
        kind="secondary"
        label={'📤 ' + t(lang, 'shareInvite')}
        onPress={() =>
          Share.share({ message: (lang === 'es' ? `¡Juega ALIBI conmigo! Código ${v.code}: ` : `Play ALIBI with me! Code ${v.code}: `) + link }).catch(() => {})
        }
      />
      <View style={{ gap: 8 }}>
        {v.players.map((p) => (
          <View key={p.id} style={st.row}>
            <Face suspectId={p.suspectId} emoji={p.emoji} size={40} />
            <Text style={st.name}>
              {p.name}
              {p.id === v.hostId ? ' 👑' : ''}
              {p.id === v.me ? ` (${t(lang, 'you')})` : ''}
            </Text>
            {host && p.id !== v.me && (
              <Pressable onPress={() => conn.send({ type: 'removePlayer', playerId: p.id })}>
                <Text style={{ color: C.muted, fontSize: 18 }}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
      {host ? (
        <>
          {!enough && <Small>{t(lang, 'needPlayers')}</Small>}
          {v.players.length < 8 && <Btn kind="ghost" label={t(lang, 'addBot')} onPress={() => conn.send({ type: 'addBot' })} />}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Chip active={v.settings.pack === 'party'} onPress={() => set({ pack: 'party' })} title={t(lang, 'party')} />
            <Chip active={v.settings.pack === 'espanol'} onPress={() => set({ pack: 'espanol' })} title={t(lang, 'espanol')} sub={t(lang, 'espanolSub')} />
          </View>
          <Text style={st.label}>{t(lang, 'gameLength')}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[2, 3, 5].map((n) => (
              <Chip key={n} active={v.settings.rounds === n} onPress={() => set({ rounds: n })} title={t(lang, n === 2 ? 'quick' : n === 3 ? 'normal' : 'long')} />
            ))}
          </View>
          <GameOptions lang={lang} difficulty={v.settings.difficulty} joker={!!v.settings.joker} onChange={set} />
          <Btn big label={t(lang, 'startGame')} disabled={!enough} onPress={() => conn.send({ type: 'start' })} />
        </>
      ) : (
        <Small>{t(lang, 'waitingHost')}</Small>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  code: { fontFamily: F.type, fontSize: 64, color: C.amber, textAlign: 'center', letterSpacing: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 8 },
  name: { color: C.manila, fontWeight: '700', flex: 1, fontSize: 16 },
  label: { color: C.manila, fontWeight: '700' },
});
