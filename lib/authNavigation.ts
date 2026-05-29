import { router } from 'expo-router';

import { routes } from '@/lib/routes';

/**
 * Vuelve al welcome. Solo usa `replace` — `dismissAll()` dispara POP_TO_TOP
 * y falla en el Stack plano de Expo Router cuando no hay historial.
 */
export function goToWelcome(): void {
  router.replace(routes.welcome);
}

export function goToOnboarding(): void {
  router.replace(routes.onboarding);
}

export function goToTabs(): void {
  router.replace(routes.tabs);
}
