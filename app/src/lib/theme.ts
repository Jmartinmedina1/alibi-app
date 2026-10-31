export const C = {
  ink: '#0F2A30',
  slate: '#1C3F47',
  slate2: '#24505a',
  amber: '#E8A23A',
  amberDark: '#B97A1E',
  manila: '#E9D8B4',
  manilaDark: '#D9C291',
  paper: '#F4EBD6',
  red: '#C23B2E',
  green: '#3E8E5A',
  white: '#FFFFFF',
  muted: 'rgba(233,216,180,0.92)',
  line: 'rgba(233,216,180,0.18)',
};

export const F = {
  type: 'SpecialElite',
};

export const SUSPECT_IMAGES: Record<string, any> = {
  'chef-bruno': require('../../assets/game/suspects/chef-bruno.png'),
  'mr-sterling': require('../../assets/game/suspects/mr-sterling.png'),
  rosa: require('../../assets/game/suspects/rosa.png'),
  'skater-leo': require('../../assets/game/suspects/skater-leo.png'),
  sunny: require('../../assets/game/suspects/sunny.png'),
  'granny-dot': require('../../assets/game/suspects/granny-dot.png'),
  'big-tony': require('../../assets/game/suspects/big-tony.png'),
};
/** Until their portraits are added, these suspects show an emoji badge. */
export const SUSPECT_FALLBACK: Record<string, string> = {};

export const INSPECTOR = {
  default: require('../../assets/game/inspector.png'),
  suspicious: require('../../assets/game/inspector-suspicious.png'),
  shocked: require('../../assets/game/inspector-shocked.png'),
  smug: require('../../assets/game/inspector-smug.png'),
  bored: require('../../assets/game/inspector-bored.png'),
};

export const AVATARS = ['🐬', '🐸', '🦉', '🐙', '🦝', '🐼', '🐂', '🦄'];

/** Illustrated detective portraits for players. Profiles store the emoji; the emoji picks the portrait. */
export const AVATAR_IMAGES: Record<string, any> = {
  '🐬': require('../../assets/game/avatars/dolphin.png'),
  '🐸': require('../../assets/game/avatars/frog.png'),
  '🦉': require('../../assets/game/avatars/owl.png'),
  '🐙': require('../../assets/game/avatars/octopus.png'),
  '🦝': require('../../assets/game/avatars/raccoon.png'),
  '🐼': require('../../assets/game/avatars/panda.png'),
  '🐂': require('../../assets/game/avatars/bull.png'),
  '🦄': require('../../assets/game/avatars/unicorn.png'),
  // retired avatars still in old rooms
  '🦊': require('../../assets/game/avatars/dolphin.png'),
  '🐔': require('../../assets/game/avatars/bull.png'),
};

/** Content column: phone-width and centered, so wide screens scroll at the window edge. */
export const COL = { width: '100%' as const, maxWidth: 520, alignSelf: 'center' as const };
