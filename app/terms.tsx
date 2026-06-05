import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TERMS = [
  'La plataforma funciona como medio de publicacion y contacto inmobiliario.',
  'Los brokers, propietarios o vendedores son responsables de la veracidad de la informacion y documentos que cargan.',
  'La plataforma puede rechazar, pausar o eliminar propiedades con documentos incompletos, falsos, vencidos o inconsistentes.',
  'La plataforma no garantiza que una propiedad este libre de problemas legales, fiscales, registrales o documentales.',
  'La revision documental es administrativa y no sustituye a notario, abogado, autoridad registral o institucion competente.',
  'El comprador debe realizar su propia debida diligencia antes de comprar, rentar, apartar o pagar cualquier propiedad.',
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terminos y Condiciones</Text>
        <Text style={styles.headerSubtitle}>Uso de la plataforma inmobiliaria</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {TERMS.map((term, index) => (
          <View key={term} style={styles.card}>
            <View style={styles.number}>
              <Text style={styles.numberText}>{index + 1}</Text>
            </View>
            <Text style={styles.body}>{term}</Text>
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
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(7,27,51,0.08)' },
  number: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(200,169,107,0.16)', alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#C8A96B' },
  body: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#536276', lineHeight: 20 },
});
