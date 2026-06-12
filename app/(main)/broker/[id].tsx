import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { goBackOr } from '@/lib/navigation';
import { routes } from '@/lib/routes';
import { fetchBrokerById } from '@/data/services/brokerService';
import { fetchByBroker } from '@/data/services/propertyService';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { PropertyCard } from '@/components/PropertyCard';
import { useApp } from '@/context/AppContext';
import { openContactForm } from '@/lib/contactNavigation';
import { fetchMyBrokerRating, saveBrokerRating } from '@/data/services/reviewService';

const { width } = Dimensions.get('window');

export default function BrokerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { toggleFavorite, isFavorite, requireAuth, role, user } = useApp();
  const [selectedRating, setSelectedRating] = useState(0);
  const [savingRating, setSavingRating] = useState(false);

  const { data: broker, isLoading } = useQuery({
    queryKey: ['broker', id],
    queryFn: () => fetchBrokerById(id ?? ''),
    enabled: Boolean(id),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['broker-properties', id],
    queryFn: () => fetchByBroker(id ?? ''),
    enabled: Boolean(id),
  });

  const { data: myRating } = useQuery({
    queryKey: ['broker-rating', user?.id, id],
    queryFn: () => fetchMyBrokerRating(user!.id, id ?? ''),
    enabled: Boolean(user?.id && id && role === 'buyer'),
  });

  useEffect(() => {
    setSelectedRating(myRating ?? 0);
  }, [myRating]);

  const handleSaveRating = async () => {
    if (!user || role !== 'buyer') {
      Alert.alert('Inicia sesion', 'Solo los clientes registrados pueden calificar brokers.');
      return;
    }
    if (!id || selectedRating < 1 || savingRating) return;

    setSavingRating(true);
    try {
      await saveBrokerRating(user.id, id, selectedRating);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['broker', id] }),
        queryClient.invalidateQueries({ queryKey: ['brokers'] }),
        queryClient.invalidateQueries({ queryKey: ['broker-rating', user.id, id] }),
      ]);
      Alert.alert('Calificacion guardada', 'Gracias por compartir tu experiencia.');
    } catch (error) {
      Alert.alert(
        'No se pudo guardar',
        error instanceof Error ? error.message : 'Intenta nuevamente.',
      );
    } finally {
      setSavingRating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.mutedForeground }}>Cargando...</Text>
      </View>
    );
  }

  if (!broker) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.mutedForeground }}>Broker no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }}
      >
        {/* Hero Header */}
        <View style={[styles.hero, { backgroundColor: '#071B33', paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20) }]}>
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
            onPress={() => goBackOr(routes.tabs)}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.avatarWrap}>
              <Image source={broker.image} style={styles.avatar} />
              {broker.verified && (
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
              )}
            </View>

            <Text style={styles.name}>{broker.name}</Text>
            <Text style={styles.brokerTitle}>{broker.title}</Text>
            <Text style={styles.company}>{broker.company}</Text>

            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color="rgba(255,255,255,0.55)" />
              <Text style={styles.location}>{broker.location}</Text>
            </View>

            {/* Rating */}
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Feather
                  key={i}
                  name="star"
                  size={16}
                  color={i <= Math.floor(broker.rating) ? '#C8A96B' : 'rgba(200,169,107,0.3)'}
                />
              ))}
              <Text style={styles.ratingNum}>{broker.rating}</Text>
              <Text style={styles.reviews}>({broker.reviews} reseñas)</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{broker.experience}</Text>
              <Text style={styles.statLabel}>Años</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{broker.activeListings}</Text>
              <Text style={styles.statLabel}>Activas</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{broker.closedSales}</Text>
              <Text style={styles.statLabel}>Ventas</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{broker.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {broker.verified && (
            <View style={styles.verifiedBanner}>
              <Feather name="shield" size={14} color="#22C55E" />
              <Text style={styles.verifiedBannerText}>Broker verificado</Text>
            </View>
          )}

          {/* Contact Buttons */}
          <View style={styles.contactBtns}>
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: '#0F6BFF', flex: 2 }]}
              onPress={() => {
                if (!requireAuth('contact')) return;
                openContactForm({
                  interest: 'asesoria',
                  message: `Quiero recibir asesoria inmobiliaria con ${broker.name}.`,
                });
              }}
              activeOpacity={0.85}
            >
              <Feather name="phone" size={16} color="#fff" />
              <Text style={styles.contactBtnText}>Contactar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: '#22C55E', flex: 2 }]}
              onPress={() => {
                if (!requireAuth('contact')) return;
                openContactForm({
                  interest: 'asesoria',
                  message: `Quiero recibir asesoria inmobiliaria con ${broker.name}.`,
                });
              }}
              activeOpacity={0.85}
            >
              <Feather name="message-circle" size={16} color="#fff" />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => {
                if (!requireAuth('contact')) return;
                openContactForm({
                  interest: 'asesoria',
                  message: `Quiero recibir asesoria inmobiliaria con ${broker.name}.`,
                });
              }}
            >
              <Feather name="mail" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {role === 'buyer' && (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                <Feather name="star" size={16} color="#C8A96B" />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  Califica tu experiencia
                </Text>
              </View>
              <View style={styles.ratingEditor}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={styles.ratingStarButton}
                      onPress={() => setSelectedRating(rating)}
                      disabled={savingRating}
                      accessibilityLabel={`${rating} estrellas`}
                    >
                      <Feather
                        name="star"
                        size={26}
                        color={rating <= selectedRating ? '#C8A96B' : colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.ratingSaveButton,
                    (selectedRating === 0 || savingRating) && styles.ratingSaveDisabled,
                  ]}
                  onPress={() => void handleSaveRating()}
                  disabled={selectedRating === 0 || savingRating}
                >
                  {savingRating ? (
                    <ActivityIndicator size="small" color="#071B33" />
                  ) : (
                    <Text style={styles.ratingSaveText}>
                      {myRating ? 'Actualizar' : 'Guardar'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Specialty */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Feather name="briefcase" size={16} color="#C8A96B" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Especialidad</Text>
            </View>
            <Text style={[styles.specialty, { color: colors.foreground }]}>{broker.specialty}</Text>
          </View>

          {/* Bio */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Feather name="user" size={16} color="#0F6BFF" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sobre mí</Text>
            </View>
            <Text style={[styles.bio, { color: colors.mutedForeground }]}>{broker.bio}</Text>
          </View>

          {/* Certifications */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Feather name="award" size={16} color="#C8A96B" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Certificaciones</Text>
            </View>
            {broker.certifications.map((cert, i) => (
              <View key={i} style={[styles.certRow, i < broker.certifications.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.certDot}>
                  <Feather name="check" size={10} color="#fff" />
                </View>
                <Text style={[styles.certText, { color: colors.foreground }]}>{cert}</Text>
              </View>
            ))}
          </View>

          {/* Social */}
          {(broker.instagram || broker.linkedin) && (
            <View style={styles.socialRow}>
              {broker.instagram && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.8}
                >
                  <Feather name="instagram" size={18} color="#E1306C" />
                  <Text style={[styles.socialText, { color: colors.foreground }]}>{broker.instagram}</Text>
                </TouchableOpacity>
              )}
              {broker.linkedin && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.8}
                >
                  <Feather name="linkedin" size={18} color="#0077B5" />
                  <Text style={[styles.socialText, { color: colors.foreground }]}>LinkedIn</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Properties */}
          {properties.length > 0 && (
            <>
              <Text style={[styles.propSectionTitle, { color: colors.foreground }]}>
                Propiedades Activas ({properties.length})
              </Text>
              {properties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  onPress={() => router.push(`/property/${prop.id}`)}
                  onFavorite={() => toggleFavorite(prop.id)}
                  isFavorite={isFavorite(prop.id)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingBottom: 0,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#0F6BFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#071B33',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  brokerTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 2,
  },
  company: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#C8A96B',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  location: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.55)',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNum: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginLeft: 4,
  },
  ratingEditor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingStarButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  ratingSaveButton: {
    minWidth: 88,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#C8A96B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  ratingSaveDisabled: { opacity: 0.45 },
  ratingSaveText: { color: '#071B33', fontSize: 13, fontFamily: 'Inter_700Bold' },
  reviews: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.45)',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    marginBottom: 4,
  },
  verifiedBannerText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#22C55E',
  },
  contactBtns: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  contactIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  specialty: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  bio: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  certDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  socialText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  propSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
    marginBottom: 4,
  },
});
