import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useApp } from '@/context/AppContext';

export default function MainLayout() {
  const { authLoading, sessionKind } = useApp();

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#071B33', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F6BFF" />
      </View>
    );
  }

  if (sessionKind === 'none') return null;

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
