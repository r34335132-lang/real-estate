import React, { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { goBackOr } from '@/lib/navigation';
import { routes } from '@/lib/routes';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActiveFilterChips } from '@/components/ActiveFilterChips';
import { EmptyState } from '@/components/EmptyState';
import { FilterSheet } from '@/components/FilterSheet';
import { PropertyCard } from '@/components/PropertyCard';
import { useApp } from '@/context/AppContext';
import { getCategoryMeta } from '@/data/mock';
import { fetchPropertiesByCategory } from '@/data/services/propertyService';
import { PropertyCategory } from '@/data/types';
import { usePropertyFilters } from '@/hooks/usePropertyFilters';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toggleFavorite, isFavorite } = useApp();
  const categorySlug = slug as PropertyCategory;
  const meta = getCategoryMeta(categorySlug);

  const { data: categorySource = [], isLoading } = useQuery({
    queryKey: ['properties', 'category', categorySlug],
    queryFn: () => fetchPropertiesByCategory(categorySlug),
  });

  const {
    draft,
    setDraft,
    applyFilters,
    resetFilters,
    openDraft,
    filtered,
    activeChips,
    removeChip,
  } = usePropertyFilters(categorySlug, categorySource);

  const [sheetOpen, setSheetOpen] = useState(false);

  const showBedBath = categorySlug === 'casa' || categorySlug === 'playa';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.heroHeader}>
        {meta && (
          <>
            <Image source={meta.image} style={styles.heroBg} resizeMode="cover" />
            <View style={styles.heroOverlay} />
          </>
        )}
        <View style={[styles.heroNav, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => goBackOr(routes.tabs)}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{meta?.routeTitle ?? meta?.label ?? 'Propiedades'}</Text>
          <Text style={styles.heroSubtitle}>{meta?.routeSubtitle ?? ''}</Text>
          <Text style={styles.heroCount}>{filtered.length} inmuebles disponibles</Text>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ActiveFilterChips
          chips={activeChips}
          onRemove={removeChip}
          onOpenFilters={() => {
            openDraft();
            setSheetOpen(true);
          }}
          onClearAll={resetFilters}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 },
        ]}
      >
        {isLoading ? (
          <EmptyState icon="loader" title="Cargando propiedades..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="Sin resultados"
            subtitle="Ajusta los filtros o explora otras categorías"
            actionLabel="Limpiar filtros"
            onAction={resetFilters}
          />
        ) : (
          filtered.map((item) => (
            <PropertyCard
              key={item.id}
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
              onFavorite={() => toggleFavorite(item.id)}
              isFavorite={isFavorite(item.id)}
            />
          ))
        )}
      </ScrollView>

      <FilterSheet
        visible={sheetOpen}
        draft={draft}
        onChange={setDraft}
        onApply={() => {
          applyFilters();
          setSheetOpen(false);
        }}
        onReset={() => {
          resetFilters();
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
        showCategory={false}
        showBedBath={showBedBath}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroHeader: { height: 220, position: 'relative' },
  heroBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,27,51,0.55)' },
  heroNav: { paddingHorizontal: 20, zIndex: 2 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
  },
  heroCount: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#C8A96B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  filterSection: { paddingTop: 16, backgroundColor: '#F3F6FA' },
  list: { paddingHorizontal: 20, paddingTop: 8 },
});
