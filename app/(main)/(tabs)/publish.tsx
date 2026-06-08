import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import type { PropertyCategory } from '@/data/catalog';
import { createProperty } from '@/data/services/propertyService';
import {
  createPropertyDocuments,
  hasAllRequiredPropertyDocuments,
  REQUIRED_PROPERTY_DOCUMENTS,
} from '@/data/services/propertyDocumentService';
import { fetchBrokerProfileByUser, upsertBrokerProfile } from '@/data/services/brokerService';
import type { BrokerProfile, OperationType, PropertyDocumentType } from '@/data/types';
import { useSupabase } from '@/lib/env';
import { pickAndUploadImage } from '@/lib/storage';

const CATEGORY_OPTIONS: { slug: PropertyCategory; label: string }[] = [
  { slug: 'terreno', label: 'Terreno' },
  { slug: 'ejidal', label: 'Ejidal' },
  { slug: 'casa', label: 'Casa' },
  { slug: 'edificio', label: 'Edificio' },
  { slug: 'hotel', label: 'Hotel' },
  { slug: 'playa', label: 'Playa' },
  { slug: 'cenote', label: 'Cenote' },
];

const OPERATION_OPTIONS: { label: string; value: OperationType }[] = [
  { label: 'Compra', value: 'compra' },
  { label: 'Venta', value: 'venta' },
  { label: 'Renta', value: 'renta' },
  { label: 'Permuta', value: 'permuta' },
  { label: 'Asesoria', value: 'asesoria' },
];

type DraftDocument = { document_type: PropertyDocumentType; file_url: string };

const REQUIRED_DOCUMENTS_MESSAGE =
  'Para publicar esta propiedad debes completar la documentacion requerida para revision administrativa.';

const ADMIN_REVIEW_NOTICE =
  'La documentacion cargada sera revisada unicamente con fines administrativos para decidir si la propiedad puede publicarse en la plataforma. Esta revision no sustituye la validacion de un notario, abogado, autoridad registral o institucion competente. La responsabilidad legal, fiscal, registral y documental del inmueble corresponde exclusivamente al propietario, broker o vendedor que realiza la publicacion.';

