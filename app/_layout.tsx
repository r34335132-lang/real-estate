import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GuestGateModal } from '@/components/GuestGateModal';
import { AppProvider, useApp } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, authLoading, isGuest, hasCompletedOnboarding } = useApp();
  const segments = useSegments();

  useEffect(() => {
    // 1. Si la app apenas está leyendo la memoria, no hacemos nada.
    if (authLoading) return;

    // Detectamos en qué parte de la app estamos
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated) {
      // 2. Si NO hay sesión y está adentro de la app, ¡Pa' fuera!
      if (inTabsGroup || inOnboarding) {
        setTimeout(() => router.replace('/'), 0);
      }
    } else {
      // 3. Si SÍ hay sesión (Invitado o Registrado)
      if (isGuest) {
        // Invitados van directo a los tabs, sin onboarding
        if (!inTabsGroup) {
          setTimeout(() => router.replace('/(tabs)'), 0);
        }
      } else {
        // Usuarios verifican sus preferencias (onboarding)
        if (!hasCompletedOnboarding) {
          if (!inOnboarding) {
            setTimeout(() => router.replace('/onboarding'), 0);
          }
        } else {
          // Todo completo, van a los tabs
          if (!inTabsGroup) {
            setTimeout(() => router.replace('/(tabs)'), 0);
          }
        }
      }
    }
  }, [isAuthenticated, authLoading, isGuest, hasCompletedOnboarding, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="property/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="broker/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
    </Stack>
  );
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
                <RootLayoutNav />
                <GuestGateModal />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}