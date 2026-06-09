import { Alert, Linking } from 'react-native';

export const SUPPORT_EMAIL = 'soporte@realestatejc.com';
export const CONTACT_WHATSAPP_NUMBER = '52559982240008';
export const SUPPORT_WHATSAPP = '+52 55 9982 240008';
export const CONTACT_WHATSAPP_MESSAGE =
  'Hola, quiero recibir asesoria sobre una propiedad.';
export const CONTACT_WHATSAPP_URL =
  `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(CONTACT_WHATSAPP_MESSAGE)}`;

export async function openContactWhatsApp(message = CONTACT_WHATSAPP_MESSAGE): Promise<void> {
  const url = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir WhatsApp', `Contactanos al ${SUPPORT_WHATSAPP}.`);
  }
}
