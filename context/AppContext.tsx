import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { budgetFromRange } from '@/data/mockPreferences';
import { getUserByRole } from '@/data/mockUsers';
import {
  clearAuthSession,
  restoreSession,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from '@/data/services/authService';
import { fetchFavoriteIds, toggleFavoriteDb } from '@/data/services/favoriteService';
import { fetchPreferences, savePreferences } from '@/data/services/preferenceService';
import { User, UserPreferences, UserRole } from '@/data/types';
import { AUTH_STORAGE_KEYS, migrateAuthStorageIfNeeded } from '@/lib/authStorage';
import { useSupabase } from '@/lib/env';

interface GuestGateConfig {
  visible: boolean;
  title: string;
  message: string;
  actionLabel?: string;
}

export type SessionKind = 'none' | 'guest' | 'user';

interface AppContextType {
  role: UserRole;
  user: User | null;
  sessionKind: SessionKind;
  isAuthenticated: boolean;
  isGuest: boolean;
  preferences: UserPreferences | null;
  hasCompletedOnboarding: boolean;
  favorites: string[];
  guestGate: GuestGateConfig;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<string | null>;
  loginAsGuest: () => Promise<void>;
  loginWithRoleDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  setPreferences: (prefs: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;
  isFavorite: (id: string) => boolean;
  requireAuth: (action: 'contact' | 'favorite' | 'appointment' | 'save') => boolean;
  showGuestGate: (action: 'contact' | 'favorite' | 'appointment' | 'save') => void;
  hideGuestGate: () => void;
  refreshFavorites: () => Promise<void>;
}

const GUEST_MESSAGES: Record<string, { title: string; message: string }> = {
  contact: {
    title: 'Crea una cuenta para contactar',
    message: 'Regístrate o inicia sesión para contactar a este broker y recibir asesoría personalizada.',
  },
  favorite: {
    title: 'Inicia sesión para guardar',
    message: 'Guarda tus propiedades favoritas y accede a ellas desde cualquier dispositivo.',
  },
  appointment: {
    title: 'Agenda tu visita',
    message: 'Crea una cuenta para agendar visitas y recibir confirmación del broker.',
  },
  save: {
    title: 'Accede a más funciones',
    message: 'Crea una cuenta para desbloquear todas las funciones de Real Estate JC.',
  },
};

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('comprador');
  const [user, setUser] = useState<User | null>(null);
  const [sessionKind, setSessionKind] = useState<SessionKind>('none');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [preferences, setPreferencesState] = useState<UserPreferences | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [guestGate, setGuestGate] = useState<GuestGateConfig>({
    visible: false,
    title: '',
    message: '',
  });
  const [hydrated, setHydrated] = useState(false);
  const sessionKindRef = useRef<SessionKind>('none');
  const hydratingRef = useRef(false);

  useEffect(() => {
    sessionKindRef.current = sessionKind;
  }, [sessionKind]);

  const isAuthenticated = sessionKind !== 'none';
  const isGuest = sessionKind === 'guest';

  const resetLocalSession = useCallback(() => {
    setUser(null);
    setRole('comprador');
    setSessionKind('none');
    setFavorites([]);
    setPreferencesState(null);
    setHasCompletedOnboarding(false);
  }, []);

  const loadFavorites = useCallback(async (userId: string | null, guest: boolean) => {
    if (guest || !userId) {
      const local = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.favorites);
      if (local) setFavorites(JSON.parse(local));
      return;
    }
    if (useSupabase()) {
      try {
        const ids = await fetchFavoriteIds(userId);
        setFavorites(ids);
      } catch {
        const local = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.favorites);
        if (local) setFavorites(JSON.parse(local));
      }
    } else {
      const local = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.favorites);
      if (local) setFavorites(JSON.parse(local));
    }
  }, []);

  const applyUser = useCallback(
    async (u: User, guest = false) => {
      await loadFavorites(guest ? null : u.id, guest);

      let onboarded = false;
      if (!guest && useSupabase()) {
        const prefs = await fetchPreferences(u.id);
        if (prefs) {
          setPreferencesState(prefs);
          onboarded = true;
          await AsyncStorage.setItem(AUTH_STORAGE_KEYS.onboarding, 'true');
        }
      }

      setUser(u);
      setRole(u.role);
      setSessionKind(guest ? 'guest' : 'user');
      if (onboarded) setHasCompletedOnboarding(true);
    },
    [loadFavorites],
  );

  const applyGuest = useCallback(async () => {
    const guestUser = getUserByRole('invitado')!;
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.guest, 'true');
    await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.skipRestore);
    await applyUser(guestUser, true);
  }, [applyUser]);

  useEffect(() => {
    let cancelled = false;
    hydratingRef.current = true;

    (async () => {
      try {
        await migrateAuthStorageIfNeeded();

        const [onboarding, guestFlag, localPrefs, skipRestore] = await Promise.all([
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.onboarding),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.guest),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.preferences),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.skipRestore),
        ]);

        if (onboarding === 'true') setHasCompletedOnboarding(true);

        if (skipRestore === '1') {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.skipRestore);
          await clearAuthSession();
        } else if (useSupabase()) {
          const profile = await restoreSession();
          if (!cancelled && profile) {
            if (guestFlag === 'true') await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.guest);
            await applyUser(profile);
            return;
          }
        }

        if (!cancelled && guestFlag === 'true') {
          const guestUser = getUserByRole('invitado')!;
          await applyUser(guestUser, true);
          return;
        }

        if (!cancelled && localPrefs) setPreferencesState(JSON.parse(localPrefs));

        if (!cancelled && !useSupabase()) {
          const local = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.favorites);
          if (local) setFavorites(JSON.parse(local));
        }
      } finally {
        hydratingRef.current = false;
        if (!cancelled) {
          setAuthLoading(false);
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      hydratingRef.current = false;
    };
  }, [applyUser]);

  const exitGuestForAuth = useCallback(async () => {
    await clearAuthSession();
    await AsyncStorage.multiRemove([AUTH_STORAGE_KEYS.guest]);
    resetLocalSession();
  }, [resetLocalSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (sessionKindRef.current === 'guest') {
        await exitGuestForAuth();
      }

      const { user: u, error } = await signInWithEmail(email, password);
      if (error || !u) return error ?? 'Error al iniciar sesión';

      await AsyncStorage.multiRemove([AUTH_STORAGE_KEYS.guest, AUTH_STORAGE_KEYS.skipRestore]);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.authIntent);
      await applyUser(u);
      return null;
    },
    [applyUser, exitGuestForAuth],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, selectedRole: UserRole) => {
      if (sessionKindRef.current === 'guest') {
        await exitGuestForAuth();
      }

      const { user: u, error } = await signUpWithEmail(email, password, fullName, selectedRole);
      if (error || !u) return error ?? 'Error al registrarse';

      await AsyncStorage.multiRemove([
        AUTH_STORAGE_KEYS.guest,
        AUTH_STORAGE_KEYS.skipRestore,
        AUTH_STORAGE_KEYS.onboarding,
        AUTH_STORAGE_KEYS.authIntent,
      ]);
      setHasCompletedOnboarding(false);
      await applyUser(u);
      return null;
    },
    [applyUser, exitGuestForAuth],
  );

  const loginAsGuest = useCallback(async () => {
    await clearAuthSession();
    await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.authIntent);
    await applyGuest();
  }, [applyGuest]);

  const loginWithRoleDemo = useCallback(
    (r: UserRole) => {
      if (useSupabase()) return;
      const base = getUserByRole(r) ?? getUserByRole('comprador')!;
      void applyUser({ ...base, role: r }, false);
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    await clearAuthSession();
    resetLocalSession();
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.skipRestore, '1');
    await AsyncStorage.multiRemove([
      AUTH_STORAGE_KEYS.guest,
      AUTH_STORAGE_KEYS.onboarding,
      AUTH_STORAGE_KEYS.preferences,
      AUTH_STORAGE_KEYS.favorites,
    ]);
    await signOut();
  }, [resetLocalSession]);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.onboarding, 'true');
  }, []);

  const setPreferences = useCallback(
    async (prefs: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const budget = prefs.budget_range
        ? budgetFromRange(prefs.budget_range)
        : { min: prefs.budget_min, max: prefs.budget_max };

      const payload = { ...prefs, budget_min: budget.min, budget_max: budget.max };

      let full: UserPreferences;
      if (user && sessionKind === 'user' && useSupabase()) {
        full = await savePreferences(user.id, payload);
      } else {
        full = {
          id: 'pref-local',
          user_id: user?.id ?? 'local',
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      setPreferencesState(full);
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.preferences, JSON.stringify(full));
    },
    [user, sessionKind],
  );

  const showGuestGate = useCallback((action: 'contact' | 'favorite' | 'appointment' | 'save') => {
    const msg = GUEST_MESSAGES[action];
    setGuestGate({ visible: true, ...msg, actionLabel: 'Crear cuenta' });
  }, []);

  const hideGuestGate = useCallback(() => {
    setGuestGate((g) => ({ ...g, visible: false }));
  }, []);

  const requireAuth = useCallback(
    (action: 'contact' | 'favorite' | 'appointment' | 'save') => {
      if (isGuest) {
        showGuestGate(action);
        return false;
      }
      return true;
    },
    [isGuest, showGuestGate],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!requireAuth('favorite')) return false;

      if (user && useSupabase() && sessionKind === 'user') {
        const added = await toggleFavoriteDb(user.id, id);
        setFavorites((prev) => (added ? [...prev, id] : prev.filter((f) => f !== id)));
        return added;
      }

      let added = false;
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
        added = !prev.includes(id);
        AsyncStorage.setItem(AUTH_STORAGE_KEYS.favorites, JSON.stringify(next));
        return next;
      });
      return added;
    },
    [requireAuth, user, sessionKind],
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const refreshFavorites = useCallback(async () => {
    if (user) await loadFavorites(isGuest ? null : user.id, isGuest);
  }, [user, isGuest, loadFavorites]);

  if (!hydrated) return null;

  return (
    <AppContext.Provider
      value={{
        role,
        user,
        sessionKind,
        isAuthenticated,
        isGuest,
        preferences,
        hasCompletedOnboarding,
        favorites,
        guestGate,
        authLoading,
        signIn,
        signUp,
        loginAsGuest,
        loginWithRoleDemo,
        logout,
        setPreferences,
        completeOnboarding,
        toggleFavorite,
        isFavorite,
        requireAuth,
        showGuestGate,
        hideGuestGate,
        refreshFavorites,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
