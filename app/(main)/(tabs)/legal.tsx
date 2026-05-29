import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

interface LegalOption {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
  badge?: string;
}

const OPTIONS: LegalOption[] = [
  {
    icon: 'file-text',
    title: 'Generar Contrato',
    description: 'Contratos de compraventa, arrendamiento y promesa de venta certificados.',
    color: '#0F6BFF',
    badge: 'Nuevo',
  },
  {
    icon: 'check-circle',
    title: 'Validar Propiedad',
    description: 'Verificación de documentos, escrituras y situación jurídica del inmueble.',
    color: '#22C55E',
  },
  {
    icon: 'edit-3',
    title: 'Firma Electrónica',
    description: 'Firma digital con validez jurídica plena. Proceso seguro y rápido.',
    color: '#C8A96B',
  },
  {
    icon: 'users',
    title: 'Asesoría Legal',
    description: 'Consulta con abogados especializados en bienes raíces y derecho inmobiliario.',
    color: '#A78BFA',
  },
  {
    icon: 'search',
    title: 'Revisión de Documentos',
    description: 'Análisis y revisión legal de toda la documentación de la transacción.',
    color: '#F472B6',
  },
  {
    icon: 'lock',
    title: 'Fideicomiso',
    description: 'Constitución y gestión de fideicomisos para extranjeros y zonas restringidas.',
    color: '#34D399',
  },
];

const TRUST_POINTS = [
  '15 años de experiencia legal inmobiliaria',
  'Red de abogados certificados AMPI',
  'Revisión en menos de 48 horas',
  'Contratos con validez en toda la República',
];

export default function LegalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

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
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Feather name="shield" size={26} color="#22C55E" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Protección Legal JC</Text>
            <Text style={styles.headerSubtitle}>Respaldo jurídico para tu inversión</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
        ]}
      >
        {/* Trust Banner */}
        <View style={styles.trustBanner}>
          <Text style={styles.trustTitle}>Tu inversión protegida</Text>
          <Text style={styles.trustSubtitle}>
            Todas las propiedades de JC cuentan con validación jurídica. Compra con total seguridad y respaldo legal.
          </Text>
          <View style={styles.trustPoints}>
            {TRUST_POINTS.map((point, i) => (
              <View key={i} style={styles.trustPoint}>
                <Feather name="check" size={13} color="#22C55E" />
                <Text style={styles.trustPointText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Services */}
        <Text style={styles.sectionTitle}>Servicios Legales</Text>
        <View style={styles.optionsGrid}>
          {OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.optionCard, { backgroundColor: colors.card }]}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${opt.color}18` }]}>
                <Feather name={opt.icon} size={24} color={opt.color} />
              </View>
              {opt.badge && (
                <View style={[styles.badge, { backgroundColor: opt.color }]}>
                  <Text style={styles.badgeText}>{opt.badge}</Text>
                </View>
              )}
              <Text style={[styles.optionTitle, { color: colors.foreground }]}>{opt.title}</Text>
              <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{opt.description}</Text>
              <View style={[styles.optionBtn, { borderColor: opt.color }]}>
                <Text style={[styles.optionBtnText, { color: opt.color }]}>Solicitar</Text>
                <Feather name="arrow-right" size={13} color={opt.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Banner */}
        <TouchableOpacity style={styles.contactBanner} activeOpacity={0.88}>
          <View style={styles.contactLeft}>
            <Feather name="phone" size={20} color="#C8A96B" />
            <View>
              <Text style={styles.contactTitle}>Habla con un abogado ahora</Text>
              <Text style={styles.contactSubtitle}>Asesoría gratuita — Primera consulta sin costo</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.55)',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  trustBanner: {
    backgroundColor: '#071B33',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  trustTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  trustSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
    marginBottom: 16,
  },
  trustPoints: {
    gap: 8,
  },
  trustPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustPointText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#071B33',
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 18,
    padding: 18,
    position: 'relative',
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginBottom: 14,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  optionBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  contactBanner: {
    backgroundColor: '#071B33',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.25)',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
});
