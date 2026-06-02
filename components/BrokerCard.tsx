import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { Broker } from '@/data/catalog';

interface BrokerCardProps {
  broker: Broker;
  onPress: () => void;
}

export function BrokerCard({ broker, onPress }: BrokerCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.avatarContainer}>
        <Image source={broker.image} style={styles.avatar} />
        {broker.verified && (
          <View style={styles.verifiedDot}>
            <Feather name="check" size={8} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
        {broker.name.split(' ')[0]}
      </Text>
      <Text style={[styles.title, { color: colors.mutedForeground }]} numberOfLines={1}>
        {broker.specialty.split(' ').slice(0, 3).join(' ')}
      </Text>
      <View style={styles.ratingRow}>
        <Feather name="star" size={11} color="#C8A96B" />
        <Text style={[styles.rating, { color: colors.foreground }]}>{broker.rating}</Text>
        <Text style={[styles.reviews, { color: colors.mutedForeground }]}>({broker.reviews})</Text>
      </View>
      <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: '#0F6BFF' }]}>{broker.activeListings}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Activas</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: '#22C55E' }]}>{broker.closedSales}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Ventas</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#0F6BFF',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  rating: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  reviews: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    width: '100%',
    justifyContent: 'center',
    gap: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 28,
  },
});
