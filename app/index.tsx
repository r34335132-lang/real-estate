import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import Images from '@/constants/images';
import { UserRole } from '@/data/types';
import { goToOnboarding } from '@/lib/authNavigation';
import { useSupabase } from '@/lib/env';

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

const REGISTER_ROLES: RoleOption[] = [
  { role: 'buyer', label: 'Comprador', description: 'Buscar y guardar propiedades', icon: 'search', color: '#0F6BFF' },
  { role: 'broker', label: 'Broker', description: 'Publicar y gestionar inmuebles', icon: 'briefcase', color: '#C8A96B' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    signIn,
    signUp,
    authLoading,
  } = useApp();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('buyer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const supabaseMode = useSupabase();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleAuthSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Completa correo y contraseña');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    setSubmitting(true);
    const err =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, name.trim(), registerRole);

    setSubmitting(false);

    if (err) {
      setError(err);
      return;
    }

    if (mode === 'register') {
      goToOnboarding();
      return;
    }
    goToOnboarding();
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0F6BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={Images.hero} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.bgOverlay} />

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 40),
            paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 24),
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>JC</Text>
          </View>
          <Text style={styles.logoTitle}>REAL ESTATE JC</Text>
          <View style={styles.goldLine} />
          <Text style={styles.tagline}>
            {supabaseMode ? 'Conectado a tu base de datos' : 'Configura Supabase para iniciar sesión'}
          </Text>
        </View>

        {mode === 'welcome' && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }}>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.submitBtn} onPress={() => { setMode('login'); setError(null); }}>
                <Text style={styles.submitText}>Iniciar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.registerBtn} onPress={() => { setMode('register'); setError(null); }}>
                <Text style={styles.registerText}>Crear cuenta nueva</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {(mode === 'login' || mode === 'register') && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formSection}>
            <TouchableOpacity style={styles.formBack} onPress={() => { setMode('welcome'); setError(null); }}>
              <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.formBackText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.formTitle}>
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Text>

            {mode === 'register' && (
              <>
                <View style={styles.inputWrap}>
                  <Feather name="user" size={18} color="rgba(255,255,255,0.5)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre completo"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <Text style={styles.fieldLabel}>Tipo de cuenta</Text>
                <View style={styles.rolePicker}>
                  {REGISTER_ROLES.map((r) => (
                    <TouchableOpacity
                      key={r.role}
                      style={[styles.rolePill, registerRole === r.role && styles.rolePillActive]}
                      onPress={() => setRegisterRole(r.role)}
                    >
                      <Feather name={r.icon} size={14} color={registerRole === r.role ? '#fff' : r.color} />
                      <Text style={[styles.rolePillText, registerRole === r.role && styles.rolePillTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.inputWrap}>
              <Feather name="mail" size={18} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.input}
                placeholder="Contraseña (mín. 6 caracteres)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleAuthSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'login' ? 'Entrar' : 'Registrarse'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        <Text style={styles.terms}>
          Al ingresar aceptas nuestros Términos de Servicio y Política de Privacidad
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071B33' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  bgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,27,51,0.88)' },
  content: { flex: 1, paddingHorizontal: 24 },
  logoSection: { alignItems: 'center', paddingTop: 8, marginBottom: 16 },
  logoMark: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#0F6BFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoMarkText: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#fff' },
  logoTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 3, marginBottom: 8 },
  goldLine: { width: 40, height: 3, backgroundColor: '#C8A96B', borderRadius: 2, marginBottom: 8 },
  tagline: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)' },
  footer: { gap: 10, marginTop: 12 },
  registerBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  registerText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.85)' },
  formSection: { gap: 12, paddingBottom: 12 },
  formBack: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formBackText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)' },
  formTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 },
  rolePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  rolePillActive: { backgroundColor: '#0F6BFF', borderColor: '#0F6BFF' },
  rolePillText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)' },
  rolePillTextActive: { color: '#fff' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: '#fff', paddingVertical: 14 },
  submitBtn: { backgroundColor: '#0F6BFF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#FCA5A5', textAlign: 'center' },
  terms: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 8 },
});
