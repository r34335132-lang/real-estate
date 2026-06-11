import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SatisfiedClientsButton } from '@/components/SatisfiedClientsButton';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSupabase } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import { openContactWhatsApp } from '@/lib/support';

type Interest = 'comprar' | 'vender' | 'rentar' | 'invertir' | 'asesoria';

const INTERESTS: Array<{ value: Interest; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { value: 'comprar', label: 'Comprar', icon: 'home' },
  { value: 'vender', label: 'Vender', icon: 'key' },
  { value: 'rentar', label: 'Rentar', icon: 'calendar' },
  { value: 'invertir', label: 'Invertir', icon: 'trending-up' },
  { value: 'asesoria', label: 'Recibir asesoria', icon: 'message-circle' },
];

export default function ContactScreen() {
  const params = useLocalSearchParams<{
    interest?: Interest;
    message?: string;
    propertyId?: string;
    propertyTitle?: string;
    propertyPrice?: string;
    propertyLocation?: string;
    propertyReference?: string;
    requestType?: string;
    requestTitle?: string;
  }>();
  const { user } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [interest, setInterest] = useState<Interest>(params.interest ?? 'asesoria');
  const [message, setMessage] = useState(params.message ?? '');
  const [submitting, setSubmitting] = useState(false);

  const hasProperty = Boolean(params.propertyTitle || params.propertyId);
  const propertyReference = useMemo(
    () => params.propertyReference || (params.propertyId ? `ID: ${params.propertyId}` : ''),
    [params.propertyId, params.propertyReference],
  );

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Ingresa tu nombre completo.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Telefono requerido', 'Ingresa un telefono de contacto.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Correo no valido', 'Revisa el formato del correo electronico.');
      return;
    }

    const interestLabel = INTERESTS.find((item) => item.value === interest)?.label ?? interest;
    const lines = [
      'Hola, quiero recibir asesoria inmobiliaria.',
      '',
      `Nombre: ${name.trim()}`,
      `Telefono: ${phone.trim()}`,
      email.trim() ? `Correo: ${email.trim()}` : null,
      `Interes: ${interestLabel}`,
      message.trim() ? `Mensaje: ${message.trim()}` : null,
      hasProperty ? '' : null,
      hasProperty ? 'Propiedad de interes:' : null,
      params.propertyTitle || null,
      params.propertyPrice ? `Precio: ${params.propertyPrice}` : null,
      params.propertyLocation ? `Ubicacion: ${params.propertyLocation}` : null,
      propertyReference || null,
    ].filter((line): line is string => line !== null);

    setSubmitting(true);
    try {
      if (user && params.requestType && useSupabase()) {
        const { error } = await getSupabase().from('legal_requests').insert({
          user_id: user.id,
          property_id: params.propertyId || null,
          request_type: params.requestType,
          status: 'pendiente',
          notes: `${params.requestTitle || 'Solicitud desde la app'}: ${message.trim() || 'Sin comentarios'}`,
        });
        if (error) console.log('[contact] legal-request-error', error);
      }
      await openContactWhatsApp(lines.join('\n'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 14) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Solicita asesoria</Text>
          <Text style={styles.headerSubtitle}>Dejanos tus datos y un asesor te contactara</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
      >
        {hasProperty && (
          <View style={styles.propertyCard}>
            <View style={styles.propertyIcon}>
              <Feather name="home" size={19} color="#C8A96B" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.propertyEyebrow}>Propiedad seleccionada</Text>
              <Text style={styles.propertyTitle}>{params.propertyTitle || 'Propiedad de interes'}</Text>
              {params.propertyPrice ? <Text style={styles.propertyPrice}>{params.propertyPrice}</Text> : null}
              {params.propertyLocation ? <Text style={styles.propertyLocation}>{params.propertyLocation}</Text> : null}
              {propertyReference ? <Text style={styles.propertyReference}>{propertyReference}</Text> : null}
            </View>
          </View>
        )}

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field label="Nombre completo" required>
            <Input value={name} onChangeText={setName} placeholder="Tu nombre" colors={colors} />
          </Field>
          <Field label="Telefono" required>
            <Input value={phone} onChangeText={setPhone} placeholder="55 0000 0000" keyboardType="phone-pad" colors={colors} />
          </Field>
          <Field label="Correo electronico">
            <Input value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" colors={colors} />
          </Field>

          <Field label="Tipo de interes" required>
            <View style={styles.interests}>
              {INTERESTS.map((item) => {
                const active = interest === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.interestButton, active && styles.interestButtonActive]}
                    onPress={() => setInterest(item.value)}
                    activeOpacity={0.82}
                  >
                    <Feather name={item.icon} size={15} color={active ? '#fff' : '#0F6BFF'} />
                    <Text style={[styles.interestText, active && styles.interestTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          <Field label="Mensaje o comentarios">
            <Input
              value={message}
              onChangeText={setMessage}
              placeholder="Cuentanos como podemos ayudarte"
              multiline
              colors={colors}
            />
          </Field>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabled]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
          activeOpacity={0.88}
        >
          <Feather name="message-circle" size={18} color="#fff" />
          <Text style={styles.submitText}>{submitting ? 'Preparando mensaje...' : 'Enviar por WhatsApp'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
        </TouchableOpacity>

        <SatisfiedClientsButton />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{required ? ' *' : ''}
      </Text>
      {children}
    </View>
  );
}

function Input({
  colors,
  multiline,
  ...props
}: React.ComponentProps<typeof TextInput> & { colors: ReturnType<typeof useColors> }) {
  return (
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#071B33',
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 21, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { color: 'rgba(255,255,255,0.58)', fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular', marginTop: 2 },
  content: { padding: 16, gap: 13 },
  propertyCard: {
    borderRadius: 16,
    backgroundColor: '#071B33',
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.42)',
    padding: 15,
    flexDirection: 'row',
    gap: 12,
  },
  propertyIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: 'rgba(200,169,107,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  propertyEyebrow: { color: '#C8A96B', fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  propertyTitle: { color: '#fff', fontSize: 15, lineHeight: 20, fontFamily: 'Inter_600SemiBold', marginTop: 3 },
  propertyPrice: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 5 },
  propertyLocation: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  propertyReference: { color: 'rgba(255,255,255,0.42)', fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 4 },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 15, gap: 15 },
  field: { gap: 7 },
  label: { color: '#536276', fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, fontSize: 14, fontFamily: 'Inter_400Regular' },
  multiline: { minHeight: 96, paddingTop: 12 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE3EC',
    backgroundColor: '#F4F7FA',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interestButtonActive: { backgroundColor: '#0F6BFF', borderColor: '#0F6BFF' },
  interestText: { color: '#536276', fontSize: 12, fontFamily: 'Inter_500Medium' },
  interestTextActive: { color: '#fff' },
  submitButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  submitText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  disabled: { opacity: 0.55 },
  cancelButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
