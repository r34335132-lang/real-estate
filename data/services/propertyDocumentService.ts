import type { PropertyDocument, PropertyDocumentType } from '@/data/types';
import { useSupabase } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

export const REQUIRED_PROPERTY_DOCUMENTS: { type: PropertyDocumentType; label: string }[] = [
  { type: 'escritura_publica', label: 'Escritura publica' },
  { type: 'libre_gravamen', label: 'Libre de gravamen' },
  { type: 'cedula_catastral', label: 'Cedula catastral' },
  { type: 'planos', label: 'Planos' },
  { type: 'predial', label: 'Predial' },
  { type: 'servicios', label: 'Servicios' },
  { type: 'identificacion_propietario', label: 'Identificacion del propietario' },
  { type: 'autorizacion_propietario', label: 'Autorizacion del propietario' },
];

function mapDocument(row: Record<string, unknown>): PropertyDocument {
  return {
    id: row.id as string,
    property_id: row.property_id as string,
    document_type: row.document_type as PropertyDocumentType,
    file_url: (row.file_url as string) ?? '',
    status: (row.status as PropertyDocument['status']) ?? 'pending',
    rejection_reason: (row.rejection_reason as string) ?? null,
    created_at: (row.created_at as string) ?? '',
  };
}

export function hasAllRequiredPropertyDocuments(documents: Pick<PropertyDocument, 'document_type' | 'file_url'>[]) {
  return REQUIRED_PROPERTY_DOCUMENTS.every((required) =>
    documents.some((doc) => doc.document_type === required.type && Boolean(doc.file_url)),
  );
}

export async function fetchPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('property_documents')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapDocument);
}

export async function createPropertyDocuments(
  propertyId: string,
  documents: { document_type: PropertyDocumentType; file_url: string }[],
): Promise<PropertyDocument[]> {
  if (!hasAllRequiredPropertyDocuments(documents)) {
    throw new Error('Para publicar esta propiedad debes completar la documentacion legal requerida.');
  }

  const { data, error } = await getSupabase()
    .from('property_documents')
    .insert(
      documents.map((doc) => ({
        property_id: propertyId,
        document_type: doc.document_type,
        file_url: doc.file_url,
        status: 'pending',
        rejection_reason: null,
      })),
    )
    .select();

  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapDocument);
}
