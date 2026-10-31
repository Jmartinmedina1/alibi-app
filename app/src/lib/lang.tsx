import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from '../engine/types';

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'en', setLang: () => {} });
const KEY = 'alibi.lang.v1';

export function LangProvider({ children }: { children: ReactNode }) {
  const device: Lang = getLocales()[0]?.languageCode === 'es' ? 'es' : 'en';
  const [lang, setL] = useState<Lang>(device);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v && setL(v as Lang)).catch(() => {});
  }, []);
  const setLang = (l: Lang) => {
    setL(l);
    AsyncStorage.setItem(KEY, l).catch(() => {});
  };
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);
