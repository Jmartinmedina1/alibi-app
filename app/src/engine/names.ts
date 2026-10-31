// Player-name safety: names are free text, so the server cleans every name it accepts.
// Not a perfect filter — kids' safety also relies on preset names for under-13s and the host's kick button.

// Caught anywhere, even hidden inside a longer word ("xxfuckxx", "f u c k").
const STRONG = [
  'fuck', 'fuk', 'shit', 'bitch', 'cunt', 'pussy', 'penis', 'vagina', 'slut', 'whore', 'porn', 'rapist', 'molest', 'pedophil',
  'nigg', 'faggot', 'retard', 'hitler', 'jizz', 'dildo', 'asshole', 'onlyfans', 'motherfuck',
  'putamadre', 'hijodeputa', 'hijoeputa', 'putita', 'mierda', 'pendej', 'cabron', 'verga', 'chinga', 'culero', 'gilipollas', 'maricon', 'panocha',
];
// Only as whole words, because they hide inside real names (Ana Lopez, Analisa, Cumberbatch, Killian, Dickens).
const WORDS = [
  'fck', 'sht', 'btch', 'dick', 'cock', 'boob', 'boobs', 'tits', 'titty', 'hoe', 'sex', 'sexy', 'nude', 'naked', 'rape', 'pedo', 'nazi', 'kkk',
  'fag', 'tranny', 'spic', 'chink', 'kike', 'coon', 'gook', 'kill', 'killer', 'suicide', 'kys', 'murder', 'terrorist', 'isis', 'jihad',
  'cum', 'anal', 'anus', 'butthole', 'horny', 'milf', 'bastard', 'damn', 'crap', 'piss', 'wanker', 'twat', 'prick', 'douche',
  'puta', 'puto', 'putas', 'culo', 'cono', 'joder', 'marica', 'zorra', 'perra', 'polla', 'pija', 'concha', 'mamada', 'mamon', 'huevon', 'pinche',
  'idiota', 'estupido', 'estupida', 'imbecil', 'violar', 'violador', 'matar', 'suicidio', 'sudaca',
];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '|': 'i' };

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[01345789@$!|]/g, (c) => LEET[c] ?? c)
    .replace(/[^a-zñ ]/g, '')
    .replace(/(.)\1{2,}/g, '$1$1'); // fuuuuck -> fuuck
}

/** True when a name looks offensive. Checks words, the whole name squashed together, and repeated letters squeezed. */
export function isBadName(name: string): boolean {
  const n = normalize(name);
  const squashed = n.replace(/ /g, '');
  const squeezed = squashed.replace(/(.)\1+/g, '$1');
  for (const w of STRONG) if (squashed.includes(w) || squeezed.includes(w)) return true;
  const words = n.split(' ').filter(Boolean);
  const squeezedWords = words.map((w) => w.replace(/(.)\1+/g, '$1'));
  for (const w of WORDS) if (words.includes(w) || squeezedWords.includes(w) || squashed === w) return true;
  return false;
}

/** Trim, strip control/odd characters, cap at 18; returns null if empty or offensive. */
export function cleanName(raw: string): string | null {
  const s = (raw ?? '')
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮⁠-⁯]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18);
  if (!s) return null;
  if (!/[\p{L}\p{N}]/u.test(s)) return null;
  if (/https?:|www\.|\.com|@/i.test(s)) return null; // no links or handles
  if (isBadName(s)) return null;
  return s;
}

/** Avatars a player may pick (anything else is replaced, so the emoji field can't carry text). */
export const ALLOWED_AVATARS = ['🐬', '🐸', '🦉', '🐙', '🦝', '🐼', '🐂', '🦄', '🦊', '🐔'];
export const cleanAvatar = (e: string) => (ALLOWED_AVATARS.includes(e) ? e : '🐬');
