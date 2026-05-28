import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PropertyFilters } from '@/hooks/usePropertyFilters';
import { CATEGORIES } from '@/data/mock';
import { LegalStatus, OperationType, PropertyCategory } from '@/data/types';

interface FilterSheetProps {
  visible: boolean;
  draft: PropertyFilters;
  onChange: (draft: PropertyFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  showCategory?: boolean;
  showBedBath?: boolean;
}

const LEGAL_OPTIONS: { value: LegalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'verificada', label: 'Verificada' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'pendiente', label: 'Pendiente' },
];

const PRICE_PRESETS = [
  { label: 'Hasta $5M', min: null, max: 5_000_000 },
  { label: '$5M - $20M', min: 5_000_000, max: 20_000_000 },
  { label: '$20M - $50M', min: 20_000_000, max: 50_000_000 },
  { label: '+$50M', min: 50_000_000, max: null },
];

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function FilterSheet({
  visible,
  draft,
  onChange,
  onApply,
  onReset,
  onClose,
  showCategory = true,
  showBedBath = true,
}: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const set = (partial: Partial<PropertyFilters>) => onChange({ ...draft, ...partial });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <TouchableOpacity onPress={onReset}>
              <Text style={styles.resetLink}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {showCategory && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Categoría</Text>
                <View style={styles.pillRow}>
                  {CATEGORIES.map((c) => (
                    <Pill
                      key={c.slug}
                      label={c.label}
                      active={draft.category === c.slug}
                      onPress={() =>
                        set({ category: draft.category === c.slug ? undefined : (c.slug as PropertyCategory) })
                      }
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Operación</Text>
              <View style={styles.pillRow}>
                <Pill label="Todos" active={draft.operationType === 'all'} onPress={() => set({ operationType: 'all' })} />
                <Pill
                  label="Venta"
                  active={draft.operationType === 'venta'}
                  onPress={() => set({ operationType: 'venta' as OperationType })}
                />
                <Pill
                  label="Renta"
                  active={draft.operationType === 'renta'}
                  onPress={() => set({ operationType: 'renta' as OperationType })}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Ubicación</Text>
              <View style={styles.inputWrap}>
                <Feather name="map-pin" size={16} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Ciudad, estado o zona..."
                  placeholderTextColor="#9CA3AF"
                  value={draft.location}
                  onChangeText={(t) => set({ location: t })}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Rango de precio</Text>
              <View style={styles.pillRow}>
                {PRICE_PRESETS.map((p) => (
                  <Pill
                    key={p.label}
                    label={p.label}
                    active={draft.priceMin === p.min && draft.priceMax === p.max}
                    onPress={() => set({ priceMin: p.min, priceMax: p.max })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Estatus legal</Text>
              <View style={styles.pillRow}>
                {LEGAL_OPTIONS.map((o) => (
                  <Pill
                    key={o.value}
                    label={o.label}
                    active={draft.legalStatus === o.value}
                    onPress={() => set({ legalStatus: o.value })}
                  />
                ))}
              </View>
            </View>

            {showBedBath && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Recámaras (mín.)</Text>
                  <View style={styles.pillRow}>
                    {[null, 2, 3, 4, 5].map((n) => (
                      <Pill
                        key={String(n)}
                        label={n ? `${n}+` : 'Cualquiera'}
                        active={draft.bedrooms === n}
                        onPress={() => set({ bedrooms: n })}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Baños (mín.)</Text>
                  <View style={styles.pillRow}>
                    {[null, 1, 2, 3, 4].map((n) => (
                      <Pill
                        key={String(n)}
                        label={n ? `${n}+` : 'Cualquiera'}
                        active={draft.bathrooms === n}
                        onPress={() => set({ bathrooms: n })}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.88}>
            <Text style={styles.applyText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,27,51,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E9F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#071B33',
  },
  resetLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F6BFF',
  },
  scroll: {
    maxHeight: 420,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#071B33',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F6FA',
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  pillActive: {
    backgroundColor: '#071B33',
    borderColor: '#071B33',
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F6FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#071B33',
  },
  applyBtn: {
    backgroundColor: '#0F6BFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  applyText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
