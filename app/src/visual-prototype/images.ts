/** Image assets. The scene is looked up by the key a view carries; Liar views carry no key. */
import type { CardId } from './cards';

export const CARD_IMAGES: Record<CardId, number> = {
  footprints: require('../../assets/visual-prototype/cards/footprints.png'),
  spotlight: require('../../assets/visual-prototype/cards/spotlight.png'),
  key: require('../../assets/visual-prototype/cards/key.png'),
  microphone: require('../../assets/visual-prototype/cards/microphone.png'),
  curtain: require('../../assets/visual-prototype/cards/curtain.png'),
  mask: require('../../assets/visual-prototype/cards/mask.png'),
};
export const SCENE_IMAGES: Record<string, number> = {
  'haunted-house-v1': require('../../assets/visual-prototype/scene.jpg'),
};
