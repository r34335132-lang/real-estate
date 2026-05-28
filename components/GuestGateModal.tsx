import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useApp } from '@/context/AppContext';

export function GuestGateModal() {
  const { guestGate, hideGuestGate, logout } = useApp(); 

  const handleCreateAccount = async () => {
    hideGuestGate();
    // Destruimos la sesión de invitado (el nuevo AuthGuard se encarga del resto sin crashear)
    await logout(); 
    router.replace('/');
  };

  return (
    <Modal visible={guestGate.visible} transparent animationType="fade" onRequestClose={hideGuestGate}>
      <Pressable style={styles.overlay} onPress={hideGuestGate}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Feather name="lock" size={28} color="#0F6BFF" />
          </View>
          <Text style={styles.title}>{guestGate.title}</Text>
          <Text style={styles.message}>{guestGate.message}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateAccount} activeOpacity={0.88}>
            <Text style={styles.primaryText}>{guestGate.actionLabel ?? 'Crear cuenta'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={hideGuestGate} activeOpacity={0.8}>
            <Text style={styles.secondaryText}>Seguir explorando</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,27,51,0.65)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#071B33',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#0F6BFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  secondaryBtn: {
    paddingVertical: 10,
  },
  secondaryText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
});