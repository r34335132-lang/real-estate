import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/catalog';
import { fetchBrokers } from '@/data/services/brokerService';
import { fetchFeatured, fetchRecommended, fetchVerifiedLegal } from '@/data/services/propertyService';
import { PropertyCard } from '@/components/PropertyCard';
import { FeaturedPropertyCard } from '@/components/FeaturedPropertyCard';
import { CategoryCard } from '@/components/CategoryCard';
import { BrokerCard } from '@/components/BrokerCard';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';

export default function HomeScreen() {
  const colors = useColors();
  const { user, preferences, toggleFavorite, isFavorite } = useApp();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const displayName = user?.full_name?.split(' ')[0] ?? 'Usuario';

  const { data: featured = [], isLoading: loadingFeatured } = useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: fetchFeatured,
  });

  const { data: recommendedRaw = [] } = useQuery({
    queryKey: ['properties', 'recommended', preferences],
    queryFn: () =>
      fetchRecommended(
        preferences?.interested_category,
        preferences?.operation_type,
        preferences?.budget_max ?? undefined,
      ),
    enabled: Boolean(preferences),
  });

  const { data: legalVerified = [] } = useQuery({
    queryKey: ['properties', 'legal-verified'],
    queryFn: fetchVerifiedLegal,
  });

  const { data: brokers = [] } = useQuery({
    queryKey: ['brokers'],
    queryFn: fetchBrokers,
  });

  const heroProperty = featured[0];

  const recommended = useMemo(() => {
    let list = recommendedRaw;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q),
      );
    }
    return list.slice(0, 4);
  }, [recommendedRaw, search]);

  const verifiedBrokers = brokers.filter((b) => b.verified);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: '#071B33',
            paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16),
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hola, {displayName}</Text>
            <Text style={styles.headerSubtitle}>Encuentra la propiedad ideal para ti</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/(main)/(tabs)/profile')}>
              <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchWrapper}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onFilterPress={() => router.push('/(main)/(tabs)/categories')}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
        ]}
      >
        {loadingFeatured ? (
          <ActivityIndicator style={{ marginVertical: 24 }} color="#0F6BFF" />
        ) : (
          heroProperty && (
            <TouchableOpacity
              style={styles.heroCard}
              onPress={() => router.push(`/property/${heroProperty.id}`)}
              activeOpacity={0.92}
            >
              <Image source={heroProperty.image} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.heroOverlay} />
              <View style={styles.heroBadge}>
                <Feather name="star" size={12} color="#C8A96B" />
                <Text style={styles.heroBadgeText}>Destacada</Text>
              </View>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {heroProperty.title}
                </Text>
                <Text style={styles.heroLocation}>{heroProperty.location}</Text>
              </View>
            </TouchableOpacity>
          )
        )}

        <View style={styles.section}>
          <SectionHeader title="Categorías" subtitle="Explora por tipo" />
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.slug}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <CategoryCard category={item} onPress={() => router.push(`/category/${item.slug}`)} />
            )}
          />
        </View>

        {preferences && recommended.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Recomendado para ti"
              subtitle={`${CATEGORIES.find((c) => c.slug === preferences.interested_category)?.label ?? ''}`}
              onSeeAll={() => router.push(`/category/${preferences.interested_category}`)}
            />
            <View style={styles.verticalList}>
              {recommended.map((item) => (
                <PropertyCard
                  key={item.id}
                  property={item}
                  onPress={() => router.push(`/property/${item.id}`)}
                  onFavorite={() => void toggleFavorite(item.id)}
                  isFavorite={isFavorite(item.id)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader
            title="Propiedades destacadas"
            subtitle={`${featured.length} exclusividades`}
            onSeeAll={() => router.push('/(main)/(tabs)/categories')}
          />
          <FlatList
            data={featured}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <FeaturedPropertyCard property={item} onPress={() => router.push(`/property/${item.id}`)} />
            )}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Brokers revisados" subtitle="Perfiles revisados por la plataforma" />
          <FlatList
            data={verifiedBrokers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <BrokerCard broker={item} onPress={() => router.push(`/broker/${item.id}`)} />
            )}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Propiedades con revision administrativa" subtitle="Documentacion revisada para publicacion" />
          <View style={styles.verticalList}>
            {legalVerified.slice(0, 3).map((item) => (
              <PropertyCard
                key={item.id}
                property={item}
                onPress={() => router.push(`/property/${item.id}`)}
                onFavorite={() => void toggleFavorite(item.id)}
                isFavorite={isFavorite(item.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  greeting: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  headerSubtitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5, lineHeight: 28 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  searchWrapper: { marginTop: 4 },
  scrollContent: { paddingTop: 20, gap: 8 },
  heroCard: {
    marginHorizontal: 20,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,27,51,0.35)' },
  heroBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(7,27,51,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.4)',
  },
  heroBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#C8A96B' },
  heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 4 },
  heroLocation: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)' },
  section: { marginBottom: 16 },
  horizontalList: { paddingHorizontal: 20, paddingRight: 8 },
  verticalList: { paddingHorizontal: 20 },
});
