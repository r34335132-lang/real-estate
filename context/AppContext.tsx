import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { budgetFromRange } from '@/data/catalog';
import {
  clearAuthSession,
  signInWithEmail,
  signUpWithEmail,
} from '@/data/services/authService';
import { fetchFavoriteIds, toggleFavoriteDb } from '@/data/services/favoriteService';
import { fetchPreferences, savePreferences } from '@/data/services/preferenceService';
import { User, UserPreferences, UserRole } from '@/data/types';
import {
  AUTH_STORAGE_KEYS,
  type AuthIntent,
  clearAuthIntent,
  migrateAuthStorageIfNeeded,
} from '@/lib/authStorage';
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
  loginAsGuest: () => Promise<string | null>;
  logout: () => Promise<void>;
  exitGuestToAuth: (intent: AuthIntent) => Promise<void>;
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

const LOCAL_SESSION_KEYS = [
  AUTH_STORAGE_KEYS.guest,
  AUTH_STORAGE_KEYS.skipRestore,
  AUTH_STORAGE_KEYS.authIntent,
  AUTH_STORAGE_KEYS.onboarding,
  AUTH_STORAGE_KEYS.guestOnboarding,
  AUTH_STORAGE_KEYS.preferences,
  AUTH_STORAGE_KEYS.favorites,
  're_jc_registered_guest_email',
  're_jc_registered_guest_password',
];

async function clearLocalSessionStorage() {
  await AsyncStorage.multiRemove(LOCAL_SESSION_KEYS);
}

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

  const isAuthenticated = sessionKind !== 'none';
  const isGuest = sessionKind === 'guest';

  const clearPendingAuthIntent = useCallback(async () => {
    await clearAuthIntent();
  }, []);

  const resetLocalSession = useCallback(() => {
    setUser(null);
    setRole('comprador');
    setSessionKind('none');
    setFavorites([]);
    setPreferencesState(null);
    setHasCompletedOnboarding(false);
  }, []);

  const applyGuestSession = useCallback(() => {
    setUser(null);
    setRole('invitado');
    setSessionKind('guest');
    setFavorites([]);
    setPreferencesState(null);
    setHasCompletedOnboarding(false);
  }, []);

  const loadFavorites = useCallback(async (userId: string | null, guest: boolean) => {
    if (guest || !userId) {
      setFavorites([]);
      return;
    }
    if (useSupabase()) {
      try {
        const ids = await fetchFavoriteIds(userId);
        setFavorites(ids);
      } catch {
        setFavorites([]);
      }
    } else {
      setFavorites([]);
    }
  }, []);

  const applyUser = useCallback(
    async (u: User, guest = false) => {
      await loadFavorites(guest ? null : u.id, guest);

      let onboarded = false;

      if (guest) {
        onboarded = false;
      } else if (useSupabase()) {
        const prefs = await fetchPreferences(u.id);
        if (prefs) {
          setPreferencesState(prefs);
          onboarded = true;
        } else {
          onboarded = false;
        }
      }

      setUser(u);
      setRole(u.role);
      setSessionKind(guest ? 'guest' : 'user');
      setHasCompletedOnboarding(onboarded);
    },
    [loadFavorites],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await migrateAuthStorageIfNeeded();

        await clearLocalSessionStorage();

        await clearAuthSession();

        if (!cancelled) {
          resetLocalSession();
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyUser, clearPendingAuthIntent, resetLocalSession]);

  const exitGuestToAuth = useCallback(
    async (_intent: AuthIntent) => {
      try {
        resetLocalSession();
        await clearPendingAuthIntent();
        await clearLocalSessionStorage();
        resetLocalSession();
        await clearAuthSession();
        resetLocalSession();
      } finally {
        setAuthLoading(false);
      }
    },
    [clearPendingAuthIntent, resetLocalSession],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { user: u, error } = await signInWithEmail(email, password);
      if (error || !u) return error ?? 'Error al iniciar sesión';

      await clearLocalSessionStorage();
      await clearPendingAuthIntent();
      await applyUser(u);
      return null;
    },
    [applyUser, clearPendingAuthIntent],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, selectedRole: UserRole) => {
      const { user: u, error } = await signUpWithEmail(email, password, fullName, selectedRole);
      if (error || !u) return error ?? 'Error al registrarse';

      await clearLocalSessionStorage();
      setHasCompletedOnboarding(false);
      await clearPendingAuthIntent();
      await applyUser(u);
      return null;
    },
    [applyUser, clearPendingAuthIntent],
  );

  const loginAsGuest = useCallback(async () => {
    try {
      resetLocalSession();
      await clearPendingAuthIntent();
      await clearLocalSessionStorage();
      await clearAuthSession();
      applyGuestSession();
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [applyGuestSession, clearPendingAuthIntent, resetLocalSession]);

  const logout = useCallback(async () => {
    try {
      resetLocalSession();
      await clearPendingAuthIntent();
      await clearLocalSessionStorage();
      await clearAuthSession();
      resetLocalSession();
    } finally {
      setAuthLoading(false);
    }
  }, [clearPendingAuthIntent, resetLocalSession]);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
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
        logout,
        exitGuestToAuth,
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
