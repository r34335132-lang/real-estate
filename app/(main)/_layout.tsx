import { Redirect, Stack, usePathname } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useApp } from '@/context/AppContext';
import { routes } from '@/lib/routes';

export default function MainLayout() {
  const { sessionKind, authLoading, hasCompletedOnboarding } = useApp();
  const pathname = usePathname();

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#071B33', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F6BFF" />
      </View>
    );
  }

  if (sessionKind === 'none') {
    return <Redirect href={routes.welcome} />;
  }

  const onOnboarding = pathname.startsWith('/onboarding');
  const onCategory = pathname.startsWith('/category');

  if (sessionKind === 'guest' && !hasCompletedOnboarding && !onOnboarding && !onCategory) {
    return <Redirect href={routes.onboarding} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="property/[id]" />
      <Stack.Screen name="broker/[id]" />
      <Stack.Screen name="category/[slug]" />
    </Stack>
  );
}
