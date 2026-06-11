import { Alert, Linking } from 'react-native';

export const SUPPORT_EMAIL = 'soporte@realestatejc.com';
export const CONTACT_WHATSAPP_NUMBER = '529982240008';
export const SUPPORT_WHATSAPP = '+52 9982 240008';
export const CONTACT_WHATSAPP_MESSAGE =
  'Hola, quiero recibir asesoria sobre una propiedad.';
export const CONTACT_WHATSAPP_URL =
  `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(CONTACT_WHATSAPP_MESSAGE)}`;
export const SATISFIED_CLIENTS_URL = 'https://abogado-juliom-corona.webnode.es/';

export async function openContactWhatsApp(message = CONTACT_WHATSAPP_MESSAGE): Promise<void> {
  const url = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir WhatsApp', `Contactanos al ${SUPPORT_WHATSAPP}.`);
  }
}

export async function openSatisfiedClientsPage(): Promise<void> {
  try {
    await Linking.openURL(SATISFIED_CLIENTS_URL);
  } catch {
    Alert.alert('No se pudo abrir la pagina', SATISFIED_CLIENTS_URL);
  }
}
