import { router, type Href } from 'expo-router';

import { routes } from '@/lib/routes';

/** Evita el error GO_BACK cuando no hay pantalla anterior (p. ej. tras router.replace) */
export function goBackOr(fallback: Href = routes.tabs) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
