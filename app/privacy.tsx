import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/lib/support';

const SECTIONS = [
  {
    title: 'Datos que podemos recopilar',
    body:
      'Nombre, correo, telefono, foto de perfil, preferencias de busqueda, favoritos, datos del broker, numero AMPI o SEDETUS si aplica, identificacion del broker, fotografias de propiedades y documentos de propiedad como escritura publica, libre de gravamen, cedula catastral, planos, predial, servicios, identificacion del propietario y autorizacion del propietario.',
  },
  {
    title: 'Uso de la informacion',
    body:
      'Usamos estos datos para crear y administrar cuentas, mostrar propiedades, guardar preferencias, contactar usuarios con brokers, revisar perfiles de broker y realizar revision documental administrativa antes de permitir una publicacion.',
  },
  {
    title: 'Documentos sensibles',
    body:
      'Los documentos cargados por brokers o vendedores no se muestran publicamente. Se usan solo para revision administrativa de publicacion y control interno de la plataforma.',
  },
  {
    title: 'Alcance de la revision',
    body:
      'La plataforma no sustituye la revision de un notario, abogado, autoridad registral o institucion competente. La responsabilidad legal, fiscal, registral y documental corresponde al propietario, broker o vendedor.',
  },
  {
    title: 'Eliminacion de datos',
    body: `Puedes solicitar la eliminacion de tu cuenta, datos personales y documentos cargados escribiendo a ${SUPPORT_EMAIL} o por WhatsApp al ${SUPPORT_WHATSAPP}.`,
  },
  {
    title: 'Terceros',
    body:
      'No vendemos datos personales ni documentos a terceros. Podemos compartir informacion solo cuando sea necesario para operar la plataforma, cumplir obligaciones aplicables o atender solicitudes del usuario.',
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politica de Privacidad</Text>
        <Text style={styles.headerSubtitle}>Uso de datos personales y documentos</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FB' },
  header: { backgroundColor: '#071B33', paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(7,27,51,0.08)' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#071B33', marginBottom: 8 },
  body: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#536276', lineHeight: 20 },
});
