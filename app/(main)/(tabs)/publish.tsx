import React, { useState } from 'react';
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
import type { OperationType } from '@/data/types';
import { useSupabase } from '@/lib/env';
import { pickAndUploadImage } from '@/lib/storage';

const CATEGORY_OPTIONS: { slug: PropertyCategory; label: string }[] = [
  { slug: 'terreno', label: 'Terreno' },
  { slug: 'casa', label: 'Casa' },
  { slug: 'edificio', label: 'Edificio' },
  { slug: 'hotel', label: 'Hotel' },
  { slug: 'playa', label: 'Playa' },
  { slug: 'cenote', label: 'Cenote' },
];

const STATUS_OPTIONS: { label: string; value: OperationType }[] = [
  { label: 'Compra', value: 'compra' },
  { label: 'Venta', value: 'venta' },
  { label: 'Renta', value: 'renta' },
  { label: 'Permuta', value: 'permuta' },
  { label: 'Asesoria', value: 'asesoria' },
];

export default function PublishScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role } = useApp();
  const queryClient = useQueryClient();
  
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PropertyCategory>('casa');
  const [operationType, setOperationType] = useState<OperationType>('venta');
  const [images, setImages] = useState<string[]>([]);
  const [hasPublicDeed, setHasPublicDeed] = useState(false);
  const [hasNoLienCertificate, setHasNoLienCertificate] = useState(false);
  const [hasCadastralCertificate, setHasCadastralCertificate] = useState(false);
  const [hasPlans, setHasPlans] = useState(false);
  const [sellerRegistryType, setSellerRegistryType] = useState<'ampi' | 'sedetus'>('ampi');
  const [sellerRegistryNumber, setSellerRegistryNumber] = useState('');

  const handleAddPhoto = async () => {
    if (images.length >= 20) return Alert.alert('Límite', 'Máximo 20 imágenes.');
    
    try {
      setUploadingImage(true);
      const url = await pickAndUploadImage('properties');
      
      if (url) {
        setImages((prev) => [...prev, url]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la imagen al servidor.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !price.trim() || !location.trim()) {
      Alert.alert('Campos requeridos', 'Completa título, precio y ubicación.');
      return;
    }

    if (
      !hasPublicDeed ||
      !hasNoLienCertificate ||
      !hasCadastralCertificate ||
      !hasPlans ||
      !sellerRegistryNumber.trim()
    ) {
      Alert.alert(
        'Documentacion legal requerida',
        'Para proteger a la plataforma y a los compradores, solo se aceptan propiedades con documentacion legal completa. Si no cumples con estos requisitos, la propiedad no podra publicarse.',
      );
      return;
    }

    setSubmitting(true);
    try {
      if (useSupabase()) {
        await createProperty({
          title: title.trim(),
          description: description.trim(),
          category,
          operation_type: operationType,
          price: Number(price.replace(/,/g, '')),
          location: location.trim(),
          city: location.split(',')[0]?.trim() ?? location,
          state: location.split(',')[1]?.trim() ?? '',
          size_m2: Number(area.replace(/,/g, '')) || 0,
          has_public_deed: hasPublicDeed,
          has_no_lien_certificate: hasNoLienCertificate,
          has_cadastral_certificate: hasCadastralCertificate,
          has_plans: hasPlans,
          seller_registry_type: sellerRegistryType,
          seller_registry_number: sellerRegistryNumber.trim(),
          // Dependiendo de tu BD, puedes enviar el array de imágenes aquí
          // images: images, 
        });
        await queryClient.invalidateQueries({ queryKey: ['properties'] });
      }
      Alert.alert(
        'Propiedad enviada',
        'Tu publicación fue registrada. Nuestro equipo la revisará en menos de 24 horas.',
      );
      setTitle('');
      setPrice('');
      setLocation('');
      setArea('');
      setDescription('');
      setImages([]);
      setHasPublicDeed(false);
      setHasNoLienCertificate(false);
      setHasCadastralCertificate(false);
      setHasPlans(false);
      setSellerRegistryType('ampi');
      setSellerRegistryNumber('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo publicar');
    } finally {
      setSubmitting(false);
    }
  };

  if (role === 'comprador') {
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
          <Text style={styles.headerTitle}>Publicar Propiedad</Text>
        </View>
        <View style={styles.restricted}>
          <View style={styles.restrictedIcon}>
            <Feather name="lock" size={40} color="#C8A96B" />
          </View>
          <Text style={[styles.restrictedTitle, { color: colors.foreground }]}>
            Acceso Restringido
          </Text>
          <Text style={[styles.restrictedText, { color: colors.mutedForeground }]}>
            Solo brokers y agentes pueden publicar propiedades. Regístrate como broker para acceder a esta función.
          </Text>
          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.88}>
            <Text style={styles.upgradeBtnText}>Registrarse como Broker</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Publicar Propiedad</Text>
        <Text style={styles.headerSubtitle}>Llena los datos de tu inmueble</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.form,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
        ]}
      >
        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {CATEGORY_OPTIONS.map((opt) => {
              const active = category === opt.slug;
              return (
                <TouchableOpacity
                  key={opt.slug}
                  onPress={() => setCategory(opt.slug)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? '#0F6BFF' : colors.card,
                      borderColor: active ? '#0F6BFF' : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.foreground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Status */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Disponibilidad</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => {
              const active = operationType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setOperationType(opt.value)}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: active ? '#0F6BFF' : colors.card,
                      borderColor: active ? '#0F6BFF' : colors.border,
                      flex: 1,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusText, { color: active ? '#fff' : colors.foreground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Título de la propiedad</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, fontFamily: 'Inter_400Regular' },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Villa de lujo en Polanco"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Price */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Precio (MXN)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={price}
            onChangeText={setPrice}
            placeholder="Ej: 5,500,000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
          />
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Ubicación</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={location}
            onChangeText={setLocation}
            placeholder="Ej: Polanco, CDMX"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Area */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Superficie (m²)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={area}
            onChangeText={setArea}
            placeholder="Ej: 350"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Descripción</Text>
          <TextInput
            style={[
              styles.input,
              styles.textarea,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe las características principales del inmueble..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photo Upload */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Fotografías ({images.length}/20)
          </Text>
          
          {/* Muestra galería de miniaturas subidas */}
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
              {images.map((imgUrl, idx) => (
                <View key={idx} style={{ position: 'relative' }}>
                  <Image source={{ uri: imgUrl }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.photoUpload, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={handleAddPhoto}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color={colors.mutedForeground} />
            ) : (
              <>
                <Feather name="camera" size={28} color={colors.mutedForeground} />
                <Text style={[styles.photoText, { color: colors.mutedForeground }]}>Agregar foto</Text>
                <Text style={[styles.photoHint, { color: colors.border }]}>Hasta 20 imágenes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Legal Requirements */}
        <View style={[styles.legalRequirements, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.legalRequirementTitle, { color: colors.foreground }]}>
            Requisitos legales para publicar
          </Text>
          <Text style={[styles.legalRequirementText, { color: colors.mutedForeground }]}>
            Para proteger a la plataforma y a los compradores, solo se aceptan propiedades con documentacion legal completa. Si no cumples con estos requisitos, la propiedad no podra publicarse.
          </Text>

          {[
            { label: 'Escrituras publicas', value: hasPublicDeed, setter: setHasPublicDeed },
            { label: 'Libre de gravamen', value: hasNoLienCertificate, setter: setHasNoLienCertificate },
            { label: 'Cedula catastral', value: hasCadastralCertificate, setter: setHasCadastralCertificate },
            { label: 'Planos', value: hasPlans, setter: setHasPlans },
          ].map((req) => (
            <TouchableOpacity
              key={req.label}
              style={styles.legalCheckRow}
              onPress={() => req.setter(!req.value)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, req.value && styles.checkboxActive]}>
                {req.value && <Feather name="check" size={14} color="#fff" />}
              </View>
              <Text style={[styles.legalCheckText, { color: colors.foreground }]}>{req.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Registro de vendedor</Text>
          <View style={styles.statusRow}>
            {(['ampi', 'sedetus'] as const).map((type) => {
              const active = sellerRegistryType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSellerRegistryType(type)}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: active ? '#0F6BFF' : colors.card,
                      borderColor: active ? '#0F6BFF' : colors.border,
                      flex: 1,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusText, { color: active ? '#fff' : colors.foreground }]}>
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={sellerRegistryNumber}
            onChangeText={setSellerRegistryNumber}
            placeholder="Numero AMPI o SEDETUS"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Legal Status */}
        <View style={[styles.legalBox, { backgroundColor: '#071B33' }]}>
          <Feather name="shield" size={20} color="#22C55E" />
          <View style={styles.legalInfo}>
            <Text style={styles.legalTitle}>Estado Legal</Text>
            <Text style={styles.legalSub}>JC verificará la situación jurídica de tu propiedad</Text>
          </View>
          <TouchableOpacity
            style={[styles.legalBtn, { borderColor: 'rgba(34,197,94,0.4)' }]}
            activeOpacity={0.8}
          >
            <Text style={styles.legalBtnText}>Solicitar</Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handlePublish}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.submitText}>Publicar Propiedad</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  },
  form: {
    padding: 20,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  textarea: {
    height: 100,
    paddingTop: 14,
  },
  chips: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  photoUpload: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  photoHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  legalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  legalInfo: {
    flex: 1,
  },
  legalTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    marginBottom: 2,
  },
  legalSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  legalBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  legalBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#22C55E',
  },
  legalRequirements: {
    gap: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  legalRequirementTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  legalRequirementText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  legalCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(15,107,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0F6BFF',
    borderColor: '#0F6BFF',
  },
  legalCheckText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  submitBtn: {
    backgroundColor: '#0F6BFF',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0F6BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  restricted: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  restrictedIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(200,169,107,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  restrictedTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  restrictedText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeBtn: {
    backgroundColor: '#0F6BFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  upgradeBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
