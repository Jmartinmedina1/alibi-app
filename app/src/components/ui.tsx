import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { commentLines, TRANSLATIONS } from '../engine/content';
import type { Lang, Line } from '../engine/types';
import { haptic, play } from '../lib/sound';
import { AVATAR_IMAGES, C, F, INSPECTOR, SUSPECT_FALLBACK, SUSPECT_IMAGES } from '../lib/theme';

// ---------- Button: reacts instantly on tap (no "tap twice" feeling) ----------
export function Btn(props: {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  big?: boolean;
  style?: StyleProp<ViewStyle>;
  sound?: boolean;
  testID?: string;
}) {
  const { kind = 'primary', disabled, big } = props;
  const bg =
    kind === 'primary' ? C.amber : kind === 'danger' ? C.red : kind === 'secondary' ? C.slate : 'transparent';
  const fg = kind === 'primary' ? C.ink : kind === 'ghost' ? C.manila : C.manila;
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        if (props.sound !== false) play('tap', 0.4);
        haptic('light');
        props.onPress?.();
      }}
      style={({ pressed }) => [
        s.btn,
        big && s.btnBig,
        { backgroundColor: bg, opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        kind === 'ghost' && { borderWidth: 1, borderColor: C.line },
        kind === 'secondary' && { borderWidth: 1, borderColor: 'rgba(232,162,58,0.35)' },
        props.style,
      ]}
    >
      <Text style={[s.btnText, big && { fontSize: 22 }, { color: fg }]}>{props.label}</Text>
    </Pressable>
  );
}

// ---------- Avatar: portraits for the cast, emoji for people ----------
export function Face(props: { suspectId?: string; emoji?: string; size?: number; dim?: boolean; ring?: string }) {
  const size = props.size ?? 52;
  const img = props.suspectId ? SUSPECT_IMAGES[props.suspectId] : props.emoji ? AVATAR_IMAGES[props.emoji] : undefined;
  const fallback = props.suspectId ? SUSPECT_FALLBACK[props.suspectId] : undefined;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(2, size / 22),
        borderColor: props.ring ?? C.amber,
        backgroundColor: C.slate2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: props.dim ? 0.4 : 1,
      }}
    >
      {img ? (
        <Image source={img} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: size * 0.58 }}>{fallback ?? props.emoji ?? '🕵️'}</Text>
      )}
    </View>
  );
}

// ---------- Inspector speech bubble ----------
export function lineText(line: Line | null | undefined, lang: Lang, overrideKey?: string): string {
  if (!line) return '';
  const key = overrideKey ?? line.key;
  const lines = commentLines(key);
  if (!lines.length) return '';
  const l = lines[line.i % lines.length];
  return (lang === 'es' ? l.es : l.en) ?? l.en;
}

export function moodFor(key?: string): keyof typeof INSPECTOR {
  if (!key) return 'default';
  if (/liarCaught|inspectorAfter|liarGuessWrong/.test(key)) return 'smug';
  if (/revealHot|tie|liarGuessRight|onVoted/.test(key)) return 'shocked';
  if (/liarEscaped/.test(key)) return 'bored';
  if (/questionAsked|caseStart|voteStart/.test(key)) return 'suspicious';
  return 'default';
}

export function Inspector(props: { text: string; mood?: keyof typeof INSPECTOR; compact?: boolean }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: false }).start();
  }, [props.text, fade]);
  if (!props.text) return null;
  const size = props.compact ? 54 : 74;
  return (
    <Animated.View style={[s.inspRow, { opacity: fade }]}>
      <Image source={INSPECTOR[props.mood ?? 'default']} style={{ width: size, height: size }} resizeMode="contain" />
      <View style={s.bubble}>
        <Text style={s.bubbleLabel}>THE INSPECTOR</Text>
        <Text style={s.bubbleText}>{props.text}</Text>
      </View>
    </Animated.View>
  );
}

