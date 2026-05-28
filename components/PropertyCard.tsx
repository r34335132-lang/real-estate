import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { Property, formatPrice, getBrokerById } from '@/data/mock';
import { StatusBadge } from '@/components/StatusBadge';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function PropertyCard({ property, onPress, onFavorite, isFavorite }: PropertyCardProps) {
  const colors = useColors();
  const broker = getBrokerById(property.brokerId);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image source={property.image} style={styles.image} resizeMode="cover" />
        <View style={styles.imageOverlay} />
        <View style={styles.topRow}>
          <StatusBadge status={property.status} size="sm" />
          <TouchableOpacity
            onPress={onFavorite}
            style={[styles.favBtn, { backgroundColor: isFavorite ? '#0F6BFF' : 'rgba(255,255,255,0.9)' }]}
            activeOpacity={0.8}
          >
            <Feather name="heart" size={14} color={isFavorite ? '#fff' : '#071B33'} />
          </TouchableOpacity>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.price}>{formatPrice(property.price)}</Text>
          <Text style={styles.priceUnit}> MXN</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {property.title}
        </Text>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.location, { color: colors.mutedForeground }]} numberOfLines={1}>
            {property.location}
          </Text>
        </View>

        <View style={styles.specs}>
          {property.bedrooms !== undefined && (
            <View style={styles.spec}>
              <Feather name="home" size={11} color={colors.mutedForeground} />
              <Text style={[styles.specText, { color: colors.mutedForeground }]}>{property.bedrooms} rec</Text>
            </View>
          )}
          {property.bathrooms !== undefined && (
            <View style={styles.spec}>
              <Feather name="droplet" size={11} color={colors.mutedForeground} />
              <Text style={[styles.specText, { color: colors.mutedForeground }]}>{property.bathrooms} baños</Text>
            </View>
          )}
          <View style={styles.spec}>
            <Feather name="maximize" size={11} color={colors.mutedForeground} />
            <Text style={[styles.specText, { color: colors.mutedForeground }]}>{property.area.toLocaleString()} m²</Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {broker && (
            <View style={styles.brokerRow}>
              <Image source={broker.image} style={styles.brokerAvatar} />
              <View>
                <Text style={[styles.brokerName, { color: colors.foreground }]}>{broker.name}</Text>
                {property.verified && (
                  <View style={styles.verifiedRow}>
                    <Feather name="shield" size={9} color="#22C55E" />
                    <Text style={styles.verifiedText}>Verificado</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          <View style={[styles.detailBtn, { backgroundColor: '#0F6BFF' }]}>
            <Text style={styles.detailText}>Ver</Text>
            <Feather name="arrow-right" size={12} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,27,51,0.15)',
  },
  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(7,27,51,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  price: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  priceUnit: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  body: {
    padding: 16,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  location: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  specs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  brokerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  brokerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  brokerName: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#22C55E',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
