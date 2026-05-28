import * as ImagePicker from 'expo-image-picker';
import { getSupabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';

export const pickAndUploadImage = async (pathPrefix: string): Promise<string | null> => {
  try {
    // 1. Abrir la galería
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permite recortar la foto
      quality: 0.7, // Comprimir ligeramente
      base64: true, // Importante para enviar a Supabase
    });

    if (result.canceled || !result.assets[0].base64) {
      return null;
    }

    const base64 = result.assets[0].base64;
    const uri = result.assets[0].uri;
    const ext = uri.split('.').pop() || 'jpeg'; // Obtener extensión
    const fileName = `${pathPrefix}_${Date.now()}.${ext}`; // Nombre único

    const supabase = getSupabase();

    // 2. Subir al bucket 'img'
    const { error } = await supabase.storage
      .from('img')
      .upload(fileName, decode(base64), {
        contentType: `image/${ext}`,
      });

    if (error) throw error;

    // 3. Obtener la URL pública para guardarla en la base de datos
    const { data: publicData } = supabase.storage
      .from('img')
      .getPublicUrl(fileName);

    return publicData.publicUrl;
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    throw error;
  }
};