import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { budgetFromRange } from '@/data/catalog';
import {
  clearAuthSession,
  restoreSession,
  signInWithEmail,
  signUpWithEmail,
  updateCurrentUserProfile,
} from '@/data/services/authService';
import { fetchFavoriteIds, toggleFavoriteDb } from '@/data/services/favoriteService';
import { fetchPreferences, savePreferences } from '@/data/services/preferenceService';
import { User, UserPreferences, UserRole } from '@/data/types';
import { AUTH_STORAGE_KEYS, clearLegacyAuthStorage, migrateAuthStorageIfNeeded } from '@/lib/authStorage';
import { useSupabase } from '@/lib/env';

export type SessionKind = 'none' | 'user';

interface AppContextType {
  role: UserRole;
  user: User | null;
  sessionKind: SessionKind;
  isAuthenticated: boolean;
  preferences: UserPreferences | null;
  hasCompletedOnboarding: boolean;
  favorites: string[];
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<string | null>;
  logout: () => Promise<void>;
  setPreferences: (prefs: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;
  isFavorite: (id: string) => boolean;
  requireAuth: (action: 'contact' | 'favorite' | 'appointment' | 'save') => boolean;
  refreshFavorites: () => Promise<void>;
  updateProfile: (input: {
    phone: string;
    avatarUrl?: string | null;
    password?: string;
  }) => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('buyer');
  const [user, setUser] = useState<User | null>(null);
  const [sessionKind, setSessionKind] = useState<SessionKind>('none');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [preferences, setPreferencesState] = useState<UserPreferences | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const isAuthenticated = sessionKind === 'user';

  const resetLocalSession = useCallback(() => {
    console.log('[auth] resetLocalSession');
    setUser(null);
    setRole('buyer');
    setSessionKind('none');
    setFavorites([]);
    setPreferencesState(null);
    setHasCompletedOnboarding(false);
  }, []);

  const loadFavorites = useCallback(async (userId: string | null) => {
    if (!userId || !useSupabase()) {
      setFavorites([]);
      return;
    }

    try {
      const ids = await fetchFavoriteIds(userId);
      setFavorites(ids);
    } catch {
      setFavorites([]);
    }
  }, []);

  const applyUser = useCallback(
    async (u: User, options?: { onboarding?: 'complete' | 'required' }) => {
      await loadFavorites(u.id);

      const storedOnboarding = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.onboarding);
      let onboarded =
        options?.onboarding === 'complete'
          ? true
          : options?.onboarding === 'required'
            ? false
            : storedOnboarding === 'true';
      if (useSupabase()) {
        const prefs = await fetchPreferences(u.id);
        if (prefs) {
          setPreferencesState(prefs);
          onboarded = true;
        }
      }

      if (onboarded) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.onboarding, 'true');
      }

      setUser(u);
      setRole(u.role);
      setSessionKind('user');
      setHasCompletedOnboarding(onboarded);
    },
    [loadFavorites],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await migrateAuthStorageIfNeeded();

        if (useSupabase()) {
          const profile = await restoreSession();
          if (!cancelled && profile) {
            await applyUser(profile, { onboarding: 'complete' });
            return;
          }
        }

        if (!cancelled) resetLocalSession();
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
  }, [applyUser, resetLocalSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { user: u, error } = await signInWithEmail(email, password);
      if (error || !u) return error ?? 'Error al iniciar sesion';

      await clearLegacyAuthStorage();
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.onboarding, 'true');
      await applyUser(u, { onboarding: 'complete' });
      return null;
    },
    [applyUser],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, selectedRole: UserRole) => {
      const { user: u, error } = await signUpWithEmail(email, password, fullName, selectedRole);
      if (error || !u) return error ?? 'Error al registrarse';

      await clearLegacyAuthStorage();
      setHasCompletedOnboarding(false);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.onboarding);
      await applyUser(u, { onboarding: 'required' });
      return null;
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    console.log('[auth] logout:start', { sessionKind, userId: user?.id });
    setAuthLoading(true);
    try {
      await clearAuthSession();
      console.log('[auth] logout:clearAuthSession:done');
      resetLocalSession();
      console.log('[auth] logout:resetLocalSession:done');
    } catch (error) {
      console.log('[auth] logout:error', error);
      resetLocalSession();
    } finally {
      setAuthLoading(false);
      console.log('[auth] logout:finish');
    }
  }, [resetLocalSession, sessionKind, user?.id]);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.onboarding, 'true');
  }, []);

  const setPreferences = useCallback(
    async (prefs: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) return;

      const budget = prefs.budget_range
        ? budgetFromRange(prefs.budget_range)
        : { min: prefs.budget_min, max: prefs.budget_max };

      const payload = { ...prefs, budget_min: budget.min, budget_max: budget.max };

      const full =
        useSupabase()
          ? await savePreferences(user.id, payload)
          : {
              id: 'pref-local',
              user_id: user.id,
              ...payload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

      setPreferencesState(full);
    },
    [user],
  );

  const requireAuth = useCallback(
    (_action: 'contact' | 'favorite' | 'appointment' | 'save') => {
      if (!user || sessionKind !== 'user') {
        Alert.alert('Inicia sesion', 'Necesitas iniciar sesion o crear una cuenta para continuar.');
        return false;
      }
      return true;
    },
    [sessionKind, user],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!requireAuth('favorite') || !user) return false;

      if (useSupabase()) {
        const added = await toggleFavoriteDb(user.id, id);
        setFavorites((prev) => (added ? [...prev, id] : prev.filter((f) => f !== id)));
        return added;
      }

      return false;
    },
    [requireAuth, user],
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const refreshFavorites = useCallback(async () => {
    if (user) await loadFavorites(user.id);
  }, [loadFavorites, user]);

  const updateProfile = useCallback(
    async (input: { phone: string; avatarUrl?: string | null; password?: string }) => {
      const updatedUser = await updateCurrentUserProfile(input);
      setUser(updatedUser);
      setRole(updatedUser.role);
    },
    [],
  );

  if (!hydrated) return null;

  return (
    <AppContext.Provider
      value={{
        role,
        user,
        sessionKind,
        isAuthenticated,
        preferences,
        hasCompletedOnboarding,
        favorites,
        authLoading,
        signIn,
        signUp,
        logout,
        setPreferences,
        completeOnboarding,
        toggleFavorite,
        isFavorite,
        requireAuth,
        refreshFavorites,
        updateProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