export default function PublishScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role, user } = useApp();
  const queryClient = useQueryClient();

  const [loadingBroker, setLoadingBroker] = useState(true);
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(null);
  const [savingBroker, setSavingBroker] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<PropertyDocumentType | null>(null);

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [companyName, setCompanyName] = useState('');
  const [ampiNumber, setAmpiNumber] = useState('');
  const [sedetusNumber, setSedetusNumber] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [idDocumentUrl, setIdDocumentUrl] = useState('');

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PropertyCategory>('casa');
  const [operationType, setOperationType] = useState<OperationType>('venta');
  const [images, setImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DraftDocument[]>([]);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadBroker() {
      if (role !== 'broker' || !user?.id || !useSupabase()) {
        setLoadingBroker(false);
        return;
      }

      try {
        const profile = await fetchBrokerProfileByUser(user.id);
        if (!mounted) return;
        setBrokerProfile(profile);
        setFullName(profile?.full_name || user.full_name || '');
        setPhone(profile?.phone || user.phone || '');
        setEmail(profile?.email || user.email || '');
        setCompanyName(profile?.company_name || '');
        setAmpiNumber(profile?.ampi_number || '');
        setSedetusNumber(profile?.sedetus_number || '');
        setLicenseType(profile?.license_type || '');
        setIdDocumentUrl(profile?.id_document_url || '');
      } catch {
        Alert.alert('Error', 'No se pudo cargar tu perfil de broker.');
      } finally {
        if (mounted) setLoadingBroker(false);
      }
    }

    loadBroker();
    return () => {
      mounted = false;
    };
  }, [role, user?.id]);

  const documentsCompleted = useMemo(() => hasAllRequiredPropertyDocuments(documents), [documents]);
  const canSendToReview = brokerProfile?.verification_status === 'approved' && documentsCompleted && acceptedDisclaimer;

  const handleUploadId = async () => {
    try {
      setUploadingId(true);
      const url = await pickAndUploadImage('broker-documents');
      if (url) setIdDocumentUrl(url);
    } catch {
      Alert.alert('Error', 'No se pudo subir tu identificacion.');
    } finally {
      setUploadingId(false);
    }
  };

  const handleSaveBrokerProfile = async () => {
    if (!user?.id) return;
    if (!fullName.trim() || !phone.trim() || !email.trim() || !idDocumentUrl) {
      Alert.alert('Campos requeridos', 'Completa tu perfil y sube tu identificacion antes de enviarlo a verificacion.');
      return;
    }

    setSavingBroker(true);
    try {
      const saved = await upsertBrokerProfile({
        id: brokerProfile?.id,
        user_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        company_name: companyName.trim(),
        ampi_number: ampiNumber.trim(),
        sedetus_number: sedetusNumber.trim(),
        license_type: licenseType.trim(),
        id_document_url: idDocumentUrl,
      });
      setBrokerProfile(saved);
      Alert.alert('Perfil enviado', 'Tu perfil quedo en revision. Un admin debe aprobarlo antes de publicar.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar tu perfil.');
    } finally {
      setSavingBroker(false);
    }
  };

  const handleAddPhoto = async () => {
    if (images.length >= 20) return Alert.alert('Limite', 'Maximo 20 imagenes.');

    try {
      setUploadingImage(true);
      const url = await pickAndUploadImage('properties');
      if (url) setImages((prev) => [...prev, url]);
    } catch {
      Alert.alert('Error', 'No se pudo subir la imagen al servidor.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadDocument = async (documentType: PropertyDocumentType) => {
    try {
      setUploadingDocument(documentType);
      const url = await pickAndUploadImage('property-documents');
      if (!url) return;

      setDocuments((prev) => [
        ...prev.filter((doc) => doc.document_type !== documentType),
        { document_type: documentType, file_url: url },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo subir el documento.');
    } finally {
      setUploadingDocument(null);
    }
  };

  const handleSendToReview = async () => {
    if (!title.trim() || !price.trim() || !location.trim()) {
      Alert.alert('Campos requeridos', 'Completa titulo, precio y ubicacion.');
      return;
    }
    if (brokerProfile?.verification_status !== 'approved') {
      Alert.alert('Perfil pendiente', 'Un admin debe aprobar tu perfil de broker antes de publicar.');
      return;
    }
    if (!documentsCompleted) {
      Alert.alert('Documentacion requerida', REQUIRED_DOCUMENTS_MESSAGE);
      return;
    }
    if (!acceptedDisclaimer) {
      Alert.alert('Aviso legal requerido', 'Debes aceptar la declaracion legal antes de enviar a revision.');
      return;
    }

    setSubmitting(true);
    try {
      const property = await createProperty({
        broker_id: brokerProfile.id,
        title: title.trim(),
        description: description.trim(),
        category,
        operation_type: operationType,
        price: Number(price.replace(/,/g, '')),
        location: location.trim(),
        city: location.split(',')[0]?.trim() ?? location,
        state: location.split(',')[1]?.trim() ?? '',
        size_m2: Number(area.replace(/,/g, '')) || 0,
        images,
        publication_status: 'pending_review',
        legal_disclaimer_accepted: acceptedDisclaimer,
        documents_completed: true,
      });
      await createPropertyDocuments(property.id, documents);
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
      Alert.alert('Propiedad enviada', 'La propiedad quedo en revision. Solo un admin puede publicarla.');
      resetPropertyForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo enviar la propiedad.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetPropertyForm = () => {
    setTitle('');
    setPrice('');
    setLocation('');
    setArea('');
    setDescription('');
    setImages([]);
    setDocuments([]);
    setAcceptedDisclaimer(false);
  };

  if (role === 'buyer') {
    return <RestrictedScreen colors={colors} insetsTop={insets.top} />;
  }

  if (role !== 'broker' && role !== 'admin') {
    return <RestrictedScreen colors={colors} insetsTop={insets.top} />;
  }

  if (loadingBroker) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color="#0F6BFF" />
      </View>
    );
  }

  if (role === 'broker' && brokerProfile?.verification_status !== 'approved') {
    return (
      <ScreenShell colors={colors} insetsTop={insets.top} subtitle="Verificacion de broker">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusHeader}>
            <Feather name="shield" size={20} color="#C8A96B" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Perfil de broker</Text>
          </View>
          <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
            Tu perfil debe estar aprobado por un admin antes de publicar propiedades.
          </Text>
          {brokerProfile?.verification_status === 'rejected' && (
            <Text style={styles.errorText}>
              Rechazado: {brokerProfile.rejection_reason || 'Documentacion incompleta'}
            </Text>
          )}

          <ProfileInput label="Nombre completo" value={fullName} onChangeText={setFullName} colors={colors} />
          <ProfileInput label="Telefono" value={phone} onChangeText={setPhone} colors={colors} />
          <ProfileInput label="Correo" value={email} onChangeText={setEmail} colors={colors} />
          <ProfileInput label="Empresa" value={companyName} onChangeText={setCompanyName} colors={colors} />
          <ProfileInput label="Numero AMPI" value={ampiNumber} onChangeText={setAmpiNumber} colors={colors} />
          <ProfileInput label="Numero SEDETUS" value={sedetusNumber} onChangeText={setSedetusNumber} colors={colors} />
          <ProfileInput label="Tipo de licencia" value={licenseType} onChangeText={setLicenseType} colors={colors} />

          <TouchableOpacity
            style={[styles.uploadRow, { borderColor: idDocumentUrl ? '#22C55E' : colors.border }]}
            onPress={handleUploadId}
            disabled={uploadingId}
            activeOpacity={0.85}
          >
            {uploadingId ? <ActivityIndicator color="#C8A96B" /> : <Feather name="upload-cloud" size={18} color="#C8A96B" />}
            <Text style={[styles.uploadText, { color: colors.foreground }]}>
              {idDocumentUrl ? 'Identificacion cargada' : 'Subir identificacion'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, savingBroker && { opacity: 0.7 }]}
            onPress={handleSaveBrokerProfile}
            disabled={savingBroker}
            activeOpacity={0.85}
          >
            {savingBroker ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Enviar perfil a verificacion</Text>}
          </TouchableOpacity>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell colors={colors} insetsTop={insets.top} subtitle="Documentacion y revision administrativa">
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORY_OPTIONS.map((opt) => (
            <Chip key={opt.slug} label={opt.label} active={category === opt.slug} onPress={() => setCategory(opt.slug)} colors={colors} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Operacion</Text>
        <View style={styles.statusRow}>
          {OPERATION_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              active={operationType === opt.value}
              onPress={() => setOperationType(opt.value)}
              colors={colors}
              flex
            />
          ))}
        </View>
      </View>

      <ProfileInput label="Titulo de la propiedad" value={title} onChangeText={setTitle} colors={colors} placeholder="Villa de lujo en Polanco" />
      <ProfileInput label="Precio (MXN)" value={price} onChangeText={setPrice} colors={colors} placeholder="5,500,000" keyboardType="numeric" />
      <ProfileInput label="Ubicacion" value={location} onChangeText={setLocation} colors={colors} placeholder="Polanco, CDMX" />
      <ProfileInput label="Superficie (m2)" value={area} onChangeText={setArea} colors={colors} placeholder="350" keyboardType="numeric" />
      <ProfileInput
        label="Descripcion"
        value={description}
        onChangeText={setDescription}
        colors={colors}
        placeholder="Describe las caracteristicas principales del inmueble..."
        multiline
      />

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Fotografias ({images.length}/20)</Text>
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
            {images.map((imgUrl) => (
              <Image key={imgUrl} source={{ uri: imgUrl }} style={styles.thumb} />
            ))}
          </ScrollView>
        )}
        <TouchableOpacity
          style={[styles.photoUpload, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={handleAddPhoto}
          disabled={uploadingImage}
        >
          {uploadingImage ? <ActivityIndicator color={colors.mutedForeground} /> : <Feather name="camera" size={24} color={colors.mutedForeground} />}
          <Text style={[styles.photoText, { color: colors.mutedForeground }]}>Agregar foto</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Documentacion obligatoria</Text>
        <Text style={[styles.helperText, { color: colors.mutedForeground }]}>{REQUIRED_DOCUMENTS_MESSAGE}</Text>
        {REQUIRED_PROPERTY_DOCUMENTS.map((doc) => {
          const uploaded = documents.some((item) => item.document_type === doc.type);
          return (
            <TouchableOpacity
              key={doc.type}
              style={styles.documentRow}
              onPress={() => handleUploadDocument(doc.type)}
              disabled={uploadingDocument === doc.type}
              activeOpacity={0.82}
            >
              <View style={[styles.documentIcon, uploaded && styles.documentIconUploaded]}>
                {uploadingDocument === doc.type ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Feather name={uploaded ? 'check' : 'upload-cloud'} size={14} color="#fff" />
                )}
              </View>
              <View style={styles.documentInfo}>
                <Text style={[styles.documentTitle, { color: colors.foreground }]}>{doc.label}</Text>
                <Text style={[styles.documentStatus, { color: uploaded ? '#22C55E' : colors.mutedForeground }]}>
                  {uploaded ? 'Cargado, pendiente de revision' : 'Pendiente'}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.border} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.legalBox, { backgroundColor: '#071B33' }]}>
        <Text style={styles.legalTitle}>Aviso legal</Text>
        <Text style={styles.legalText}>{ADMIN_REVIEW_NOTICE}</Text>
        <TouchableOpacity style={styles.legalCheckRow} onPress={() => setAcceptedDisclaimer((prev) => !prev)} activeOpacity={0.85}>
          <View style={[styles.checkbox, acceptedDisclaimer && styles.checkboxActive]}>
            {acceptedDisclaimer && <Feather name="check" size={14} color="#fff" />}
          </View>
          <Text style={styles.legalCheckText}>
            Declaro bajo protesta de decir verdad que la informacion y documentos proporcionados son reales, vigentes y corresponden al inmueble publicado. Entiendo que la plataforma puede rechazar, suspender o eliminar la publicacion si detecta informacion incompleta, falsa o inconsistente.
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!canSendToReview || submitting) && { opacity: 0.55 }]}
        onPress={handleSendToReview}
        disabled={!canSendToReview || submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.submitText}>Enviar a revision</Text>
          </>
        )}
      </TouchableOpacity>
    </ScreenShell>
  );
}

