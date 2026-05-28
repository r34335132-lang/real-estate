import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useApp } from '@/context/AppContext';
import { peekAuthIntent } from '@/lib/authStorage';
import { routes } from '@/lib/routes';

/**
 * Única fuente de redirecciones de auth (Expo Router).
 * Evita pelear entre index, tabs y onAuthStateChange.
 */
export function AuthGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { sessionKind, authLoading, hasCompletedOnboarding } = useApp();

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      const intent = await peekAuthIntent();
      const wantsAuthForm = intent === 'login' || intent === 'register';
      const onWelcome = pathname === '/' || pathname === '';
      const inMainApp =
        pathname.startsWith('/(tabs)') ||
        pathname === '/onboarding' ||
        pathname.startsWith('/onboarding');

      if (cancelled) return;

      if (sessionKind === 'none') {
        if (inMainApp) {
          router.replace('/');
        }
        return;
      }

      if (wantsAuthForm && onWelcome) {
        return;
      }

      if (sessionKind === 'guest') {
        if (onWelcome && !wantsAuthForm) {
          router.replace(routes.tabs);
        }
        return;
      }

      if (sessionKind === 'user') {
        if (onWelcome && !wantsAuthForm) {
          router.replace(hasCompletedOnboarding ? routes.tabs : routes.onboarding);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionKind, authLoading, pathname, hasCompletedOnboarding, router]);

  return null;
}
