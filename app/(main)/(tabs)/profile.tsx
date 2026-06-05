import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import Images from '@/constants/images';
import type { Appointment, LegalRequest } from '@/data/types';
import type { Property } from '@/data/catalog';
import { useColors } from '@/hooks/useColors';
import { pickAndUploadImage } from '@/lib/storage';
import { getSupabase } from '@/lib/supabase';

const EMPTY_APPOINTMENTS: Appointment[] = [];
const EMPTY_LEGAL_REQUESTS: LegalRequest[] = [];
const EMPTY_PROPERTIES: Property[] = [];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role, user, logout, favorites, preferences } = useApp();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((user as any)?.avatar_url || null);

  useEffect(() => {
    setAvatarUrl(user ? ((user as any)?.avatar_url || null) : null);
  }, [user]);

  const broker = {
    title: 'Broker Inmobiliario',
    company: 'JC Real Estate Group',
    image: Images.broker1,
    activeListings: 0,
    closedSales: 0,
    rating: 0,
  };

  const myProperties = EMPTY_PROPERTIES.filter((p) => p.broker_id === user?.id).slice(0, 3);
  const favoriteProps = EMPTY_PROPERTIES.filter((p) => favorites.includes(p.id));
  const buyerAppointments = EMPTY_APPOINTMENTS.filter((a) => a.user_id === user?.id);
  const legalRequests = EMPTY_LEGAL_REQUESTS;

  const displayName = user?.full_name || 'Usuario';
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    broker: broker.title,
    buyer: 'Comprador Premium',
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleUpdateAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const url = await pickAndUploadImage(`avatars/${user?.id || 'default'}`);
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
              <Stat value="0" label="Usuarios" />
              <Divider />
              <Stat value="0" label="Propiedades" />
              <Divider />
              <Stat value={legalRequests.length} label="Solicitudes" />
            </>
          )}
          {isBroker && (
            <>
              <Stat value={broker.activeListings} label="Activas" />
              <Divider />
              <Stat value={broker.closedSales} label="Ventas" />
              <Divider />
              <Stat value={broker.rating} label="Rating" />
            </>
          )}
          {isBuyer && (
            <>
              <Stat value={favoriteProps.length} label="Favoritos" />
              <Divider />
              <Stat value={buyerAppointments.length} label="Citas" />
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
                { icon: 'users' as const, label: 'Usuarios', color: '#0F6BFF' },
                { icon: 'home' as const, label: 'Propiedades', color: '#22C55E' },
                { icon: 'briefcase' as const, label: 'Brokers', color: '#C8A96B' },
                { icon: 'bar-chart-2' as const, label: 'Metricas', color: '#A78BFA' },
              ]
            : isBroker
              ? [
                  { icon: 'plus-circle' as const, label: 'Publicar', color: '#0F6BFF', route: '/(main)/(tabs)/publish' },
                  { icon: 'bar-chart-2' as const, label: 'Leads', color: '#22C55E' },
                  { icon: 'calendar' as const, label: 'Citas', color: '#C8A96B' },
                  { icon: 'edit-2' as const, label: 'Perfil', color: '#A78BFA' },
                ]
              : [
                    { icon: 'heart' as const, label: 'Favoritos', color: '#EF4444' },
                    { icon: 'calendar' as const, label: 'Citas', color: '#0F6BFF' },
                    { icon: 'sliders' as const, label: 'Preferencias', color: '#22C55E', route: '/onboarding' },
                    { icon: 'star' as const, label: 'Recomendados', color: '#C8A96B', route: '/(main)/(tabs)' },
                  ]
          ).map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionBtn, { backgroundColor: colors.card }]}
              onPress={() => {
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
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 4 },
  propRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, gap: 12, elevation: 1 },
  propThumb: { width: 60, height: 60, borderRadius: 10 },
  propInfo: { flex: 1, gap: 3 },
  propTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  propLocation: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