function ScreenShell({
  children,
  colors,
  insetsTop,
  subtitle,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
  insetsTop: number;
  subtitle: string;
}) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#071B33', paddingTop: insetsTop + (Platform.OS === 'web' ? 67 : 16) }]}>
        <Text style={styles.headerTitle}>Publicar Propiedad</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        {children}
      </ScrollView>
    </View>
  );
}

function RestrictedScreen({ colors, insetsTop }: { colors: ReturnType<typeof useColors>; insetsTop: number }) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#071B33', paddingTop: insetsTop + (Platform.OS === 'web' ? 67 : 16) }]}>
        <Text style={styles.headerTitle}>Publicar Propiedad</Text>
      </View>
      <View style={styles.restricted}>
        <View style={styles.restrictedIcon}>
          <Feather name="lock" size={38} color="#C8A96B" />
        </View>
        <Text style={[styles.restrictedTitle, { color: colors.foreground }]}>Acceso restringido</Text>
        <Text style={[styles.restrictedText, { color: colors.mutedForeground }]}>
          Solo brokers verificados y admins pueden enviar propiedades a revision.
        </Text>
      </View>
    </View>
  );
}

function ProfileInput({
  label,
  colors,
  multiline,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        {...props}
        style={[
          styles.input,
          multiline && styles.textarea,
          { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
        ]}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  colors,
  flex,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  flex?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        flex && { flex: 1 },
        { backgroundColor: active ? '#0F6BFF' : colors.card, borderColor: active ? '#0F6BFF' : colors.border },
      ]}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)' },
  form: { padding: 20, gap: 20, paddingBottom: 120 },
  field: { gap: 8 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: 'Inter_400Regular' },
  textarea: { minHeight: 104, paddingTop: 14 },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  chipText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageRow: { gap: 10, paddingBottom: 8 },
  thumb: { width: 82, height: 82, borderRadius: 10 },
  photoUpload: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, height: 112, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  card: { gap: 14, borderRadius: 16, padding: 16, borderWidth: 1 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  helperText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#EF4444' },
  uploadRow: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  documentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  documentIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#94A3B8', alignItems: 'center', justifyContent: 'center' },
  documentIconUploaded: { backgroundColor: '#22C55E' },
  documentInfo: { flex: 1 },
  documentTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  documentStatus: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  legalBox: { gap: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(200,169,107,0.25)' },
  legalTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  legalText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.64)', lineHeight: 20 },
  legalCheckRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(200,169,107,0.55)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxActive: { backgroundColor: '#0F6BFF', borderColor: '#0F6BFF' },
  legalCheckText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.78)', lineHeight: 18 },
  submitBtn: { backgroundColor: '#0F6BFF', borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#0F6BFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6 },
  submitText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  restricted: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  restrictedIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(200,169,107,0.1)', alignItems: 'center', justifyContent: 'center' },
  restrictedTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  restrictedText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
