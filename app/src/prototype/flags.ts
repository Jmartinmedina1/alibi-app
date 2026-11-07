/**
 * The prototype only exists in development builds (Expo dev server / `__DEV__`), or in a web build
 * made on purpose with EXPO_PUBLIC_PROTOTYPE=1. Store/TestFlight builds have neither, so the route
 * redirects home and no entry button is shown. QA controls need __DEV__ or EXPO_PUBLIC_PROTOTYPE_QA=1.
 */
export const PROTOTYPE_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_PROTOTYPE === '1';
export const QA_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_PROTOTYPE_QA === '1';
