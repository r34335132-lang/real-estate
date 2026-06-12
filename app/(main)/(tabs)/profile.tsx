import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import Images from '@/constants/images';
import { deleteCurrentAccount } from '@/data/services/accountService';
import type { Property } from '@/data/catalog';
import {
  fetchProfileMetrics,
  type ProfileMetrics,
} from '@/data/services/profileService';
import { useColors } from '@/hooks/useColors';
import { useSupabase } from '@/lib/env';
import { pickAndUploadImage } from '@/lib/storage';
import { getSupabase } from '@/lib/supabase';

const EMPTY_METRICS: ProfileMetrics = {
  users: 0,
  properties: 0,
  requests: 0,
  appointments: 0,
  activeListings: 0,
  closedSales: 0,
  rating: 0,
  reviews: 0,
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role, user, logout, favorites, preferences, updateProfile } = useApp();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((user as any)?.avatar_url || null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [draftAvatarUrl, setDraftAvatarUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [metrics, setMetrics] = useState<ProfileMetrics>(EMPTY_METRICS);
  const [myProperties, setMyProperties] = useState<Property[]>([]);

  useEffect(() => {
    setAvatarUrl(user ? ((user as any)?.avatar_url || null) : null);
  }, [user]);

  useEffect(() => {
    if (!user || !useSupabase()) {
      setMetrics(EMPTY_METRICS);
      setMyProperties([]);
      return;
    }

    let active = true;
    void fetchProfileMetrics(user.id, role)
      .then((result) => {
        if (!active) return;
        setMetrics(result.metrics);
        setMyProperties(result.properties);
      })
      .catch(() => {
        if (!active) return;
        setMetrics(EMPTY_METRICS);
        setMyProperties([]);
      });
    return () => {
      active = false;
    };
  }, [role, user]);

  const broker = {
    title: 'Broker Inmobiliario',
    company: 'JC Real Estate Group',
    image: Images.broker1,
    activeListings: metrics.activeListings,
    closedSales: metrics.closedSales,
    rating: metrics.rating,
  };

  const displayName = user?.full_name || 'Usuario';
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    broker: broker.title,
    buyer: 'Comprador Premium',
  };

  const handleLogout = async () => {
    console.log('[auth] profile:logout-press');
    await logout();
    console.log('[auth] profile:logout-resolved');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta permanentemente',
      'Se eliminaran tu cuenta, datos personales, preferencias, solicitudes y contenido asociado. Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmar eliminacion',
              '¿Estas seguro de que quieres eliminar permanentemente tu cuenta?',
              [
                { text: 'No, conservar cuenta', style: 'cancel' },
                {
                  text: 'Si, eliminar cuenta',
                  style: 'destructive',
                  onPress: () => void confirmDeleteAccount(),
                },
              ],
            );
          },
        },
      ],
    );
  };

  const confirmDeleteAccount = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    try {
      await deleteCurrentAccount();
      await logout();
      Alert.alert('Cuenta eliminada', 'Tu cuenta y los datos asociados fueron eliminados.');
    } catch (error) {
      Alert.alert(
        'No se pudo eliminar la cuenta',
        error instanceof Error ? error.message : 'Intenta nuevamente.',
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleUpdateAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const url = await pickAndUploadImage('avatar', user?.id);
      if (!url) {
        setUploadingAvatar(false);
        return;
      }

      setAvatarUrl(url);
      setUploadingAvatar(false);

      const supabase = getSupabase();
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      const { error: dbError } = await supabase.from('users').update({ avatar_url: url }).eq('id', user?.id);

      if (dbError) {
        Alert.alert('Aviso', 'La foto se actualizo visualmente, pero tu base de datos rechazo el cambio.');
      } else {
        Alert.alert('Exito', 'Foto de perfil actualizada correctamente.');
      }
    } catch {
      setUploadingAvatar(false);
      Alert.alert('Error', 'No se pudo subir la foto.');
    }
  };

  const openProfileEditor = () => {
    setPhone(user?.phone ?? '');
    setDraftAvatarUrl(avatarUrl);
    setPassword('');
    setConfirmPassword('');
    setEditingProfile(true);
  };

  const handlePickDraftAvatar = async () => {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadImage('avatar', user?.id);
      if (url) setDraftAvatarUrl(url);
    } catch (error) {
      Alert.alert(
        'No se pudo subir la foto',
        error instanceof Error ? error.message : 'Intenta nuevamente.',
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (savingProfile) return;
    if (password && password.length < 6) {
      Alert.alert('Contrasena corta', 'La nueva contrasena debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Revisa la contrasena', 'Las contrasenas no coinciden.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        phone,
        avatarUrl: draftAvatarUrl,
        password: password || undefined,
      });
      setAvatarUrl(draftAvatarUrl);
      setEditingProfile(false);
      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.');
    } catch (error) {
      Alert.alert(
        'No se pudo actualizar el perfil',
        error instanceof Error ? error.message : 'Intenta nuevamente.',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const isAdmin = role === 'admin';
  const isBroker = role === 'broker';
  const isBuyer = role === 'buyer';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: '#071B33', paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20) },
        ]}
      >
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <View style={styles.profileCenter}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handleUpdateAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
            {uploadingAvatar ? (
              <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A2E44' }]}>
                <ActivityIndicator color="#C8A96B" />
              </View>
            ) : (
              <Image source={avatarUrl ? { uri: avatarUrl } : (isBroker ? broker.image : Images.broker1)} style={styles.avatar} />
            )}
            <View style={styles.verifiedBadge}>
              <Feather name="camera" size={10} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.rolePill}>
            <Feather name={isAdmin ? 'settings' : isBroker ? 'briefcase' : 'user'} size={12} color="#C8A96B" />
            <Text style={styles.roleText}>{roleLabels[role]}</Text>
          </View>
          {isBroker && <Text style={styles.company}>{broker.company}</Text>}
        </View>

        <View style={styles.statsRow}>
          {isAdmin && (
            <>
              <Stat value={metrics.users} label="Usuarios" />
              <Divider />
              <Stat value={metrics.properties} label="Propiedades" />
              <Divider />
              <Stat value={metrics.requests} label="Solicitudes" />
            </>
          )}
          {isBroker && (
            <>
              <Stat value={broker.activeListings} label="Activas" />
              <Divider />
              <Stat value={broker.closedSales} label="Ventas" />
              <Divider />
              <Stat value={broker.rating.toFixed(1)} label={`${metrics.reviews} resenas`} />
            </>
          )}
          {isBuyer && (
            <>
              <Stat value={favorites.length} label="Favoritos" />
              <Divider />
              <Stat value={metrics.appointments} label="Citas" />
              <Divider />
              <Stat value={preferences ? 1 : 0} label="Preferencias" />
            </>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
        ]}
      >
        <View style={styles.actions}>
          {(isAdmin
            ? [
                { icon: 'users' as const, label: 'Usuarios', color: '#0F6BFF', route: '/(main)/admin?view=users' },
                { icon: 'home' as const, label: 'Propiedades', color: '#22C55E', route: '/(main)/admin?view=properties' },
                { icon: 'briefcase' as const, label: 'Brokers', color: '#C8A96B', route: '/(main)/admin?view=brokers' },
                { icon: 'bar-chart-2' as const, label: 'Metricas', color: '#A78BFA' },
              ]
            : isBroker
              ? [
                  { icon: 'plus-circle' as const, label: 'Publicar', color: '#0F6BFF', route: '/(main)/(tabs)/publish' },
                  { icon: 'bar-chart-2' as const, label: 'Leads', color: '#22C55E' },
                  { icon: 'calendar' as const, label: 'Citas', color: '#C8A96B' },
                  { icon: 'edit-2' as const, label: 'Perfil', color: '#A78BFA', action: 'edit-profile' as const },
                ]
              : [
                    { icon: 'heart' as const, label: 'Favoritos', color: '#EF4444' },
                    { icon: 'calendar' as const, label: 'Citas', color: '#0F6BFF' },
                    { icon: 'sliders' as const, label: 'Preferencias', color: '#22C55E', route: '/onboarding' },
                    { icon: 'star' as const, label: 'Recomendados', color: '#C8A96B', route: '/(main)/(tabs)/home' },
                  ]
          ).map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionBtn, { backgroundColor: colors.card }]}
              onPress={() => {
                if ('action' in action && action.action === 'edit-profile') {
                  openProfileEditor();
                  return;
                }
                if ('route' in action && action.route) router.push(action.route as never);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}18` }]}>
                <Feather name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.policyRow} onPress={() => router.push('/terms' as never)} activeOpacity={0.85}>
            <Feather name="file-text" size={18} color="#C8A96B" />
            <Text style={[styles.policyText, { color: colors.foreground }]}>Terminos y Condiciones</Text>
            <Feather name="chevron-right" size={18} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.policyRow} onPress={() => router.push('/privacy' as never)} activeOpacity={0.85}>
            <Feather name="lock" size={18} color="#0F6BFF" />
            <Text style={[styles.policyText, { color: colors.foreground }]}>Politica de Privacidad</Text>
            <Feather name="chevron-right" size={18} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.policyRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.85}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Feather name="trash-2" size={18} color="#EF4444" />
            )}
            <Text style={[styles.policyText, { color: '#EF4444' }]}>
              {deletingAccount ? 'Eliminando cuenta...' : 'Eliminar cuenta permanentemente'}
            </Text>
            <Feather name="chevron-right" size={18} color={colors.border} />
          </TouchableOpacity>
        </View>

        {isBroker && myProperties.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis propiedades</Text>
            {myProperties.map((prop) => (
              <TouchableOpacity key={prop.id} style={[styles.propRow, { backgroundColor: colors.card }]} onPress={() => router.push(`/property/${prop.id}`)} activeOpacity={0.85}>
                <Image source={prop.image} style={styles.propThumb} />
                <View style={styles.propInfo}>
                  <Text style={[styles.propTitle, { color: colors.foreground }]} numberOfLines={1}>{prop.title}</Text>
                  <Text style={[styles.propLocation, { color: colors.mutedForeground }]} numberOfLines={1}>{prop.location}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.border} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      <Modal
        visible={editingProfile}
        transparent
        animationType="slide"
        onRequestClose={() => !savingProfile && setEditingProfile(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.editorSheet, { backgroundColor: colors.card }]}>
            <View style={styles.editorHeader}>
              <View>
                <Text style={[styles.editorTitle, { color: colors.foreground }]}>Editar perfil</Text>
                <Text style={[styles.editorSubtitle, { color: colors.mutedForeground }]}>
                  Actualiza tus datos de contacto y acceso
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { borderColor: colors.border }]}
                onPress={() => setEditingProfile(false)}
                disabled={savingProfile}
              >
                <Feather name="x" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.editorContent}
            >
              <TouchableOpacity
                style={styles.editorAvatarWrap}
                onPress={() => void handlePickDraftAvatar()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <View style={[styles.editorAvatar, styles.avatarLoading]}>
                    <ActivityIndicator color="#C8A96B" />
                  </View>
                ) : (
                  <Image
                    source={draftAvatarUrl ? { uri: draftAvatarUrl } : Images.broker1}
                    style={styles.editorAvatar}
                  />
                )}
                <View style={styles.editorCameraBadge}>
                  <Feather name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>

              <ProfileInput
                label="Numero de telefono"
                value={phone}
                onChangeText={setPhone}
                placeholder="Tu numero de contacto"
                keyboardType="phone-pad"
                colors={colors}
              />
              <ProfileInput
                label="Nueva contrasena"
                value={password}
                onChangeText={setPassword}
                placeholder="Dejar vacio para conservarla"
                secureTextEntry
                colors={colors}
              />
              <ProfileInput
                label="Confirmar contrasena"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite la nueva contrasena"
                secureTextEntry
                colors={colors}
              />

              <TouchableOpacity
                style={[styles.saveButton, savingProfile && styles.disabledButton]}
                onPress={() => void handleSaveProfile()}
                disabled={savingProfile || uploadingAvatar}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#071B33" />
                ) : (
                  <>
                    <Feather name="save" size={18} color="#071B33" />
                    <Text style={styles.saveButtonText}>Guardar cambios</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ProfileInput({
  label,
  colors,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        {...props}
        style={[
          styles.input,
          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
        ]}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.statDivider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24, position: 'relative' },
  logoutBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  profileCenter: { alignItems: 'center', marginBottom: 20 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#0F6BFF' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0F6BFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#071B33',
  },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 6 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(200,169,107,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(200,169,107,0.25)',
    marginBottom: 4,
  },
  roleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#C8A96B' },
  company: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 2 },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
  scrollContent: { padding: 20, gap: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#071B33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  policyCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(7,27,51,0.06)' },
  policyText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 4 },
  propRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, gap: 12, elevation: 1 },
  propThumb: { width: 60, height: 60, borderRadius: 10 },
  propInfo: { flex: 1, gap: 3 },
  propTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  propLocation: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,27,51,0.62)' },
  editorSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editorTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  editorSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorContent: { paddingTop: 20, paddingBottom: 12, gap: 16 },
  editorAvatarWrap: { alignSelf: 'center', position: 'relative', marginBottom: 4 },
  editorAvatar: { width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: '#C8A96B' },
  avatarLoading: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#071B33' },
  editorCameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0F6BFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  inputGroup: { gap: 7 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  input: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#C8A96B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 4,
  },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#071B33', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
