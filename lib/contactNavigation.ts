import { router } from 'expo-router';

export interface ContactFormParams {
  interest?: 'comprar' | 'vender' | 'rentar' | 'invertir' | 'asesoria';
  message?: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyPrice?: string;
  propertyLocation?: string;
  propertyReference?: string;
  requestType?: string;
  requestTitle?: string;
}

export function openContactForm(params: ContactFormParams = {}): void {
  router.push({
    pathname: '/(main)/contact',
    params,
  } as never);
}
