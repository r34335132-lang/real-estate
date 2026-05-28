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
    // 1. Si está cargando la sesión de la base de datos, no hacemos nada
    if (authLoading) return;

    // 2. Revisamos en qué parte de la app está el usuario
    const inRoot = segments.length === 0;
    const isIndex = segments[0] === 'index' || inRoot;
    const isOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated) {
      // 3. Si NO hay sesión (Cerró sesión), lo forzamos al index
      if (!isIndex) {
        router.replace('/');
      }
    } else {
      // 4. Si SÍ hay sesión (Invitado o Usuario)
      if (isGuest) {
        // Invitados no hacen onboarding, van directo a los tabs
        if (isIndex || isOnboarding) {
          router.replace('/(tabs)');
        }
      } else {
        // Usuarios verifican onboarding
        if (!hasCompletedOnboarding) {
          if (!isOnboarding) {
            router.replace('/onboarding');
          }
        } else {
          // Todo listo, van a los tabs
          if (isIndex || isOnboarding) {
            router.replace('/(tabs)');
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