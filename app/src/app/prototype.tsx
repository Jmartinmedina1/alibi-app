import { Redirect } from 'expo-router';
import { ProtoScreen } from '../prototype/ProtoScreen';
import { PROTOTYPE_ENABLED } from '../prototype/flags';

/** Case Logic Prototype: development builds only (see prototype/flags.ts). */
export default function PrototypeRoute() {
  if (!PROTOTYPE_ENABLED) return <Redirect href="/" />;
  return <ProtoScreen />;
}
