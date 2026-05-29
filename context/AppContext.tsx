import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { budgetFromRange } from '@/data/mockPreferences';
import { getUserByRole } from '@/data/mockUsers';
import {
  clearAuthSession,
  restoreSession,
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
  peekAuthIntent,
  setAuthIntent,
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
  pendingAuthIntent: AuthIntent | null;
  favorites: string[];
  guestGate: GuestGateConfig;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<string | null>;
  loginAsGuest: () => Promise<void>;
  loginWithRoleDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  exitGuestToAuth: (intent: AuthIntent) => Promise<void>;
  setPendingAuthIntent: (intent: AuthIntent | null) => Promise<void>;
  clearPendingAuthIntent: () => Promise<void>;
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

async function loadGuestLocalState(): Promise<{
  preferences: UserPreferences | null;
  hasOnboarding: boolean;
}> {
  const [guestOnboarding, localPrefs] = await Promise.all([
    AsyncStorage.getItem(AUTH_STORAGE_KEYS.guestOnboarding),
    AsyncStorage.getItem(AUTH_STORAGE_KEYS.preferences),
  ]);
  return {
    preferences: localPrefs ? (JSON.parse(localPrefs) as UserPreferences) : null,
    hasOnboarding: guestOnboarding === 'true',
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('comprador');
  const [user, setUser] = useState<User | null>(null);
  const [sessionKind, setSessionKind] = useState<SessionKind>('none');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [preferences, setPreferencesState] = useState<UserPreferences | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [pendingAuthIntent, setPendingAuthIntentState] = useState<AuthIntent | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [guestGate, setGuestGate] = useState<GuestGateConfig>({
    visible: false,
    title: '',
    message: '',
  });
  const [hydrated, setHydrated] = useState(false);
  const sessionKindRef = useRef<SessionKind>('none');

  useEffect(() => {
    sessionKindRef.current = sessionKind;
  }, [sessionKind]);

  const isAuthenticated = sessionKind !== 'none';
  const isGuest = sessionKind === 'guest';

  const setPendingAuthIntent = useCallback(async (intent: AuthIntent | null) => {
    if (intent) {
      await setAuthIntent(intent);
      setPendingAuthIntentState(intent);
    } else {
      await clearAuthIntent();
      setPendingAuthIntentState(null);
    }
  }, []);

  const clearPendingAuthIntent = useCallback(async () => {
    await clearAuthIntent();
    setPendingAuthIntentState(null);
  }, []);

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

      if (guest) {
        const local = await loadGuestLocalState();
        if (local.preferences) setPreferencesState(local.preferences);
        onboarded = local.hasOnboarding;
      } else if (useSupabase()) {
        const prefs = await fetchPreferences(u.id);
        if (prefs) {
          setPreferencesState(prefs);
          onboarded = true;
          await AsyncStorage.setItem(AUTH_STORAGE_KEYS.onboarding, 'true');
        } else {
          const userOnboarding = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.onboarding);
          onboarded = userOnboarding === 'true';
        }
      }

      setUser(u);
      setRole(u.role);
      setSessionKind(guest ? 'guest' : 'user');
      setHasCompletedOnboarding(onboarded);
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

    (async () => {
      try {
        await migrateAuthStorageIfNeeded();

        const [userOnboarding, guestFlag, skipRestore, storedIntent] = await Promise.all([
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.onboarding),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.guest),
          AsyncStorage.getItem(AUTH_STORAGE_KEYS.skipRestore),
          peekAuthIntent(),
        ]);

        if (!cancelled && storedIntent) {
          setPendingAuthIntentState(storedIntent);
        }

        if (skipRestore === '1') {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.skipRestore);
          await clearAuthSession();
        } else if (useSupabase()) {
          const profile = await restoreSession();
          if (!cancelled && profile) {
            if (guestFlag === 'true') await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.guest);
            await clearPendingAuthIntent();
            await applyUser(profile);
            return;
          }
        }

        if (!cancelled && guestFlag === 'true') {
          const guestUser = getUserByRole('invitado')!;
          await applyUser(guestUser, true);
          return;
        }

        if (!cancelled && userOnboarding === 'true') {
          setHasCompletedOnboarding(true);
        }

        if (!cancelled && !useSupabase()) {
          const local = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.favorites);
          if (local) setFavorites(JSON.parse(local));
          const localPrefs = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.preferences);
          if (localPrefs) setPreferencesState(JSON.parse(localPrefs));
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
  }, [applyUser, clearPendingAuthIntent]);

  const exitGuestToAuth = useCallback(
    async (intent: AuthIntent) => {
      await setPendingAuthIntent(intent);
      await clearAuthSession();
      resetLocalSession();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.guest);
    },
    [resetLocalSession, setPendingAuthIntent],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (sessionKindRef.current === 'guest') {
        await exitGuestToAuth('login');
      }

      const { user: u, error } = await signInWithEmail(email, password);
      if (error || !u) return error ?? 'Error al iniciar sesión';

      await AsyncStorage.multiRemove([AUTH_STORAGE_KEYS.guest, AUTH_STORAGE_KEYS.skipRestore]);
      await clearPendingAuthIntent();
      await applyUser(u);
      return null;
    },
    [applyUser, clearPendingAuthIntent, exitGuestToAuth],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, selectedRole: UserRole) => {
      if (sessionKindRef.current === 'guest') {
        await exitGuestToAuth('register');
      }

      const { user: u, error } = await signUpWithEmail(email, password, fullName, selectedRole);
      if (error || !u) return error ?? 'Error al registrarse';

      await AsyncStorage.multiRemove([
        AUTH_STORAGE_KEYS.guest,
        AUTH_STORAGE_KEYS.skipRestore,
        AUTH_STORAGE_KEYS.onboarding,
        AUTH_STORAGE_KEYS.guestOnboarding,
      ]);
      setHasCompletedOnboarding(false);
      await clearPendingAuthIntent();
      await applyUser(u);
      return null;
    },
    [applyUser, clearPendingAuthIntent, exitGuestToAuth],
  );

  const loginAsGuest = useCallback(async () => {
    await clearAuthSession();
    await clearPendingAuthIntent();
    await applyGuest();
  }, [applyGuest, clearPendingAuthIntent]);

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
      AUTH_STORAGE_KEYS.guestOnboarding,
      AUTH_STORAGE_KEYS.preferences,
      AUTH_STORAGE_KEYS.favorites,
    ]);
  }, [resetLocalSession]);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    if (sessionKindRef.current === 'guest') {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.guestOnboarding, 'true');
    } else {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.onboarding, 'true');
    }
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
        pendingAuthIntent,
        favorites,
        guestGate,
        authLoading,
        signIn,
        signUp,
        loginAsGuest,
        loginWithRoleDemo,
        logout,
        exitGuestToAuth,
        setPendingAuthIntent,
        clearPendingAuthIntent,
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
