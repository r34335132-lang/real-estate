import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { budgetFromRange } from '@/data/mockPreferences';
import { getUserByRole } from '@/data/mockUsers';
import { signInWithEmail, signOut, signUpWithEmail, restoreSession } from '@/data/services/authService';
import { fetchFavoriteIds, toggleFavoriteDb } from '@/data/services/favoriteService';
import { fetchPreferences, savePreferences } from '@/data/services/preferenceService';
import { User, UserPreferences, UserRole } from '@/data/types';
import { useSupabase } from '@/lib/env';

const STORAGE_KEYS = {
  favorites: 're_jc_favorites',
  preferences: 're_jc_preferences',
  onboarding: 're_jc_onboarding_done',
  guest: 're_jc_guest',
};

interface GuestGateConfig {
  visible: boolean;
  title: string;
  message: string;
  actionLabel?: string;
}

interface AppContextType {
  role: UserRole;
  user: User | null;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  const loadFavorites = useCallback(async (userId: string | null, isGuestUser: boolean) => {
    if (isGuestUser || !userId) {
      const local = await AsyncStorage.getItem(STORAGE_KEYS.favorites);
      if (local) setFavorites(JSON.parse(local));
      return;
    }
    if (useSupabase()) {
      try {
        const ids = await fetchFavoriteIds(userId);
        setFavorites(ids);
      } catch {
        const local = await AsyncStorage.getItem(STORAGE_KEYS.favorites);
        if (local) setFavorites(JSON.parse(local));
      }
    } else {
      const local = await AsyncStorage.getItem(STORAGE_KEYS.favorites);
      if (local) setFavorites(JSON.parse(local));
    }
  }, []);

  const applyUser = useCallback(
    async (u: User, guest = false) => {
      setUser(u);
      setRole(u.role);
      setIsAuthenticated(true);
      await loadFavorites(guest ? null : u.id, guest);

      if (!guest && useSupabase()) {
        const prefs = await fetchPreferences(u.id);
        if (prefs) {
          setPreferencesState(prefs);
          setHasCompletedOnboarding(true);
          await AsyncStorage.setItem(STORAGE_KEYS.onboarding, 'true');
        }
      }
    },
    [loadFavorites],
  );

  useEffect(() => {
    (async () => {
      try {
        const [onboarding, guestFlag, localPrefs] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.onboarding),
          AsyncStorage.getItem(STORAGE_KEYS.guest),
          AsyncStorage.getItem(STORAGE_KEYS.preferences),
        ]);

        if (onboarding === 'true') setHasCompletedOnboarding(true);
        if (localPrefs) setPreferencesState(JSON.parse(localPrefs));

        if (guestFlag === 'true') {
          const guestUser = getUserByRole('invitado')!;
          await applyUser(guestUser, true);
        } else if (useSupabase()) {
          const profile = await restoreSession();
          if (profile) await applyUser(profile);
        } else {
          const local = await AsyncStorage.getItem(STORAGE_KEYS.favorites);
          if (local) setFavorites(JSON.parse(local));
        }
      } finally {
        setAuthLoading(false);
        setHydrated(true);
      }
    })();
  }, [applyUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { user: u, error } = await signInWithEmail(email, password);
      if (error || !u) return error ?? 'Error al iniciar sesión';
      await AsyncStorage.removeItem(STORAGE_KEYS.guest);
      await applyUser(u);
      return null;
    },
    [applyUser],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, selectedRole: UserRole) => {
      const { user: u, error } = await signUpWithEmail(email, password, fullName, selectedRole);
      if (error || !u) return error ?? 'Error al registrarse';
      await AsyncStorage.removeItem(STORAGE_KEYS.guest);
      await applyUser(u);
      setHasCompletedOnboarding(false);
      await AsyncStorage.removeItem(STORAGE_KEYS.onboarding);
      return null;
    },
    [applyUser],
  );

  const loginAsGuest = useCallback(async () => {
    const guestUser = getUserByRole('invitado')!;
    await AsyncStorage.setItem(STORAGE_KEYS.guest, 'true');
    await applyUser(guestUser, true);
  }, [applyUser]);

  const loginWithRoleDemo = useCallback(
    (r: UserRole) => {
      if (useSupabase()) return;
      const base = getUserByRole(r) ?? getUserByRole('comprador')!;
      void applyUser({ ...base, role: r }, false);
    },
    [applyUser],
  );

  // <-- FUNCIÓN DE LOGOUT OPTIMIZADA -->
  const logout = useCallback(async () => {
    await signOut();
    // Limpiamos los estados primero para que la app sepa instantáneamente que ya no hay sesión
    setIsAuthenticated(false);
    setUser(null);
    setRole('comprador');
    setFavorites([]);
    setHasCompletedOnboarding(false);
    // Finalmente limpiamos el storage
    await AsyncStorage.multiRemove([STORAGE_KEYS.guest, STORAGE_KEYS.onboarding]);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(STORAGE_KEYS.onboarding, 'true');
  }, []);

  const setPreferences = useCallback(
    async (prefs: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const budget = prefs.budget_range
        ? budgetFromRange(prefs.budget_range)
        : { min: prefs.budget_min, max: prefs.budget_max };

      const payload = { ...prefs, budget_min: budget.min, budget_max: budget.max };

      let full: UserPreferences;
      if (user && user.role !== 'invitado' && useSupabase()) {
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
      await AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(full));
    },
    [user],
  );

  const isGuest = role === 'invitado';

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

      if (user && useSupabase() && !isGuest) {
        const added = await toggleFavoriteDb(user.id, id);
        setFavorites((prev) => (added ? [...prev, id] : prev.filter((f) => f !== id)));
        return added;
      }

      let added = false;
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
        added = !prev.includes(id);
        AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(next));
        return next;
      });
      return added;
    },
    [requireAuth, user, isGuest],
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