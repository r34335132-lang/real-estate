import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { goBackOr } from '@/lib/navigation';
import { routes } from '@/lib/routes';
import { fetchPropertyById } from '@/data/services/propertyService';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { formatPrice } from '@/data/catalog';
import { fetchBrokerById } from '@/data/services/brokerService';
import type { OperationType } from '@/data/types';
import { openContactForm } from '@/lib/contactNavigation';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.42;
const OPERATION_LABELS: Record<OperationType, string> = {
  compra: 'Compra',
  venta: 'Venta',
  renta: 'Renta',
  permuta: 'Permuta',
  asesoria: 'Asesoria',
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toggleFavorite, isFavorite, requireAuth } = useApp();
  const [activeImg, setActiveImg] = useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchPropertyById(id ?? ''),
    enabled: Boolean(id),
  });

  const { data: broker } = useQuery({
    queryKey: ['broker', property?.brokerId],
    queryFn: () => fetchBrokerById(property!.brokerId),
    enabled: Boolean(property?.brokerId),
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.mutedForeground }}>Cargando...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.mutedForeground }}>Propiedad no encontrada</Text>
      </View>
    );
  }

  const fav = isFavorite(property.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Image Gallery */}
      <View style={{ height: IMAGE_HEIGHT }}>
        <FlatList
          data={property.images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          onMomentumScrollEnd={(e) => {
            setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          renderItem={({ item }) => (
            <Image source={item} style={{ width, height: IMAGE_HEIGHT }} resizeMode="cover" />
          )}
        />
        <View style={[styles.headerBtns, { top: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => goBackOr(routes.tabs)}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => {
                if (requireAuth('favorite')) toggleFavorite(property.id);
              }}
            >
              <Feather name="heart" size={20} color={fav ? '#EF4444' : '#fff'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <Feather name="share-2" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Dots */}
        {property.images.length > 1 && (
          <View style={styles.dots}>
            {property.images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === activeImg ? '#fff' : 'rgba(255,255,255,0.45)', width: i === activeImg ? 16 : 6 },
                ]}
              />
            ))}
          </View>
        )}
        <View style={styles.imageOverlay} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
        ]}
      >
        {/* Price & Status */}
        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.price, { color: '#0F6BFF' }]}>{formatPrice(property.price)}</Text>
            <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>MXN · {OPERATION_LABELS[property.operation_type]}</Text>
          </View>
          {property.verified && (
            <View style={styles.legalBadge}>
              <Feather name="shield" size={13} color="#22C55E" />
              <Text style={styles.legalBadgeText}>Revision documental</Text>
            </View>
          )}
        </View>

        {/* Title & Location */}
        <Text style={[styles.title, { color: colors.foreground }]}>{property.title}</Text>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color={colors.mutedForeground} />
          <Text style={[styles.location, { color: colors.mutedForeground }]}>{property.location}</Text>
        </View>

        {/* Specs */}
        <View style={[styles.specsCard, { backgroundColor: colors.card }]}>
          {property.bedrooms !== undefined && (
            <View style={styles.spec}>
              <Feather name="home" size={18} color="#0F6BFF" />
              <Text style={[styles.specNum, { color: colors.foreground }]}>{property.bedrooms}</Text>
              <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Rec.</Text>
            </View>
          )}
          {property.bathrooms !== undefined && (
            <View style={styles.spec}>
              <Feather name="droplet" size={18} color="#0F6BFF" />
              <Text style={[styles.specNum, { color: colors.foreground }]}>{property.bathrooms}</Text>
              <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>Baños</Text>
            </View>
          )}
          <View style={styles.spec}>
            <Feather name="maximize" size={18} color="#0F6BFF" />
            <Text style={[styles.specNum, { color: colors.foreground }]}>{property.area.toLocaleString()}</Text>
            <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>m²</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Descripción</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{property.description}</Text>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Amenidades</Text>
          <View style={styles.amenities}>
            {property.amenities.map((a, i) => (
              <View key={i} style={[styles.amenityChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="check" size={12} color="#22C55E" />
                <Text style={[styles.amenityText, { color: colors.foreground }]}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legal Status */}
        <View style={[styles.legalCard, { backgroundColor: '#071B33' }]}>
          <View style={styles.legalHeader}>
            <Feather name="shield" size={20} color="#22C55E" />
            <Text style={styles.legalTitle}>Revision documental</Text>
          </View>
          <Text style={styles.legalStatus}>{property.legalStatus}</Text>
          <TouchableOpacity
            style={styles.legalBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(main)/(tabs)/legal')}
          >
            <Text style={styles.legalBtnText}>Ver informacion documental</Text>
            <Feather name="arrow-right" size={14} color="#22C55E" />
          </TouchableOpacity>
        </View>

        {/* Broker */}
        {broker && (
          <TouchableOpacity
            style={[styles.brokerCard, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/broker/${broker.id}`)}
            activeOpacity={0.88}
          >
            <Image source={broker.image} style={styles.brokerAvatar} />
            <View style={styles.brokerInfo}>
              <Text style={[styles.brokerName, { color: colors.foreground }]}>{broker.name}</Text>
              <Text style={[styles.brokerTitle, { color: colors.mutedForeground }]}>{broker.title}</Text>
              <View style={styles.brokerMeta}>
                <Feather name="star" size={12} color="#C8A96B" />
                <Text style={[styles.brokerRating, { color: colors.foreground }]}>{broker.rating}</Text>
                <Text style={[styles.brokerExp, { color: colors.mutedForeground }]}>· {broker.experience} años exp.</Text>
              </View>
            </View>
            <View style={styles.brokerBadge}>
              {broker.verified && <Feather name="shield" size={14} color="#22C55E" />}
              <Feather name="chevron-right" size={16} color={colors.border} />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.cta,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={() => {
            if (!requireAuth('contact')) return;
            openContactForm({
              interest: property.operation_type === 'renta' ? 'rentar' : 'comprar',
              propertyId: property.id,
              propertyTitle: property.title,
              propertyPrice: `${formatPrice(property.price)} MXN`,
              propertyLocation: property.location,
              propertyReference: `Propiedad ${property.id}`,
            });
          }}
          activeOpacity={0.85}
        >
          <Feather name="message-circle" size={18} color="#22C55E" />
          <Text style={styles.whatsappText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => {
            if (!requireAuth('appointment')) return;
            openContactForm({
              interest: property.operation_type === 'renta' ? 'rentar' : 'comprar',
              message: 'Quiero solicitar una visita para esta propiedad.',
              propertyId: property.id,
              propertyTitle: property.title,
              propertyPrice: `${formatPrice(property.price)} MXN`,
              propertyLocation: property.location,
              propertyReference: `Propiedad ${property.id}`,
            });
          }}
          activeOpacity={0.85}
        >
          <Feather name="calendar" size={16} color="#fff" />
          <Text style={styles.ctaBtnText}>Agendar Visita</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtns: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(7,27,51,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  dots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  legalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  legalBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#22C55E',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -10,
  },
  location: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  specsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  spec: {
    alignItems: 'center',
    gap: 4,
  },
  specNum: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  specLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  amenityText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  legalCard: {
    borderRadius: 18,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  legalStatus: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#22C55E',
  },
  legalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  legalBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#22C55E',
  },
  brokerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  brokerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#0F6BFF',
  },
  brokerInfo: {
    flex: 1,
    gap: 3,
  },
  brokerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  brokerTitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  brokerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brokerRating: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  brokerExp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  brokerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cta: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  whatsappText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#22C55E',
  },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#0F6BFF',
    shadowColor: '#0F6BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
