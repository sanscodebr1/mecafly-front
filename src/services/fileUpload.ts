import { supabase } from '../lib/supabaseClient';
import * as FileSystem from 'expo-file-system';

/**
 * Faz upload de um arquivo local (React Native/Expo) para o Supabase Storage.
 * @param uri caminho local do arquivo (file://...)
 * @param bucket nome do bucket no Supabase
 * @param pathPrefix prefixo opcional (ex: 'contracts/')
 * @param contentType tipo MIME (ex: 'image/jpeg')
 */
export async function uploadFileToSupabase(
  uri: string,
  bucket: string,
  pathPrefix = '',
  contentType = 'image/jpeg'
): Promise<string | null> {
  try {
    // Cria nome único
    const fileExtension = contentType === 'image/jpeg' ? 'jpg' : 
                         contentType === 'image/png' ? 'png' : 'jpg';
    const fileName = `${pathPrefix}${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${fileExtension}`;

    // Lê o arquivo como base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Converte base64 para Uint8Array
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const uint8Array = new Uint8Array(byteNumbers);

    // Upload usando Uint8Array
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, uint8Array, {
        contentType: contentType,
        upsert: true,
      });

    if (error) {
      console.error('Erro no upload:', error);
      return null;
    }

    // Gera URL pública
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  } catch (err) {
    console.error('Erro ao processar upload:', err);
    return null;
  }
}