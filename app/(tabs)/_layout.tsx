import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router'; 
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, View, useColorScheme, ActivityIndicator } from 'react-native';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Inicio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="categories">
        <Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} />
        <Label>Categorías</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="publish">
        <Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} />
        <Label>Publicar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="legal">
        <Icon sf={{ default: 'shield', selected: 'shield.fill' }} />
        <Label>Legal</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0F6BFF',
        tabBarInactiveTintColor: '#8B9CB0',
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : '#071B33',
          borderTopWidth: 0,
          elevation: 0,
          height: isWeb ? 84 : 72,
          borderTopColor: 'transparent',
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint="dark"
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7,27,51,0.85)' }]}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#071B33' }]} />
          ),
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
          marginBottom: isWeb ? 0 : 6,
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="categories" options={{ title: 'Categorías', tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
      <Tabs.Screen
        name="publish"
        options={{
          title: 'Publicar',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: focused ? '#0F6BFF' : 'rgba(15,107,255,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: -8, borderWidth: focused ? 0 : 1, borderColor: 'rgba(15,107,255,0.4)' }}>
              <Feather name="plus" size={22} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="legal" options={{ title: 'Legal', tabBarIcon: ({ color }) => <Feather name="shield" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const { authLoading } = useApp();

  // Solo mostramos carga si aún se está leyendo la memoria del teléfono al abrir la app
  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#071B33', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F6BFF" />
      </View>
    );
  }

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}