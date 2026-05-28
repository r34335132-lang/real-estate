import Images from '@/constants/images';

import { Broker, BrokerProfile } from './types';

export const MOCK_BROKER_PROFILES: BrokerProfile[] = [
  {
    id: 'bp-1',
    user_id: 'u-broker-1',
    company_name: 'JC Real Estate Group',
    professional_title: 'Senior Broker Inmobiliario',
    bio: 'Con más de 15 años de experiencia en el sector inmobiliario de lujo, Carlos ha cerrado operaciones por más de $500 millones de pesos. Especialista en propiedades premium residenciales y comerciales en CDMX y Riviera Maya.',
    city: 'Ciudad de México',
    state: 'CDMX',
    phone: '+52 55 1234 5678',
    whatsapp: '+52 55 1234 5678',
    email: 'cmendoza@jcrealestate.mx',
    years_experience: 15,
    specialties: ['Propiedades de lujo', 'Comercial', 'Residencial premium'],
    certifications: ['AMPI Certificado', 'Valuador Inmobiliario', 'NAR Member'],
    rating: 4.9,
    total_sales: 87,
    active_properties: 14,
    verified: true,
    image: Images.broker1,
    reviews: 128,
    instagram: '@cmendoza_realestate',
    linkedin: 'carlos-mendoza-jcre',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'bp-2',
    user_id: 'u-broker-2',
    company_name: 'JC Real Estate Group',
    professional_title: 'Asesora Inmobiliaria Premium',
    bio: 'Especialista en propiedades frente al mar y desarrollos turísticos en el Caribe Mexicano. Con 10 años de trayectoria, Sofía ha trabajado con los desarrolladores más exclusivos de la Riviera Maya.',
    city: 'Cancún',
    state: 'Quintana Roo',
    phone: '+52 998 765 4321',
    whatsapp: '+52 998 765 4321',
    email: 'svargas@jcrealestate.mx',
    years_experience: 10,
    specialties: ['Residencial de alto nivel', 'Playa', 'Turismo inmobiliario'],
    certifications: ['AMPI Certificada', 'Especialista Turismo Inmobiliario'],
    rating: 4.8,
    total_sales: 62,
    active_properties: 9,
    verified: true,
    image: Images.broker2,
    reviews: 96,
    instagram: '@sofia_vargas_re',
    linkedin: 'sofia-vargas-realestate',
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2025-02-15T10:00:00Z',
  },
  {
    id: 'bp-3',
    user_id: 'u-broker-1',
    company_name: 'JC Real Estate Group',
    professional_title: 'Director Comercial',
    bio: 'Experto en activos comerciales e industriales con presencia en los principales mercados del norte del país. Más de 12 años conectando inversionistas con las mejores oportunidades.',
    city: 'Monterrey',
    state: 'Nuevo León',
    phone: '+52 81 9876 5432',
    whatsapp: '+52 81 9876 5432',
    email: 'ralvarez@jcrealestate.mx',
    years_experience: 12,
    specialties: ['Edificios', 'Activos comerciales', 'Industrial'],
    certifications: ['AMPI Certificado', 'MBA Negocios Inmobiliarios'],
    rating: 4.7,
    total_sales: 49,
    active_properties: 11,
    verified: true,
    image: Images.broker1,
    reviews: 74,
    instagram: '@roberto_alvarez_re',
    linkedin: 'roberto-alvarez-re',
    created_at: '2024-05-01T10:00:00Z',
    updated_at: '2025-01-10T10:00:00Z',
  },
];

/** IDs cortos usados en propiedades (b1, b2, b3) */
const BROKER_ID_MAP: Record<string, string> = {
  b1: 'bp-1',
  b2: 'bp-2',
  b3: 'bp-3',
};

export function profileToBroker(p: BrokerProfile, legacyId?: string): Broker {
  return {
    id: legacyId ?? p.id,
    name: p.user_id === 'u-broker-1' && p.id === 'bp-3' ? 'Roberto Álvarez' : p.user_id === 'u-broker-2' ? 'Sofía Vargas' : 'Carlos Mendoza',
    title: p.professional_title,
    company: p.company_name,
    specialty: p.specialties[0] ?? '',
    specialties: p.specialties,
    location: `${p.city}, ${p.state}`,
    phone: p.phone,
    whatsapp: p.whatsapp,
    email: p.email,
    bio: p.bio,
    experience: p.years_experience,
    rating: p.rating,
    reviews: p.reviews ?? 0,
    activeListings: p.active_properties,
    closedSales: p.total_sales,
    verified: p.verified,
    certifications: p.certifications,
    image: p.image,
    instagram: p.instagram,
    linkedin: p.linkedin,
  };
}

export const BROKERS: Broker[] = [
  profileToBroker(MOCK_BROKER_PROFILES[0], 'b1'),
  profileToBroker(MOCK_BROKER_PROFILES[1], 'b2'),
  profileToBroker(MOCK_BROKER_PROFILES[2], 'b3'),
];

export function getBrokerById(id: string): Broker | undefined {
  return BROKERS.find((b) => b.id === id);
}

export function getBrokerProfileByLegacyId(id: string): BrokerProfile | undefined {
  const mapped = BROKER_ID_MAP[id] ?? id;
  return MOCK_BROKER_PROFILES.find((p) => p.id === mapped || p.id === id);
}
