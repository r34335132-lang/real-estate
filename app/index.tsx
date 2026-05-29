import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { Redirect, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import Images from '@/constants/images';
import { UserRole } from '@/data/types';
import { AUTH_STORAGE_KEYS } from '@/lib/authStorage';
import { goToOnboarding, goToTabs } from '@/lib/authNavigation';
import { useSupabase } from '@/lib/env';
import { routes } from '@/lib/routes';

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

const REGISTER_ROLES: RoleOption[] = [
  { role: 'comprador', label: 'Comprador', description: 'Buscar y guardar propiedades', icon: 'search', color: '#0F6BFF' },
  { role: 'broker', label: 'Broker', description: 'Publicar y gestionar inmuebles', icon: 'briefcase', color: '#C8A96B' },
  { role: 'abogado', label: 'Abogado', description: 'Validación y contratos', icon: 'shield', color: '#22C55E' },
];

const DEMO_ROLES: RoleOption[] = [
  ...REGISTER_ROLES,
  { role: 'admin', label: 'Admin', description: 'Panel de administración', icon: 'settings', color: '#A78BFA' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    signIn,
    signUp,
    loginAsGuest,
    loginWithRoleDemo,
    sessionKind,
    authLoading,
    pendingAuthIntent,
    hasCompletedOnboarding,
  } = useApp();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('comprador');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const supabaseMode = useSupabase();
  const wantsAuthForm = pendingAuthIntent === 'login' || pendingAuthIntent === 'register';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (pendingAuthIntent === 'login') {
        setMode('login');
        setError(null);
      } else if (pendingAuthIntent === 'register') {
        setMode('register');
        setError(null);
      }
    }, [pendingAuthIntent]),
  );

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
    const onboarded = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.onboarding);
    if (onboarded === 'true') goToTabs();
    else goToOnboarding();
  };

  const handleGuest = async () => {
    setError(null);
    await loginAsGuest();
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0F6BFF" />
      </View>
    );
  }

  if (sessionKind !== 'none' && !wantsAuthForm) {
    return (
      <Redirect
        href={hasCompletedOnboarding ? routes.tabs : routes.onboarding}
      />
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
            {supabaseMode ? 'Conectado a tu base de datos' : 'Modo demo local'}
          </Text>
        </View>

        {mode === 'welcome' && !wantsAuthForm && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }}>
            {!supabaseMode && (
              <>
                <Text style={styles.rolesLabel}>Acceso rápido (demo):</Text>
                {DEMO_ROLES.map((item) => (
                  <TouchableOpacity
                    key={item.role}
                    style={styles.roleCard}
                    onPress={() => loginWithRoleDemo(item.role)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: `${item.color}22` }]}>
                      <Feather name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={styles.roleInfo}>
                      <Text style={styles.roleLabel}>{item.label}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.35)" />
                  </TouchableOpacity>
                ))}
              </>
            )}

            <TouchableOpacity style={styles.guestCard} onPress={handleGuest} activeOpacity={0.9}>
              <View style={styles.guestInner}>
                <View style={styles.guestIconWrap}>
                  <Feather name="compass" size={22} color="#C8A96B" />
                </View>
                <View style={styles.guestTextWrap}>
                  <Text style={styles.guestTitle}>Explorar como invitado</Text>
                  <Text style={styles.guestDesc}>Ver propiedades sin cuenta</Text>
                </View>
                <Feather name="arrow-right" size={18} color="#C8A96B" />
              </View>
            </TouchableOpacity>

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

        {(mode === 'login' || mode === 'register' || wantsAuthForm) && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formSection}>
            {!wantsAuthForm && (
              <TouchableOpacity style={styles.formBack} onPress={() => { setMode('welcome'); setError(null); }}>
                <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.formBackText}>Volver</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.formTitle}>
              {mode === 'login' || pendingAuthIntent === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Text>

            {(mode === 'register' || pendingAuthIntent === 'register') && (
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
                  {mode === 'login' || pendingAuthIntent === 'login' ? 'Entrar' : 'Registrarse'}
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
  rolesLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 },
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, gap: 12 },
  roleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  guestCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(200,169,107,0.35)', backgroundColor: 'rgba(200,169,107,0.1)', marginTop: 8 },
  guestInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  guestIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(200,169,107,0.2)', alignItems: 'center', justifyContent: 'center' },
  guestTextWrap: { flex: 1 },
  guestTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  guestDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)' },
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
