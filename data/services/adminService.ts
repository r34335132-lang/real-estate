import type {
  BrokerVerificationStatus,
  PropertyCategory,
  PropertyDocument,
  PublicationStatus,
  User,
  UserRole,
} from '@/data/types';
import { getSupabase } from '@/lib/supabase';

export interface AdminCreateUserInput {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  company_name?: string;
  whatsapp?: string;
  avatar_url?: string;
  specialties?: string[];
  certifications?: string[];
  ampi_number?: string;
  sedetus_number?: string;
  verification_status?: BrokerVerificationStatus;
}

export interface AdminBrokerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  whatsapp: string;
  avatar_url: string;
  specialties: string[];
  certifications: string[];
  ampi_number: string;
  sedetus_number: string;
  license_type: string;
  id_document_url: string;
  verification_status: BrokerVerificationStatus;
  rejection_reason: string | null;
}

export interface AdminProperty {
  id: string;
  broker_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  category: PropertyCategory;
  images: string[];
  publication_status: PublicationStatus;
  rejection_reason: string | null;
  documents_completed: boolean;
  broker: AdminBrokerProfile | null;
  documents: PropertyDocument[];
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    full_name: (row.full_name as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    avatar_url: (row.avatar_url as string) ?? undefined,
    role: row.role as UserRole,
    created_at: (row.created_at as string) ?? '',
    updated_at: (row.updated_at as string) ?? '',
  };
}

function mapBroker(row: Record<string, unknown>): AdminBrokerProfile {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    full_name: (row.full_name as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    company_name: (row.company_name as string) ?? '',
    whatsapp: (row.whatsapp as string) ?? '',
    avatar_url: (row.avatar_url as string) ?? '',
    specialties: (row.specialties as string[]) ?? [],
    certifications: (row.certifications as string[]) ?? [],
    ampi_number: (row.ampi_number as string) ?? '',
    sedetus_number: (row.sedetus_number as string) ?? '',
    license_type: (row.license_type as string) ?? '',
    id_document_url: (row.id_document_url as string) ?? '',
    verification_status: (row.verification_status as BrokerVerificationStatus) ?? 'pending',
    rejection_reason: (row.rejection_reason as string) ?? null,
  };
}

function mapDocument(row: Record<string, unknown>): PropertyDocument {
  return {
    id: row.id as string,
    property_id: row.property_id as string,
    document_type: row.document_type as PropertyDocument['document_type'],
    file_url: (row.file_url as string) ?? '',
    status: (row.status as PropertyDocument['status']) ?? 'pending',
    rejection_reason: (row.rejection_reason as string) ?? null,
    created_at: (row.created_at as string) ?? '',
  };
}

export async function fetchAdminUsers(): Promise<User[]> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapUser);
}

export async function createAdminUser(input: AdminCreateUserInput): Promise<void> {
  const { data, error } = await getSupabase().functions.invoke('admin-create-user', {
    body: input,
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

export async function fetchAdminBrokers(): Promise<AdminBrokerProfile[]> {
  const { data, error } = await getSupabase()
    .from('broker_profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapBroker);
}

export async function updateAdminBrokerStatus(
  brokerId: string,
  status: BrokerVerificationStatus,
  rejectionReason: string | null,
): Promise<void> {
  if (status === 'rejected' && !rejectionReason?.trim()) {
    throw new Error('Ingresa el motivo de rechazo.');
  }
  const { error } = await getSupabase()
    .from('broker_profiles')
    .update({
      verification_status: status,
      verified: status === 'approved',
      rejection_reason: status === 'rejected' ? rejectionReason?.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', brokerId);
  if (error) throw error;
}

export async function fetchAdminProperties(): Promise<AdminProperty[]> {
  const supabase = getSupabase();
  const [{ data: properties, error: propertyError }, { data: brokers, error: brokerError }] =
    await Promise.all([
      supabase
        .from('properties')
        .select('*')
        .in('publication_status', ['draft', 'pending_review', 'rejected'])
        .order('created_at', { ascending: false }),
      supabase.from('broker_profiles').select('*'),
    ]);

  if (propertyError) throw propertyError;
  if (brokerError) throw brokerError;

  const propertyRows = properties as Record<string, unknown>[];
  const propertyIds = propertyRows.map((row) => row.id as string);
  const { data: documents, error: documentError } = propertyIds.length
    ? await supabase.from('property_documents').select('*').in('property_id', propertyIds)
    : { data: [], error: null };
  if (documentError) throw documentError;

  const brokerMap = new Map(
    (brokers as Record<string, unknown>[]).map((row) => [row.id as string, mapBroker(row)]),
  );
  const documentRows = (documents as Record<string, unknown>[]).map(mapDocument);

  return propertyRows.map((row) => ({
    id: row.id as string,
    broker_id: (row.broker_id as string) ?? '',
    title: (row.title as string) ?? '',
    description: (row.description as string) ?? '',
    price: Number(row.price ?? 0),
    currency: (row.currency as string) ?? 'MXN',
    location: (row.location as string) ?? '',
    category: row.category as PropertyCategory,
    images: ((row.images as string[]) ?? []).filter(Boolean),
    publication_status: (row.publication_status as PublicationStatus) ?? 'draft',
    rejection_reason: (row.rejection_reason as string) ?? null,
    documents_completed: Boolean(row.documents_completed),
    broker: brokerMap.get((row.broker_id as string) ?? '') ?? null,
    documents: documentRows.filter((doc) => doc.property_id === row.id),
  }));
}

export async function updateAdminPropertyStatus(
  property: AdminProperty,
  status: Extract<PublicationStatus, 'published' | 'rejected' | 'pending_review'>,
  rejectionReason: string | null,
): Promise<void> {
  if (
    status === 'published'
    && (
      property.images.length === 0
      || !property.documents_completed
      || property.documents.length === 0
      || property.documents.some((document) => document.status !== 'approved')
    )
  ) {
    throw new Error('La propiedad necesita imagenes y documentacion aprobada antes de publicarse.');
  }
  if (status === 'rejected' && !rejectionReason?.trim()) {
    throw new Error('Ingresa el motivo de rechazo.');
  }

  const { error } = await getSupabase()
    .from('properties')
    .update({
      publication_status: status,
      rejection_reason: status === 'rejected' ? rejectionReason?.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', property.id);
  if (error) throw error;
}

export async function updateAdminDocumentStatus(
  documentId: string,
  status: PropertyDocument['status'],
  rejectionReason: string | null,
): Promise<void> {
  if (status === 'rejected' && !rejectionReason?.trim()) {
    throw new Error('Ingresa el motivo de rechazo del documento.');
  }

  const { error } = await getSupabase()
    .from('property_documents')
    .update({
      status,
      rejection_reason: status === 'rejected' ? rejectionReason?.trim() : null,
    })
    .eq('id', documentId);
  if (error) throw error;
}
