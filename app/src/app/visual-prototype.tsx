import { Redirect } from 'expo-router';
import { PROTOTYPE_ENABLED } from '../prototype/flags';
import { VisualScreen } from '../visual-prototype/VisualScreen';

/** Visual Bluffing Prototype: development builds only (same gate as the Case Logic Prototype). */
export default function VisualPrototypeRoute() {
  if (!PROTOTYPE_ENABLED) return <Redirect href="/" />;
  return <VisualScreen />;
}
