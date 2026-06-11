import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { openSatisfiedClientsPage } from '@/lib/support';

export function SatisfiedClientsButton() {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => void openSatisfiedClientsPage()}
      activeOpacity={0.86}
    >
      <View style={styles.icon}>
        <Feather name="users" size={18} color="#071B33" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Ve algunos de nuestros clientes satisfechos</Text>
        <Text style={styles.subtitle}>Conoce experiencias y referencias externas</Text>
      </View>
      <Feather name="external-link" size={18} color="#C8A96B" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#071B33',
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#C8A96B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
