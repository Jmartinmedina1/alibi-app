import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const SOURCES = {
  tap: require('../../assets/sounds/tap.wav'),
  tick: require('../../assets/sounds/tick.wav'),
  thud: require('../../assets/sounds/thud.wav'),
  stamp: require('../../assets/sounds/stamp.wav'),
  whoosh: require('../../assets/sounds/whoosh.wav'),
  ding: require('../../assets/sounds/ding.wav'),
  buzzer: require('../../assets/sounds/buzzer.wav'),
  drumroll: require('../../assets/sounds/drumroll.wav'),
  ooh: require('../../assets/sounds/ooh.wav'),
  objection: require('../../assets/sounds/objection.wav'),
};
export type Sfx = keyof typeof SOURCES;

let muted = false;
const players: Partial<Record<Sfx, AudioPlayer>> = {};
let ready = false;

function init() {
  if (ready) return;
  ready = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
}

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

export function play(name: Sfx, volume = 0.6) {
  if (muted) return;
  try {
    init();
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      players[name] = p;
    }
    p.volume = volume;
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    /* audio is a nice-to-have */
  }
}

export function haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else
      Haptics.impactAsync(
        kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
      );
  } catch {}
}
