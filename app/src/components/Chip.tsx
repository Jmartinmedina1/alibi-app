import { Pressable, StyleSheet, Text } from 'react-native';
import { C } from '../lib/theme';

export function Chip(props: { active: boolean; onPress: () => void; title: string; sub?: string }) {
  return (
    <Pressable onPress={props.onPress} style={[st.chip, props.active && st.chipOn]}>
      <Text style={[st.chipTitle, props.active && { color: C.ink }]}>{props.title}</Text>
      {props.sub && <Text style={[st.chipSub, props.active && { color: C.ink }]}>{props.sub}</Text>}
    </Pressable>
  );
}


const st = StyleSheet.create({
  chip: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: C.line, backgroundColor: C.slate, alignItems: 'center' },
  chipOn: { backgroundColor: C.amber, borderColor: C.amber },
  chipTitle: { color: C.manila, fontWeight: '800', fontSize: 16 },
  chipSub: { color: C.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
});
