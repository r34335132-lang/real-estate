import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { fetchPendingBrokerProfiles, updateBrokerVerificationStatus } from '@/data/services/brokerService';
import { fetchPendingReviewProperties, updatePropertyPublicationStatus } from '@/data/services/propertyService';
import type { BrokerProfile } from '@/data/types';
import type { Property } from '@/data/catalog';
import { openContactForm } from '@/lib/contactNavigation';
import { SatisfiedClientsButton } from '@/components/SatisfiedClientsButton';

interface LegalOption {
  requestType: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
  badge?: string;
}

interface ScopeModule {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  items: string[];
}

const OPTIONS: LegalOption[] = [
  {
    requestType: 'solicitud_documento',
    icon: 'file-text',
    title: 'Solicitud de documento',
    description: 'Plantillas y documentos operativos sujetos a revision profesional externa.',
    color: '#0F6BFF',
    badge: 'Nuevo',
  },
  {
    requestType: 'revision_documental',
    icon: 'check-circle',
    title: 'Revisar documentacion',
    description: 'Revision administrativa de documentos cargados por el vendedor.',
    color: '#22C55E',
  },
  {
    requestType: 'orientacion_firma',
    icon: 'edit-3',
    title: 'Orientacion sobre firma',
    description: 'Flujo de firma sujeto a los proveedores y requisitos aplicables.',
    color: '#C8A96B',
  },
  {
    requestType: 'contacto_especializado',
    icon: 'users',
    title: 'Contacto especializado',
    description: 'Contacto con profesionales externos cuando el usuario lo solicite.',
    color: '#A78BFA',
  },
  {
    requestType: 'revision_publicacion',
    icon: 'search',
    title: 'Revision de documentos',
    description: 'Revision administrativa de documentos cargados para decidir si una propiedad puede publicarse.',
    color: '#F472B6',
  },
  {
    requestType: 'informacion_fideicomiso',
    icon: 'lock',
    title: 'Informacion sobre fideicomiso',
    description: 'Informacion general sujeta a revision con profesionales e instituciones competentes.',
    color: '#34D399',
  },
];

const TRUST_POINTS = [
  'Experiencia operativa en publicacion inmobiliaria',
  'Red de contactos profesionales externos',
  'Tiempo estimado sujeto a disponibilidad',
  'Documentos sujetos a revision de profesionales competentes',
];

const SCOPE_MODULES: ScopeModule[] = [
  {
    icon: 'activity',
    title: 'Procesos',
    description: 'Seguimiento de compra, renta, validación y firma desde una misma línea de avance.',
    items: ['Compra', 'Renta', 'Validación', 'Firma'],
  },
  {
    icon: 'upload-cloud',
    title: 'Documentación',
    description: 'Subida, revisión y control de documentos por propiedad, cliente y operación.',
    items: ['Subida', 'Revisión', 'Checklist'],
  },
  {
    icon: 'clock',
    title: 'Historial',
    description: 'Registro de propiedades, contratos y procesos para auditoría y continuidad operativa.',
    items: ['Propiedades', 'Contratos', 'Procesos'],
  },
  {
    icon: 'briefcase',
    title: 'Docs',
    description: 'Documentos digitales, revision administrativa y herramientas informativas.',
    items: ['Documentos digitales', 'Revision', 'Herramientas informativas'],
  },
];

