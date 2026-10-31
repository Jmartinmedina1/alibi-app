import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVATARS } from './theme';

const ALIASES = [
  'Detective Waffles', 'Agent Pickles', 'Inspector Noodle', 'Sergeant Biscuit', 'Captain Custard',
  'Agent Taco', 'Detective Nacho', 'Officer Muffin', 'Agent Churro', 'Inspector Pudding',
  'Detective Pancake', 'Agent Meatball', 'Sergeant Sprinkles', 'Detective Tamale', 'Agent Bagel',
  'Inspector Gumdrop', 'Captain Crouton', 'Agent Empanada', 'Detective Jellybean', 'Officer Pretzel',
];

export interface Profile {
  id: string;
  name: string;
  emoji: string;
}

const KEY = 'alibi.profile.v1';
const ROOM_KEY = 'alibi.room.v1';

function uid() {
  const a = Math.random().toString(36).slice(2, 10);
  const b = Date.now().toString(36).slice(-4);
  return `p_${a}${b}`;
}

export function randomAlias(): string {
  return ALIASES[Math.floor(Math.random() * ALIASES.length)];
}

export async function loadProfile(): Promise<Profile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const p: Profile = JSON.parse(raw);
    // Avatars that were retired get the closest portrait.
    const RETIRED: Record<string, string> = { '🦊': '🐬', '🐔': '🐂' };
    if (!AVATARS.includes(p.emoji)) p.emoji = RETIRED[p.emoji] ?? AVATARS[0];
    return p;
  } catch {
    return null;
  }
}

export async function saveProfile(p: Partial<Profile>): Promise<Profile> {
  const current = (await loadProfile()) ?? { id: uid(), name: randomAlias(), emoji: AVATARS[0] };
  const next = { ...current, ...p };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

/** The room this device is in (so a reload can offer "Rejoin"). Never auto-redirects. */
export async function getSavedRoom(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ROOM_KEY);
  } catch {
    return null;
  }
}
export async function setSavedRoom(code: string | null) {
  try {
    if (code) await AsyncStorage.setItem(ROOM_KEY, code);
    else await AsyncStorage.removeItem(ROOM_KEY);
  } catch {}
}

const PRACTICE_KEY = 'alibi.practiceCount.v1';
/** How many Practice games this device has started (tips and the easy first case depend on it). */
export async function getPracticeCount(): Promise<number> {
  try {
    return Number(await AsyncStorage.getItem(PRACTICE_KEY)) || 0;
  } catch {
    return 0;
  }
}
export async function bumpPracticeCount() {
  try {
    await AsyncStorage.setItem(PRACTICE_KEY, String((await getPracticeCount()) + 1));
  } catch {}
}
