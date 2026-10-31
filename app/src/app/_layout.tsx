import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LangProvider } from '../lib/lang';
import { C } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const NAV_THEME = { ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent', card: 'transparent' } };

export default function Root() {
  const [loaded] = useFonts({ SpecialElite: require('../../assets/fonts/SpecialElite-Regular.ttf') });
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <LangProvider>
        <StatusBar style="light" />
        <ImageBackground source={require('../../assets/game/bg.jpg')} style={st.bg} resizeMode="cover" blurRadius={6} imageStyle={{ width: '100%', height: '100%' }}>
          <View style={st.shade}>
            <SafeAreaView style={st.safe} edges={['top', 'bottom']}>
              <View style={st.column}>
                <ThemeProvider value={NAV_THEME}>
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'fade' }} />
                </ThemeProvider>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </LangProvider>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  bg: { flex: 1, backgroundColor: C.ink },
  shade: { flex: 1, backgroundColor: 'rgba(15,42,48,0.82)' },
  safe: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
});