export default function LegalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role } = useApp();
  const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const loadAdminReview = async () => {
    if (role !== 'admin') return;
    setLoadingAdmin(true);
    try {
      const [brokerRows, propertyRows] = await Promise.all([
        fetchPendingBrokerProfiles(),
        fetchPendingReviewProperties(),
      ]);
      setBrokers(brokerRows);
      setProperties(propertyRows);
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    void loadAdminReview();
  }, [role]);

  const handleBrokerDecision = async (brokerId: string, approved: boolean) => {
    await updateBrokerVerificationStatus(brokerId, approved ? 'approved' : 'rejected');
    await loadAdminReview();
  };

  const handlePropertyDecision = async (propertyId: string, published: boolean) => {
    await updatePropertyPublicationStatus(propertyId, published ? 'published' : 'rejected');
    await loadAdminReview();
  };

  const handleLegalOptionPress = (option: Pick<LegalOption, 'requestType' | 'title'>) => {
    openContactForm({
      interest: 'asesoria',
      message: `Quiero informacion sobre: ${option.title}.`,
      requestType: option.requestType,
      requestTitle: option.title,
    });
  };

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
            <Text style={styles.headerTitle}>Gestion documental JC</Text>
            <Text style={styles.headerSubtitle}>Informacion documental para publicacion</Text>
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
        {role === 'admin' && (
          <TouchableOpacity
            style={[styles.adminPanel, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(main)/admin' as never)}
            activeOpacity={0.85}
          >
            <View style={styles.adminHeader}>
              <Feather name="sliders" size={18} color="#C8A96B" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.adminTitle, { color: colors.foreground }]}>Panel admin</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Gestiona usuarios, brokers y propiedades
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#C8A96B" />
            </View>
          </TouchableOpacity>
        )}

        {false && role === 'admin' && (
          <View style={[styles.adminPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.adminHeader}>
              <Feather name="sliders" size={18} color="#C8A96B" />
              <Text style={[styles.adminTitle, { color: colors.foreground }]}>Panel admin</Text>
            </View>
            {loadingAdmin ? (
              <ActivityIndicator color="#0F6BFF" />
            ) : (
              <>
                <Text style={[styles.adminSectionTitle, { color: colors.foreground }]}>Brokers por revisar</Text>
                {brokers.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No hay brokers pendientes.</Text>
                ) : (
                  brokers.map((broker) => (
                    <ReviewRow
                      key={broker.id}
                      title={broker.full_name || broker.email}
                      subtitle={`${broker.company_name || 'Sin empresa'} · ${broker.verification_status}`}
                      onApprove={() => handleBrokerDecision(broker.id, true)}
                      onReject={() => handleBrokerDecision(broker.id, false)}
                      colors={colors}
                    />
                  ))
                )}

                <Text style={[styles.adminSectionTitle, { color: colors.foreground }]}>Propiedades por revisar</Text>
                {properties.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No hay propiedades pendientes.</Text>
                ) : (
                  properties.map((property) => (
                    <ReviewRow
                      key={property.id}
                      title={property.title}
                      subtitle={`${property.location} · ${property.publication_status}`}
                      onApprove={() => handlePropertyDecision(property.id, true)}
                      onReject={() => handlePropertyDecision(property.id, false)}
                      colors={colors}
                    />
                  ))
                )}
              </>
            )}
          </View>
        )}

        {/* Trust Banner */}
        <View style={styles.trustBanner}>
          <Text style={styles.trustTitle}>Informacion para decidir</Text>
          <Text style={styles.trustSubtitle}>
            Las propiedades publicadas pueden estar sujetas a revision administrativa. La app no sustituye notario, abogado, autoridad registral, institucion financiera ni asesoria profesional. Revisa la informacion y realiza tu propia debida diligencia antes de decidir.
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
        <Text style={styles.sectionTitle}>Herramientas documentales</Text>
        <View style={styles.optionsGrid}>
          {OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.optionCard, { backgroundColor: colors.card }]}
              onPress={() => handleLegalOptionPress(opt)}
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

        <Text style={styles.sectionTitle}>Módulos planeados</Text>
        <View style={styles.scopeGrid}>
          {SCOPE_MODULES.map((module) => (
            <View key={module.title} style={[styles.scopeCard, { backgroundColor: colors.card }]}>
              <View style={styles.scopeHeader}>
                <View style={styles.scopeIcon}>
                  <Feather name={module.icon} size={18} color="#C8A96B" />
                </View>
                <Text style={[styles.scopeTitle, { color: colors.foreground }]}>{module.title}</Text>
              </View>
              <Text style={[styles.scopeDesc, { color: colors.mutedForeground }]}>{module.description}</Text>
              <View style={styles.scopeItems}>
                {module.items.map((item) => (
                  <View key={item} style={styles.scopePill}>
                    <Text style={styles.scopePillText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Contact Banner */}
        <TouchableOpacity
          style={styles.contactBanner}
          onPress={() =>
            void handleLegalOptionPress({
              requestType: 'contacto_especializado',
              title: 'Contacto especializado',
            })
          }
          activeOpacity={0.88}
        >
          <View style={styles.contactLeft}>
            <Feather name="phone" size={20} color="#C8A96B" />
            <View>
              <Text style={styles.contactTitle}>Solicita contacto especializado</Text>
              <Text style={styles.contactSubtitle}>Canal de contacto sujeto a disponibilidad</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        <SatisfiedClientsButton />
      </ScrollView>
    </View>
  );
}

function ReviewRow({
  title,
  subtitle,
  onApprove,
  onReject,
  colors,
}: {
  title: string;
  subtitle: string;
  onApprove: () => void;
  onReject: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.reviewRow, { borderColor: colors.border }]}>
      <View style={styles.reviewInfo}>
        <Text style={[styles.reviewTitle, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.reviewSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <TouchableOpacity style={[styles.reviewBtn, styles.approveBtn]} onPress={onApprove} activeOpacity={0.85}>
        <Feather name="check" size={14} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.reviewBtn, styles.rejectBtn]} onPress={onReject} activeOpacity={0.85}>
        <Feather name="x" size={14} color="#fff" />
      </TouchableOpacity>
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
  adminPanel: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  adminSectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  reviewSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  reviewBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: '#22C55E',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
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
  scopeGrid: {
    gap: 12,
  },
  scopeCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.18)',
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  scopeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  scopeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(200,169,107,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  scopeDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 12,
  },
  scopeItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scopePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(7,27,51,0.06)',
  },
  scopePillText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#071B33',
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
