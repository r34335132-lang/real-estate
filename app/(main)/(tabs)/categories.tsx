import React, { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActiveFilterChips } from '@/components/ActiveFilterChips';
import { EmptyState } from '@/components/EmptyState';
import { FilterSheet } from '@/components/FilterSheet';
import { PropertyCard } from '@/components/PropertyCard';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, PropertyCategory } from '@/data/mock';
import { usePropertyFilters } from '@/hooks/usePropertyFilters';
import { useColors } from '@/hooks/useColors';

export default function CategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toggleFavorite, isFavorite } = useApp();
  const [selected, setSelected] = useState<PropertyCategory>('casa');
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    draft,
    setDraft,
    applyFilters,
    resetFilters,
    openDraft,
    filtered: filteredByFilters,
    activeChips,
    removeChip,
    setFilters,
  } = usePropertyFilters(selected);

  const filtered = filteredByFilters.filter((p) => p.category === selected);

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
        <Text style={styles.headerTitle}>Categorías</Text>
        <Text style={styles.headerSubtitle}>Explora por tipo de propiedad</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {CATEGORIES.map((cat) => {
            const active = selected === cat.slug;
            return (
              <TouchableOpacity
                key={cat.slug}
                onPress={() => {
                  setSelected(cat.slug);
                  setFilters((f) => ({ ...f, category: cat.slug }));
                  setDraft((d) => ({ ...d, category: cat.slug }));
                }}
                style={[
                  styles.categoryTab,
                  active
                    ? { backgroundColor: '#0F6BFF' }
                    : { backgroundColor: 'rgba(255,255,255,0.1)' },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryTabText, { color: active ? '#fff' : 'rgba(255,255,255,0.6)' }]}>
                  {cat.label}
                </Text>
                <View
                  style={[
                    styles.categoryCount,
                    { backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)' },
                  ]}
                >
                  <Text style={[styles.categoryCountText, { color: active ? '#fff' : 'rgba(255,255,255,0.4)' }]}>
                    {cat.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
        ]}
      >
        {/* Category Hero */}
        {(() => {
          const cat = CATEGORIES.find((c) => c.slug === selected);
          return cat ? (
            <View style={styles.categoryHero}>
              <Image source={cat.image} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>{cat.label}</Text>
                <Text style={styles.heroCount}>{filtered.length} propiedades disponibles</Text>
              </View>
            </View>
          ) : null;
        })()}

        <View style={styles.filterRow}>
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

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <EmptyState
              icon="home"
              title="No hay propiedades"
              subtitle="Prueba otra categoría o ajusta los filtros"
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
        </View>
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
        showBedBath={selected === 'casa' || selected === 'playa'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 16,
  },
  categoryTabs: {
    gap: 8,
    paddingRight: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryTabText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  categoryCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryCountText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollContent: {
    paddingTop: 20,
  },
  categoryHero: {
    height: 160,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,27,51,0.5)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  heroLabel: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
  },
  filterRow: {
    marginBottom: 16,
  },
  filters: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  list: {
    paddingHorizontal: 20,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
