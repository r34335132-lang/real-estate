import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import {
  BROKERS,
  MOCK_APPOINTMENTS,
  MOCK_LEGAL_REQUESTS,
  MOCK_USERS,
  PROPERTIES,
} from '@/data/mock';
import Images from '@/constants/images';
import { pickAndUploadImage } from '@/lib/storage';
import { getSupabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role, user, isGuest, logout, favorites, preferences } = useApp();
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((user as any)?.avatar_url || (user as any)?.user_metadata?.avatar_url || null);

  useEffect(() => {
    if (user) {
      const photo = (user as any)?.avatar_url || (user as any)?.user_metadata?.avatar_url || null;
      setAvatarUrl(photo);
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  const broker = BROKERS[0];
  const myProperties = PROPERTIES.filter((p) => p.broker_id === 'b1').slice(0, 3);
  const favoriteProps = PROPERTIES.filter((p) => favorites.includes(p.id));
  const buyerAppointments = MOCK_APPOINTMENTS.filter((a) => a.user_id === 'u-buyer');

  const displayName = user?.full_name || (user as any)?.user_metadata?.full_name || 'Usuario';
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    broker: broker.title,
    abogado: 'Abogado Inmobiliario',
    comprador: 'Comprador Premium',
    invitado: 'Modo invitado',
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleGuestExit = async () => {
    await logout();
  };

  const handleUpdateAvatar = async () => {
    if (isGuest) return Alert.alert('Aviso', 'Crea una cuenta para cambiar tu foto.');
    
    try {
      setUploadingAvatar(true);
      // 1. Subir al Storage (Bucket)
      const url = await pickAndUploadImage(`avatars/${user?.id || 'default'}`);
      
      if (!url) {
        setUploadingAvatar(false); // El usuario canceló
        return; 
      }

      // 2. ACTUALIZACIÓN OPTIMISTA: Mostramos la foto y quitamos spinner INMEDIATAMENTE
      setAvatarUrl(url);
      setUploadingAvatar(false);

      // 3. Guardar en Base de Datos en segundo plano
      const supabase = getSupabase();
      
      await supabase.auth.updateUser({
        data: { avatar_url: url }
      });

      // Intentar guardar en la tabla pública
      const { error: dbError } = await supabase
        .from('users') // <-- Cambia a 'profiles' si tu tabla se llama distinto
        .update({ avatar_url: url })
        .eq('id', user?.id);

      if (dbError) {
        console.log("Error de permisos en DB:", dbError);
        Alert.alert('Aviso', 'La foto se actualizó visualmente, pero tu base de datos rechazó el cambio. Revisa las políticas RLS en Supabase.');
      } else {
        Alert.alert('Éxito', 'Foto de perfil actualizada correctamente.');
      }

    } catch (error) {
      console.error(error);
      setUploadingAvatar(false);
      Alert.alert('Error', 'No se pudo subir la foto.');
    }
  };

  if (isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: '#071B33', paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20) }]}>
          <View style={styles.guestHero}>
            <View style={styles.guestIconLarge}>
              <Feather name="compass" size={36} color="#C8A96B" />
            </View>
            <Text style={styles.name}>Hola, invitado</Text>
            <Text style={styles.guestMsg}>
              Explora propiedades libremente. Crea una cuenta para guardar favoritos, contactar brokers y agendar visitas.
            </Text>
            <TouchableOpacity style={styles.ctaPrimary} onPress={handleGuestExit} activeOpacity={0.88}>
              <Text style={styles.ctaPrimaryText}>Crear cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaSecondary} onPress={handleGuestExit} activeOpacity={0.8}>
              <Text style={styles.ctaSecondaryText}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Puedes hacer</Text>
          {['Explorar propiedades', 'Filtrar por categoría', 'Ver perfiles de brokers', 'Ver detalles legales'].map((t) => (
            <View key={t} style={[styles.guestFeature, { backgroundColor: colors.card }]}>
              <Feather name="check" size={16} color="#22C55E" />
              <Text style={[styles.guestFeatureText, { color: colors.foreground }]}>{t}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const isAdmin = role === 'admin';
  const isBroker = role === 'broker';
  const isAbogado = role === 'abogado';
  const isComprador = role === 'comprador';

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
          <TouchableOpacity 
            style={styles.avatarWrap} 
            onPress={handleUpdateAvatar} 
            activeOpacity={0.8}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
               <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A2E44' }]}>
                 <ActivityIndicator color="#C8A96B" />
               </View>
            ) : (
               <Image 
                 source={avatarUrl ? { uri: avatarUrl } : (isBroker ? broker.image : Images.broker1)} 
                 style={styles.avatar} 
               />
            )}
            <View style={styles.verifiedBadge}>
              <Feather name="camera" size={10} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.rolePill}>
            <Feather
              name={isAdmin ? 'settings' : isBroker ? 'briefcase' : isAbogado ? 'shield' : 'user'}
              size={12}
              color="#C8A96B"
            />
            <Text style={styles.roleText}>{roleLabels[role]}</Text>
          </View>
          {isBroker && <Text style={styles.company}>{broker.company}</Text>}
        </View>

        <View style={styles.statsRow}>
          {isAdmin && (
            <>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{MOCK_USERS.length}</Text>
                <Text style={styles.statLabel}>Usuarios</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{PROPERTIES.length}</Text>
                <Text style={styles.statLabel}>Propiedades</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{MOCK_LEGAL_REQUESTS.length}</Text>
                <Text style={styles.statLabel}>Solicitudes</Text>
              </View>
            </>
          )}
          {isBroker && (
            <>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{broker.activeListings}</Text>
                <Text style={styles.statLabel}>Activas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{broker.closedSales}</Text>
                <Text style={styles.statLabel}>Ventas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{broker.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </>
          )}
          {isAbogado && (
            <>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{MOCK_LEGAL_REQUESTS.length}</Text>
                <Text style={styles.statLabel}>Casos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>18</Text>
                <Text style={styles.statLabel}>Contratos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>11</Text>
                <Text style={styles.statLabel}>Validaciones</Text>
              </View>
            </>
          )}
          {isComprador && (
            <>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{favoriteProps.length}</Text>
                <Text style={styles.statLabel}>Favoritos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{buyerAppointments.length}</Text>
                <Text style={styles.statLabel}>Citas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{preferences ? 1 : 0}</Text>
                <Text style={styles.statLabel}>Preferencias</Text>
              </View>
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
                { icon: 'bar-chart-2' as const, label: 'Métricas', color: '#A78BFA' },
              ]
            : isBroker
              ? [
                  { icon: 'plus-circle' as const, label: 'Publicar', color: '#0F6BFF', route: '/(tabs)/publish' },
                  { icon: 'bar-chart-2' as const, label: 'Leads', color: '#22C55E' },
                  { icon: 'calendar' as const, label: 'Citas', color: '#C8A96B' },
                  { icon: 'edit-2' as const, label: 'Perfil', color: '#A78BFA' },
                ]
              : isAbogado
                ? [
                    { icon: 'file-text' as const, label: 'Contratos', color: '#0F6BFF', route: '/(tabs)/legal' },
                    { icon: 'check-circle' as const, label: 'Validar', color: '#22C55E' },
                    { icon: 'folder' as const, label: 'Documentos', color: '#C8A96B' },
                    { icon: 'activity' as const, label: 'Casos', color: '#A78BFA' },
                  ]
                : [
                    { icon: 'heart' as const, label: 'Favoritos', color: '#EF4444' },
                    { icon: 'calendar' as const, label: 'Citas', color: '#0F6BFF' },
                    { icon: 'sliders' as const, label: 'Preferencias', color: '#22C55E', route: '/onboarding' },
                    { icon: 'star' as const, label: 'Recomendados', color: '#C8A96B', route: '/(tabs)/' },
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

        {isAdmin && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Solicitudes legales</Text>
            {MOCK_LEGAL_REQUESTS.map((lr) => (
              <View key={lr.id} style={[styles.adminRow, { backgroundColor: colors.card }]}>
                <Feather name="file-text" size={18} color="#0F6BFF" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.adminTitle, { color: colors.foreground }]}>{lr.request_type.replace(/_/g, ' ')}</Text>
                  <Text style={[styles.adminSub, { color: colors.mutedForeground }]}>{lr.status}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {isBroker && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis propiedades</Text>
            {myProperties.map((prop) => (
              <TouchableOpacity
                key={prop.id}
                style={[styles.propRow, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/property/${prop.id}`)}
                activeOpacity={0.85}
              >
                <Image source={prop.image} style={styles.propThumb} />
                <View style={styles.propInfo}>
                  <Text style={[styles.propTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {prop.title}
                  </Text>
                  <Text style={[styles.propLocation, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {prop.location}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.border} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {isComprador && favoriteProps.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis favoritos</Text>
            {favoriteProps.map((prop) => (
              <TouchableOpacity
                key={prop.id}
                style={[styles.propRow, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/property/${prop.id}`)}
                activeOpacity={0.85}
              >
                <Image source={prop.image} style={styles.propThumb} />
                <View style={styles.propInfo}>
                  <Text style={[styles.propTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {prop.title}
                  </Text>
                  <Text style={[styles.propLocation, { color: colors.mutedForeground }]}>{prop.location}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.border} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {isAbogado && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Casos activos</Text>
            {MOCK_LEGAL_REQUESTS.map((lr) => (
              <View key={lr.id} style={[styles.adminRow, { backgroundColor: colors.card }]}>
                <Feather name="shield" size={18} color="#22C55E" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.adminTitle, { color: colors.foreground }]}>Prop. {lr.property_id}</Text>
                  <Text style={[styles.adminSub, { color: colors.mutedForeground }]}>{lr.notes}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: '#EEF3FF' }]}>
                  <Text style={styles.statusPillText}>{lr.status}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
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
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    elevation: 1,
  },
  propThumb: { width: 60, height: 60, borderRadius: 10 },
  propInfo: { flex: 1, gap: 3 },
  propTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  propLocation: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  adminTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  adminSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#0F6BFF' },
  guestHero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12 },
  guestIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(200,169,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestMsg: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaPrimary: {
    alignSelf: 'stretch',
    backgroundColor: '#0F6BFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaPrimaryText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  ctaSecondary: { paddingVertical: 10 },
  ctaSecondaryText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#C8A96B' },
  guestFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  guestFeatureText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});