import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider, useApp } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthRedirector() {
  const { authLoading, hasCompletedOnboarding, sessionKind } = useApp();
  const pathname = usePathname();

  useEffect(() => {
    console.log('[nav] root:auth-state', { authLoading, sessionKind, pathname });
    if (authLoading) return;
    if (sessionKind === 'user' && pathname === '/') {
      router.replace(hasCompletedOnboarding ? '/(main)/(tabs)/home' : '/(main)/onboarding');
      return;
    }
    if (sessionKind === 'user' && hasCompletedOnboarding && pathname === '/onboarding') {
      router.replace('/(main)/(tabs)/home');
      return;
    }
    if (sessionKind === 'none' && pathname !== '/' && pathname !== '/privacy' && pathname !== '/terms') {
      console.log('[nav] root:redirect-to-welcome:scheduled', { pathname });
      const redirect = setTimeout(() => {
        console.log('[nav] root:redirect-to-welcome:run');
        router.replace('/');
      }, 0);
      return () => clearTimeout(redirect);
    }
    return undefined;
  }, [authLoading, hasCompletedOnboarding, pathname, sessionKind]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AuthRedirector />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="privacy" />
                  <Stack.Screen name="terms" />
                  <Stack.Screen name="(main)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
