import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { goBackOr } from '@/lib/navigation';
import { routes } from '@/lib/routes';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { BUDGET_OPTIONS } from '@/data/mockPreferences';
import { CATEGORIES } from '@/data/mock';
import { BudgetRange, PropertyCategory } from '@/data/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

type Step = 'category' | 'operation' | 'budget' | 'location';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setPreferences, completeOnboarding } = useApp();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<PropertyCategory>('casa');
  const [operation, setOperation] = useState<'venta' | 'renta'>('venta');
  const [budget, setBudget] = useState<BudgetRange>('undefined');
  const [location, setLocation] = useState('');

  const steps: Step[] = ['category', 'operation', 'budget', 'location'];
  const stepIndex = steps.indexOf(step);

  const finish = async () => {
    const budgetOpt = BUDGET_OPTIONS.find((b) => b.id === budget)!;
    await setPreferences({
      interested_category: category,
      operation_type: operation,
      preferred_location: location,
      budget_min: budgetOpt.min,
      budget_max: budgetOpt.max,
      budget_range: budget,
    });
    completeOnboarding();
    router.replace(`/category/${category}`);
  };

  const next = () => {
    if (step === 'category') setStep('operation');
    else if (step === 'operation') setStep('budget');
    else if (step === 'budget') setStep('location');
    else finish();
  };

  const back = () => {
    if (step === 'operation') setStep('category');
    else if (step === 'budget') setStep('operation');
    else if (step === 'location') setStep('budget');
    else goBackOr(routes.tabs);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={back}>
          <Feather name="arrow-left" size={20} color="#071B33" />
        </TouchableOpacity>
        <View style={styles.progress}>
          {steps.map((s, i) => (
            <View key={s} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {step === 'category' && (
          <>
            <Text style={styles.question}>¿Qué estás buscando hoy?</Text>
            <Text style={styles.hint}>Selecciona el tipo de propiedad que te interesa</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.slug;
                return (
                  <TouchableOpacity
                    key={cat.slug}
                    style={[styles.categoryCard, active && styles.categoryCardActive]}
                    onPress={() => setCategory(cat.slug)}
                    activeOpacity={0.9}
                  >
                    <Image source={cat.image} style={styles.categoryImage} />
                    <View style={[styles.categoryOverlay, active && styles.categoryOverlayActive]} />
                    <View style={styles.categoryContent}>
                      <Feather
                        name={cat.icon as keyof typeof Feather.glyphMap}
                        size={22}
                        color={active ? '#C8A96B' : '#fff'}
                      />
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                    </View>
                    {active && (
                      <View style={styles.checkMark}>
                        <Feather name="check" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 'operation' && (
          <>
            <Text style={styles.question}>¿Quieres comprar o rentar?</Text>
            <Text style={styles.hint}>Define el tipo de operación</Text>
            <View style={styles.operationRow}>
              {(
                [
                  { id: 'venta' as const, label: 'Comprar', icon: 'key' as const, desc: 'Adquirir propiedad' },
                  { id: 'renta' as const, label: 'Rentar', icon: 'calendar' as const, desc: 'Arrendamiento' },
                ] as const
              ).map((op) => {
                const active = operation === op.id;
                return (
                  <TouchableOpacity
                    key={op.id}
                    style={[styles.operationCard, active && styles.operationCardActive]}
                    onPress={() => setOperation(op.id)}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.operationIcon, active && { backgroundColor: '#0F6BFF' }]}>
                      <Feather name={op.icon} size={28} color={active ? '#fff' : '#0F6BFF'} />
                    </View>
                    <Text style={[styles.operationLabel, active && { color: '#071B33' }]}>{op.label}</Text>
                    <Text style={styles.operationDesc}>{op.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 'budget' && (
          <>
            <Text style={styles.question}>Presupuesto aproximado</Text>
            <Text style={styles.hint}>Nos ayuda a mostrarte opciones relevantes</Text>
            <View style={styles.budgetList}>
              {BUDGET_OPTIONS.map((b) => {
                const active = budget === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.budgetItem, active && styles.budgetItemActive]}
                    onPress={() => setBudget(b.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.budgetLabel, active && styles.budgetLabelActive]}>{b.label}</Text>
                    {active && <Feather name="check-circle" size={20} color="#0F6BFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 'location' && (
          <>
            <Text style={styles.question}>Ubicación de interés</Text>
            <Text style={styles.hint}>Ciudad, estado o zona preferida</Text>
            <View style={styles.locationInput}>
              <Feather name="search" size={20} color="#6B7280" />
              <TextInput
                style={styles.locationField}
                placeholder="Ej. CDMX, Cancún, Monterrey..."
                placeholderTextColor="#9CA3AF"
                value={location}
                onChangeText={setLocation}
              />
            </View>
            <View style={styles.quickLocations}>
              {['CDMX', 'Cancún', 'Monterrey', 'Los Cabos', 'Puerto Vallarta'].map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.locChip, location === loc && styles.locChipActive]}
                  onPress={() => setLocation(loc)}
                >
                  <Text style={[styles.locChipText, location === loc && styles.locChipTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.88}>
          <Text style={styles.nextText}>{step === 'location' ? 'Ver propiedades' : 'Continuar'}</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
        {step === 'location' && (
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Omitir ubicación</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FA' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E9F0',
  },
  dotActive: { backgroundColor: '#0F6BFF', width: 24 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  question: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#071B33',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginBottom: 28,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardActive: { borderColor: '#0F6BFF' },
  categoryImage: { width: '100%', height: '100%' },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,27,51,0.45)',
  },
  categoryOverlayActive: { backgroundColor: 'rgba(15,107,255,0.35)' },
  categoryContent: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    gap: 6,
  },
  categoryLabel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  checkMark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operationRow: { flexDirection: 'row', gap: 14 },
  operationCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E9F0',
  },
  operationCardActive: { borderColor: '#0F6BFF' },
  operationIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  operationLabel: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#6B7280',
    marginBottom: 4,
  },
  operationDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#9CA3AF',
  },
  budgetList: { gap: 10 },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  budgetItemActive: { borderColor: '#0F6BFF', backgroundColor: '#EEF3FF' },
  budgetLabel: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#071B33' },
  budgetLabelActive: { fontFamily: 'Inter_600SemiBold', color: '#0F6BFF' },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    marginBottom: 16,
  },
  locationField: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#071B33',
  },
  quickLocations: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  locChipActive: { backgroundColor: '#071B33', borderColor: '#071B33' },
  locChipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  locChipTextActive: { color: '#fff' },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#F3F6FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E9F0',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F6BFF',
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#6B7280' },
});
