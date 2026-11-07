/** UI pieces shared by the baseline (A) and Variant B screens. */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, COL, F } from '../lib/theme';
import type { Lang } from './cards';
import { s as str } from './strings';

export function Box({ children }: { children: ReactNode }) {
  return <View style={st.box}>{children}</View>;
}

export function TopBar(props: { lang: Lang; onHome: () => void; onLang: () => void; children?: ReactNode }) {
  return (
    <View style={st.top}>
      <Chip testID="home" label={str(props.lang, 'home')} onPress={props.onHome} />
      <View style={{ flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
        {props.children}
        <Chip testID="lang" label={props.lang === 'en' ? 'ES' : 'EN'} onPress={props.onLang} />
      </View>
    </View>
  );
}

export function Chip(props: { label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={props.testID} accessibilityRole="button" onPress={props.onPress} style={({ pressed }) => [st.chip, pressed && { opacity: 0.7 }]} hitSlop={6}>
      <Text style={{ color: C.manila, fontWeight: '700', fontSize: 15 }}>{props.label}</Text>
    </Pressable>
  );
}

export function Big(props: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; testID?: string; flex?: boolean }) {
  const kind = props.kind ?? 'primary';
  const bg = kind === 'primary' ? C.amber : kind === 'secondary' ? C.slate2 : kind === 'danger' ? C.red : 'transparent';
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [st.big, { backgroundColor: bg, opacity: props.disabled ? 0.45 : pressed ? 0.75 : 1 }, kind === 'ghost' && { borderWidth: 1, borderColor: C.line }, props.flex && { flex: 1 }]}
    >
      <Text style={{ color: kind === 'primary' ? C.ink : C.manila, fontWeight: '800', fontSize: 17, textAlign: 'center' }}>{props.label}</Text>
    </Pressable>
  );
}

export const st = StyleSheet.create({
  page: { ...COL, padding: 16, gap: 12 },
  top: { ...COL, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: C.line },
  h1: { fontFamily: F.type, fontSize: 26, color: C.manila, textAlign: 'center' },
  h2: { fontFamily: F.type, fontSize: 21, color: C.manila },
  h3: { fontSize: 17, fontWeight: '800', color: C.manila },
  lead: { fontSize: 18, color: C.amber, textAlign: 'center', fontWeight: '700' },
  body: { fontSize: 16, color: C.manila, lineHeight: 22 },
  small: { fontSize: 14, color: C.muted, lineHeight: 19 },
  tag: { color: C.amber, fontWeight: '800', fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase' },
  notice: { fontSize: 16, color: C.ink, backgroundColor: C.manila, padding: 12, borderRadius: 10, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  card: { width: '48.5%', minHeight: 140, backgroundColor: C.paper, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 8, borderWidth: 4, borderColor: 'transparent' },
  cardOn: { borderColor: C.amber, borderWidth: 4 },
  cardLabel: { fontSize: 18, fontWeight: '800', color: C.ink, marginTop: 4 },
  cardNote: { fontSize: 13, fontWeight: '700', color: C.ink, minHeight: 17 },
  box: { backgroundColor: C.slate, borderRadius: 12, padding: 12, gap: 6, borderWidth: 1, borderColor: C.line },
  how: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.slate, borderRadius: 12, padding: 12 },
  howN: { fontFamily: F.type, fontSize: 24, color: C.amber, width: 24, textAlign: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 22, backgroundColor: C.slate2, borderWidth: 3, borderColor: 'transparent', minHeight: 48 },
  pillOn: { borderColor: C.amber },
  pillText: { color: C.manila, fontWeight: '700', fontSize: 15 },
  statusRow: { flexDirection: 'row', gap: 4 },
  statusCell: { flex: 1, alignItems: 'center', gap: 2 },
  statusName: { color: C.manila, fontWeight: '700', fontSize: 13 },
  statusText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  miniLine: { color: C.ink, backgroundColor: C.paper, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, fontWeight: '700', fontSize: 13, alignSelf: 'flex-start' },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.paper, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 2, borderColor: 'transparent' },
  miniText: { color: C.ink, fontWeight: '700', fontSize: 14 },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.slate, borderRadius: 12, padding: 10, borderWidth: 4, borderColor: 'transparent', minHeight: 64 },
  big: { paddingVertical: 15, paddingHorizontal: 16, borderRadius: 14, minHeight: 52, justifyContent: 'center' },
  qa: { marginTop: 18, gap: 8, borderTopWidth: 1, borderColor: C.line, paddingTop: 12 },
});