// ---------- Countdown bar (synced to the server clock) ----------
export function TimerBar(props: { deadline: number | null; phaseAt: number; offset: number; onTick?: (msLeft: number) => void }) {
  const [now, setNow] = useState(Date.now());
  const lastSec = useRef(-1);
  useEffect(() => {
    if (props.deadline == null) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [props.deadline]);
  if (props.deadline == null) return null;
  const serverNow = now + props.offset;
  const total = Math.max(1, props.deadline - props.phaseAt);
  const left = Math.max(0, props.deadline - serverNow);
  const pct = Math.max(0, Math.min(1, left / total));
  const sec = Math.ceil(left / 1000);
  if (sec !== lastSec.current) {
    lastSec.current = sec;
    if (sec <= 5 && sec > 0) play('tick', 0.35);
    props.onTick?.(left);
  }
  return (
    <View style={s.timerWrap}>
      <View style={[s.timerFill, { width: `${pct * 100}%`, backgroundColor: sec <= 5 ? C.red : C.amber }]} />
    </View>
  );
}

// ---------- Spanish learning: press and hold to see English ----------
export function Tr(props: { text: string; lang: Lang; style?: StyleProp<TextStyle>; onPeek?: () => void; numberOfLines?: number }) {
  const [peek, setPeek] = useState(false);
  const en = props.lang === 'es' ? TRANSLATIONS[props.text] : undefined;
  if (!en) return <Text style={props.style}>{props.text}</Text>;
  return (
    <Pressable
      onLongPress={() => {
        setPeek(true);
        haptic('light');
        props.onPeek?.();
      }}
      onPressOut={() => setPeek(false)}
      delayLongPress={350}
    >
      <Text style={props.style}>{props.text}</Text>
      {peek && (
        <View style={s.peek}>
          <Text style={s.peekText}>🇬🇧 {en}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------- Paper note ----------
export function Paper(props: { children: ReactNode; style?: StyleProp<ViewStyle>; tilt?: number }) {
  return <View style={[s.paper, props.tilt ? { transform: [{ rotate: `${props.tilt}deg` }] } : null, props.style]}>{props.children}</View>;
}

// ---------- Slam-in animation for big moments ----------
export function Slam(props: { children: ReactNode; delay?: number; sound?: 'thud' | 'stamp' | 'whoosh' | null }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = setTimeout(() => {
      if (props.sound) play(props.sound, 0.6);
      Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: false }).start();
    }, props.delay ?? 0);
    return () => clearTimeout(id);
  }, [v, props.delay, props.sound]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1.6, 1] });
  return <Animated.View style={{ opacity: v, transform: [{ scale }] }}>{props.children}</Animated.View>;
}

export function Shake(props: { children: ReactNode; trigger: unknown }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence(
      [8, -8, 6, -6, 3, 0].map((to) => Animated.timing(x, { toValue: to, duration: 45, easing: Easing.linear, useNativeDriver: false })),
    ).start();
  }, [props.trigger, x]);
  return <Animated.View style={{ transform: [{ translateX: x }] }}>{props.children}</Animated.View>;
}

export function Title(props: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.title, props.style]}>{props.children}</Text>;
}
export function Small(props: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.small, props.style]}>{props.children}</Text>;
}

export const s = StyleSheet.create({
  btn: { borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', minHeight: 54 },
  btnBig: { paddingVertical: 20, minHeight: 68 },
  btnText: { fontSize: 17, fontWeight: '800' },
  inspRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  bubble: { flex: 1, backgroundColor: C.manila, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.manilaDark },
  bubbleLabel: { fontSize: 9, letterSpacing: 2, color: '#7a5a2a', fontWeight: '800', marginBottom: 2 },
  bubbleText: { fontFamily: F.type, fontSize: 15, color: C.ink, lineHeight: 20 },
  timerWrap: { height: 7, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 4, overflow: 'hidden', marginVertical: 6 },
  timerFill: { height: 7, borderRadius: 4 },
  peek: { position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 20, backgroundColor: C.ink, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: C.amber },
  peekText: { color: C.manila, fontSize: 14, fontStyle: 'italic' },
  paper: {
    backgroundColor: C.paper,
    borderRadius: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontFamily: F.type, fontSize: 26, color: C.manila, textAlign: 'center' },
  small: { color: C.muted, fontSize: 13, textAlign: 'center' },
});
