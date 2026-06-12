import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import {
  createAdminUser,
  fetchAdminBrokers,
  fetchAdminProperties,
  fetchAdminUsers,
  type AdminBrokerProfile,
  type AdminProperty,
  updateAdminBrokerStatus,
  updateAdminDocumentStatus,
  updateAdminPropertyStatus,
} from '@/data/services/adminService';
import type { BrokerVerificationStatus, User, UserRole } from '@/data/types';
import { formatPrice } from '@/data/catalog';
import { useColors } from '@/hooks/useColors';
import { assertAdmin } from '@/lib/authorization';
import { createSignedDocumentUrl, type PrivateDocumentBucket } from '@/lib/storage';

type AdminView = 'users' | 'brokers' | 'properties';

export default function AdminScreen() {
  const params = useLocalSearchParams<{ view?: AdminView }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role } = useApp();
  const [view, setView] = useState<AdminView>(
    params.view === 'brokers' || params.view === 'properties' ? params.view : 'users',
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [brokers, setBrokers] = useState<AdminBrokerProfile[]>([]);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('buyer');
  const [companyName, setCompanyName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [certifications, setCertifications] = useState('');
  const [ampiNumber, setAmpiNumber] = useState('');
  const [sedetusNumber, setSedetusNumber] = useState('');
  const [brokerStatus, setBrokerStatus] = useState<BrokerVerificationStatus>('pending');

  const loadAdminData = async () => {
    if (role !== 'admin') return;
    setLoading(true);
    try {
      const [userRows, brokerRows, propertyRows] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminBrokers(),
        fetchAdminProperties(),
      ]);
      setUsers(userRows);
      setBrokers(brokerRows);
      setProperties(propertyRows);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo cargar el panel admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, [role]);

  const handleCreateUser = async () => {
    if (!email.trim() || password.length < 6 || !newRole || !fullName.trim()) {
      Alert.alert('Datos incompletos', 'Nombre, correo, rol y contrasena temporal son obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      await createAdminUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: newRole,
        company_name: companyName.trim(),
        whatsapp: whatsapp.trim(),
        avatar_url: avatarUrl.trim(),
        specialties: splitValues(specialties),
        certifications: splitValues(certifications),
        ampi_number: ampiNumber.trim(),
        sedetus_number: sedetusNumber.trim(),
        verification_status: brokerStatus,
      });
      Alert.alert('Cuenta creada', 'La cuenta fue creada correctamente.');
      resetCreateForm();
      await loadAdminData();
    } catch (error) {
      Alert.alert('No se pudo crear la cuenta', error instanceof Error ? error.message : 'Error de Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBrokerStatus = async (
    broker: AdminBrokerProfile,
    status: BrokerVerificationStatus,
  ) => {
    setActionId(broker.id);
    try {
      await updateAdminBrokerStatus(broker.id, status, reasons[broker.id] ?? null);
      await loadAdminData();
    } catch (error) {
      Alert.alert('No se pudo actualizar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setActionId(null);
    }
  };

  const handlePropertyStatus = async (
    property: AdminProperty,
    status: 'published' | 'rejected',
  ) => {
    setActionId(property.id);
    try {
      await updateAdminPropertyStatus(property, status, reasons[property.id] ?? null);
      await loadAdminData();
    } catch (error) {
      Alert.alert('No se pudo actualizar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setActionId(null);
    }
  };

  const handleDocumentStatus = async (
    documentId: string,
    status: 'approved' | 'rejected',
  ) => {
    setActionId(`document-${documentId}`);
    try {
      await updateAdminDocumentStatus(documentId, status, reasons[documentId] ?? null);
      await loadAdminData();
    } catch (error) {
      Alert.alert('No se pudo actualizar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setActionId(null);
    }
  };

  const handleOpenSensitiveDocument = async (
    bucket: PrivateDocumentBucket,
    path: string,
    actionKey: string,
  ) => {
    setActionId(actionKey);
    try {
      assertAdmin(role);
      const signedUrl = await createSignedDocumentUrl(bucket, path);
      await Linking.openURL(signedUrl);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir el documento',
        error instanceof Error ? error.message : 'Intenta nuevamente.',
      );
    } finally {
      setActionId(null);
    }
  };

  const resetCreateForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setNewRole('buyer');
    setCompanyName('');
    setWhatsapp('');
    setAvatarUrl('');
    setSpecialties('');
    setCertifications('');
    setAmpiNumber('');
    setSedetusNumber('');
    setBrokerStatus('pending');
  };

  if (role !== 'admin') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={36} color="#C8A96B" />
        <Text style={[styles.restrictedTitle, { color: colors.foreground }]}>Acceso exclusivo para administradores</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(main)/(tabs)/home')}>
          <Text style={styles.primaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={19} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Administracion</Text>
          <Text style={styles.headerSubtitle}>Usuarios, brokers y publicaciones</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => void loadAdminData()}>
          <Feather name="refresh-cw" size={18} color="#C8A96B" />
        </TouchableOpacity>
      </View>

      <View style={styles.segmented}>
        {([
          { key: 'users', label: `Usuarios ${users.length}` },
          { key: 'brokers', label: `Brokers ${brokers.length}` },
          { key: 'properties', label: `Propiedades ${properties.length}` },
        ] as const).map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.segment, view === item.key && styles.segmentActive]}
            onPress={() => setView(item.key)}
          >
            <Text style={[styles.segmentText, view === item.key && styles.segmentTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#0F6BFF" />
          <Text style={{ color: colors.mutedForeground }}>Cargando informacion...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        >
          {view === 'users' && (
            <>
              <View style={[styles.formPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Crear cuenta</Text>
                <AdminInput label="Nombre completo" value={fullName} onChangeText={setFullName} colors={colors} />
                <AdminInput label="Correo" value={email} onChangeText={setEmail} colors={colors} autoCapitalize="none" keyboardType="email-address" />
                <AdminInput label="Telefono" value={phone} onChangeText={setPhone} colors={colors} keyboardType="phone-pad" />
                <AdminInput label="Contrasena temporal" value={password} onChangeText={setPassword} colors={colors} secureTextEntry />

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Rol</Text>
                <View style={styles.choiceRow}>
                  {([
                    { value: 'buyer', label: 'Comprador' },
                    { value: 'broker', label: 'Broker' },
                    { value: 'admin', label: 'Admin' },
                  ] as const).map((item) => (
                    <ChoiceButton
                      key={item.value}
                      label={item.label}
                      active={newRole === item.value}
                      onPress={() => setNewRole(item.value)}
                    />
                  ))}
                </View>

                {newRole === 'broker' && (
                  <>
                    <AdminInput label="Nombre comercial" value={companyName} onChangeText={setCompanyName} colors={colors} />
                    <AdminInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} colors={colors} keyboardType="phone-pad" />
                    <AdminInput label="URL de avatar" value={avatarUrl} onChangeText={setAvatarUrl} colors={colors} autoCapitalize="none" />
                    <AdminInput label="Especialidades separadas por coma" value={specialties} onChangeText={setSpecialties} colors={colors} />
                    <AdminInput label="Certificaciones separadas por coma" value={certifications} onChangeText={setCertifications} colors={colors} />
                    <AdminInput label="Numero AMPI" value={ampiNumber} onChangeText={setAmpiNumber} colors={colors} />
                    <AdminInput label="Numero SEDETUS" value={sedetusNumber} onChangeText={setSedetusNumber} colors={colors} />
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Estado inicial</Text>
                    <View style={styles.choiceRow}>
                      {(['pending', 'approved', 'rejected'] as const).map((status) => (
                        <ChoiceButton
                          key={status}
                          label={statusLabel(status)}
                          active={brokerStatus === status}
                          onPress={() => setBrokerStatus(status)}
                        />
                      ))}
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, submitting && styles.disabled]}
                  onPress={() => void handleCreateUser()}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Crear cuenta</Text>}
                </TouchableOpacity>
              </View>

              {users.length === 0 ? (
                <EmptyText text="No hay usuarios registrados." colors={colors} />
              ) : (
                users.map((item) => (
                  <View key={item.id} style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.userIcon}>
                        <Feather name={item.role === 'admin' ? 'shield' : item.role === 'broker' ? 'briefcase' : 'user'} size={18} color="#fff" />
                      </View>
                      <View style={styles.flex}>
                        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.full_name || 'Sin nombre'}</Text>
                        <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>{item.email}</Text>
                      </View>
                      <StatusBadge status={item.role} />
                    </View>
                    <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{item.phone || 'Sin telefono'}</Text>
                  </View>
                ))
              )}
            </>
          )}

          {view === 'brokers' && (
            brokers.length === 0 ? (
              <EmptyText text="No hay brokers para revisar." colors={colors} />
            ) : (
              brokers.map((broker) => (
                <View key={broker.id} style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    {broker.avatar_url ? (
                      <Image source={{ uri: broker.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}><Feather name="user" size={20} color="#fff" /></View>
                    )}
                    <View style={styles.flex}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{broker.full_name || broker.email}</Text>
                      <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>{broker.company_name || 'Sin empresa'}</Text>
                    </View>
                    <StatusBadge status={broker.verification_status} />
                  </View>
                  <Detail label="Correo" value={broker.email} colors={colors} />
                  <Detail label="Telefono" value={broker.phone} colors={colors} />
                  <Detail label="WhatsApp" value={broker.whatsapp} colors={colors} />
                  <Detail label="AMPI" value={broker.ampi_number} colors={colors} />
                  <Detail label="SEDETUS" value={broker.sedetus_number} colors={colors} />
                  <Detail label="Especialidades" value={broker.specialties.join(', ')} colors={colors} />
                  <Detail label="Certificaciones" value={broker.certifications.join(', ')} colors={colors} />
                  {broker.id_document_url ? (
                    <TouchableOpacity
                      style={styles.documentButton}
                      onPress={() => void handleOpenSensitiveDocument(
                        'broker-documents',
                        broker.id_document_url,
                        `open-broker-${broker.id}`,
                      )}
                      disabled={actionId === `open-broker-${broker.id}`}
                    >
                      {actionId === `open-broker-${broker.id}` ? (
                        <ActivityIndicator size="small" color="#0F6BFF" />
                      ) : (
                        <Feather name="file-text" size={16} color="#0F6BFF" />
                      )}
                      <Text style={styles.documentButtonText}>Ver identificacion temporal</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.warningText, { color: colors.mutedForeground }]}>Sin identificacion cargada</Text>
                  )}
                  <AdminInput
                    label="Motivo de rechazo"
                    value={reasons[broker.id] ?? ''}
                    onChangeText={(value) => setReasons((current) => ({ ...current, [broker.id]: value }))}
                    colors={colors}
                    multiline
                  />
                  <View style={styles.actionRow}>
                    <ActionButton
                      label="Aprobar"
                      icon="check"
                      color="#22C55E"
                      loading={actionId === broker.id}
                      onPress={() => void handleBrokerStatus(broker, 'approved')}
                    />
                    <ActionButton
                      label="Rechazar"
                      icon="x"
                      color="#EF4444"
                      loading={actionId === broker.id}
                      onPress={() => void handleBrokerStatus(broker, 'rejected')}
                    />
                  </View>
                </View>
              ))
            )
          )}

          {view === 'properties' && (
            properties.length === 0 ? (
              <EmptyText text="No hay propiedades pendientes." colors={colors} />
            ) : (
              properties.map((property) => (
                <View key={property.id} style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.flex}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{property.title}</Text>
                      <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
                        {property.location} · {property.category}
                      </Text>
                    </View>
                    <StatusBadge status={property.publication_status} />
                  </View>
                  <Text style={styles.price}>{formatPrice(property.price)} {property.currency}</Text>
                  <Text style={[styles.description, { color: colors.mutedForeground }]}>{property.description || 'Sin descripcion'}</Text>
                  <Detail label="Broker" value={property.broker?.full_name || property.broker?.email || 'Sin broker'} colors={colors} />

                  {property.images.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
                      {property.images.map((url) => <Image key={url} source={{ uri: url }} style={styles.propertyImage} />)}
                    </ScrollView>
                  ) : (
                    <Text style={styles.dangerText}>La propiedad no tiene imagenes.</Text>
                  )}

                  <Text style={[styles.subheading, { color: colors.foreground }]}>Documentos ({property.documents.length})</Text>
                  {property.documents.length === 0 ? (
                    <Text style={[styles.warningText, { color: colors.mutedForeground }]}>Sin documentos cargados</Text>
                  ) : (
                    property.documents.map((document) => (
                      <View key={document.id} style={styles.documentReview}>
                        <TouchableOpacity
                          style={styles.documentButton}
                          onPress={() => void handleOpenSensitiveDocument(
                            'property-documents',
                            document.file_url,
                            `open-document-${document.id}`,
                          )}
                          disabled={actionId === `open-document-${document.id}`}
                        >
                          {actionId === `open-document-${document.id}` ? (
                            <ActivityIndicator size="small" color="#0F6BFF" />
                          ) : (
                            <Feather name="file" size={15} color="#0F6BFF" />
                          )}
                          <Text style={styles.documentButtonText}>{document.document_type.replace(/_/g, ' ')}</Text>
                          <StatusBadge status={document.status} />
                        </TouchableOpacity>
                        <AdminInput
                          label="Motivo de rechazo del documento"
                          value={reasons[document.id] ?? ''}
                          onChangeText={(value) => setReasons((current) => ({ ...current, [document.id]: value }))}
                          colors={colors}
                        />
                        <View style={styles.actionRow}>
                          <ActionButton
                            label="Aprobar documento"
                            icon="check"
                            color="#22C55E"
                            loading={actionId === `document-${document.id}`}
                            onPress={() => void handleDocumentStatus(document.id, 'approved')}
                          />
                          <ActionButton
                            label="Rechazar"
                            icon="x"
                            color="#EF4444"
                            loading={actionId === `document-${document.id}`}
                            onPress={() => void handleDocumentStatus(document.id, 'rejected')}
                          />
                        </View>
                      </View>
                    ))
                  )}

                  <AdminInput
                    label="Motivo de rechazo"
                    value={reasons[property.id] ?? ''}
                    onChangeText={(value) => setReasons((current) => ({ ...current, [property.id]: value }))}
                    colors={colors}
                    multiline
                  />
                  <View style={styles.actionRow}>
                    <ActionButton
                      label="Publicar"
                      icon="check"
                      color="#22C55E"
                      disabled={
                        property.images.length === 0
                        || !property.documents_completed
                        || property.documents.length === 0
                        || property.documents.some((document) => document.status !== 'approved')
                      }
                      loading={actionId === property.id}
                      onPress={() => void handlePropertyStatus(property, 'published')}
                    />
                    <ActionButton
                      label="Rechazar"
                      icon="x"
                      color="#EF4444"
                      loading={actionId === property.id}
                      onPress={() => void handlePropertyStatus(property, 'rejected')}
                    />
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

function AdminInput({
  label,
  colors,
  multiline,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          multiline && styles.multiline,
          { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
        ]}
      />
    </View>
  );
}

function ChoiceButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.choice, active && styles.choiceActive]} onPress={onPress}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionButton({
  label,
  icon,
  color,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: color }, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Feather name={icon} size={15} color="#fff" />}
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'approved' || status === 'published'
      ? '#22C55E'
      : status === 'rejected'
        ? '#EF4444'
        : status === 'admin'
          ? '#C8A96B'
          : '#0F6BFF';
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}55` }]}>
      <Text style={[styles.badgeText, { color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

function Detail({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  if (!value) return null;
  return (
    <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>{label}: </Text>{value}
    </Text>
  );
}

function EmptyText({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.empty, { borderColor: colors.border }]}>
      <Feather name="inbox" size={28} color={colors.mutedForeground} />
      <Text style={{ color: colors.mutedForeground }}>{text}</Text>
    </View>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    pending_review: 'Pendiente',
    draft: 'Borrador',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    published: 'Publicado',
    buyer: 'Comprador',
    broker: 'Broker',
    admin: 'Admin',
  };
  return labels[status] ?? status;
}

function splitValues(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 },
  restrictedTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  header: { backgroundColor: '#071B33', paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  refreshButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', backgroundColor: '#071B33', paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  segment: { flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 6 },
  segmentActive: { backgroundColor: '#0F6BFF' },
  segmentText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.62)', textAlign: 'center' },
  segmentTextActive: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  content: { padding: 16, gap: 14 },
  formPanel: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  panelTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  multiline: { minHeight: 74, paddingTop: 12 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 38, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#DCE3EC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F7FA' },
  choiceActive: { backgroundColor: '#0F6BFF', borderColor: '#0F6BFF' },
  choiceText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#536276' },
  choiceTextActive: { color: '#fff' },
  primaryButton: { minHeight: 48, borderRadius: 13, backgroundColor: '#0F6BFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  listCard: { borderRadius: 16, borderWidth: 1, padding: 15, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  flex: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  cardSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  userIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#0F6BFF', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#071B33', alignItems: 'center', justifyContent: 'center' },
  badge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  detailText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  warningText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  dangerText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#EF4444' },
  documentButton: { minHeight: 40, borderRadius: 10, backgroundColor: 'rgba(15,107,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, paddingVertical: 9 },
  documentReview: { gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(7,27,51,0.08)', paddingTop: 10 },
  documentButtonText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', color: '#0F6BFF', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 9 },
  actionButton: { flex: 1, minHeight: 43, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  actionButtonText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  disabled: { opacity: 0.5 },
  price: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0F6BFF' },
  description: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  gallery: { gap: 9 },
  propertyImage: { width: 112, height: 82, borderRadius: 10, backgroundColor: '#E5E9F0' },
  subheading: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  empty: { minHeight: 150, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 },
});
