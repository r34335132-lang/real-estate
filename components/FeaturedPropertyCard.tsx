import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { Property, formatPrice } from '@/data/catalog';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78;

interface FeaturedPropertyCardProps {
  property: Property;
  onPress: () => void;
}

export function FeaturedPropertyCard({ property, onPress }: FeaturedPropertyCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH }]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <Image source={property.image} style={styles.image} resizeMode="cover" />
      <View style={styles.gradient} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.featuredBadge}>
            <Feather name="star" size={10} color="#C8A96B" />
            <Text style={styles.featuredText}>Destacado</Text>
          </View>
          {property.verified && (
            <View style={styles.verifiedBadge}>
              <Feather name="shield" size={10} color="#22C55E" />
              <Text style={styles.verifiedText}>Legal</Text>
            </View>
          )}
        </View>

        <View style={styles.bottom}>
          <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.location} numberOfLines={1}>{property.location}</Text>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>Precio</Text>
              <Text style={styles.price}>{formatPrice(property.price)} MXN</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7,27,51,0.38)',
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200,169,107,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  featuredText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#C8A96B',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#22C55E',
  },
  bottom: {
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
});
