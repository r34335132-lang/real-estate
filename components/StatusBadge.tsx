import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';

interface StatusBadgeProps {
  verified?: boolean;
  status?: 'venta' | 'renta';
  size?: 'sm' | 'md';
}

export function StatusBadge({ verified, status, size = 'md' }: StatusBadgeProps) {
  const colors = useColors();
  const isSmall = size === 'sm';

  if (verified !== undefined) {
    return (
      <View style={[styles.badge, { backgroundColor: verified ? '#22C55E20' : '#EF444420' }]}>
        <Feather
          name={verified ? 'shield' : 'alert-circle'}
          size={isSmall ? 10 : 12}
          color={verified ? '#22C55E' : '#EF4444'}
        />
        <Text style={[styles.text, { color: verified ? '#22C55E' : '#EF4444', fontSize: isSmall ? 10 : 11 }]}>
          {verified ? 'Verificado' : 'Sin Verificar'}
        </Text>
      </View>
    );
  }

  if (status) {
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: status === 'venta' ? '#0F6BFF20' : '#C8A96B20' },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: status === 'venta' ? '#0F6BFF' : '#C8A96B', fontSize: isSmall ? 10 : 11 },
          ]}
        >
          {status === 'venta' ? 'En Venta' : 'En Renta'}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});
