import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { getSupabase } from '@/lib/supabase';

export type UploadKind =
  | 'property-image'
  | 'avatar'
  | 'broker-document'
  | 'property-document';

export type PrivateDocumentBucket = 'broker-documents' | 'property-documents';

const UPLOAD_CONFIG: Record<
  UploadKind,
  { bucket: string; isPublic: boolean; allowsEditing: boolean }
> = {
  'property-image': { bucket: 'property-images', isPublic: true, allowsEditing: true },
  avatar: { bucket: 'avatars', isPublic: true, allowsEditing: true },
  'broker-document': { bucket: 'broker-documents', isPublic: false, allowsEditing: false },
  'property-document': { bucket: 'property-documents', isPublic: false, allowsEditing: false },
};

/**
 * Public property photos and avatars return a public URL.
 * Sensitive broker/property documents return only their private object path.
 * Private document paths must only be opened by an admin using a temporary signed URL.
 */
export async function pickAndUploadImage(
  kind: UploadKind,
  userId?: string,
): Promise<string | null> {
  if (!userId) throw new Error('Necesitas una sesion activa para subir archivos.');

  const config = UPLOAD_CONFIG[kind];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: config.allowsEditing,
    quality: 0.7,
    base64: true,
  });

  const asset = result.assets?.[0];
  if (result.canceled || !asset?.base64) return null;

  const extension = getFileExtension(asset.fileName, asset.uri, asset.mimeType);
  const path = `${userId}/${kind}-${Date.now()}.${extension}`;
  const contentType = asset.mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`;
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(config.bucket)
    .upload(path, decode(asset.base64), { contentType, upsert: false });

  if (error) throw error;

  if (!config.isPublic) return path;

  const { data } = supabase.storage.from(config.bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function createSignedDocumentUrl(
  bucket: PrivateDocumentBucket,
  path: string,
  expiresInSeconds = 600,
): Promise<string> {
  const privatePath = normalizePrivateDocumentPath(bucket, path);
  if (!privatePath || /^https?:\/\//i.test(privatePath)) {
    throw new Error('El documento debe volver a cargarse en el almacenamiento privado.');
  }

  const { data, error } = await getSupabase().storage
    .from(bucket)
    .createSignedUrl(privatePath, expiresInSeconds);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error('No se pudo generar el acceso temporal al documento.');
  return data.signedUrl;
}

function normalizePrivateDocumentPath(bucket: PrivateDocumentBucket, value: string): string {
  const trimmed = value.trim().replace(/^\/+/, '');
  return trimmed.startsWith(`${bucket}/`) ? trimmed.slice(bucket.length + 1) : trimmed;
}

function getFileExtension(
  fileName?: string | null,
  uri?: string,
  mimeType?: string | null,
): string {
  const fromName = (fileName || uri || '').split('?')[0].split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;
  const fromMime = mimeType?.split('/').pop()?.toLowerCase();
  return fromMime === 'jpeg' ? 'jpg' : fromMime || 'jpg';
}
