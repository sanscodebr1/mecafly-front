import { supabase } from '../lib/supabaseClient';
import * as FileSystem from 'expo-file-system';

/**
 * Detecta o tipo MIME baseado na URI do arquivo
 */
function detectMimeType(uri: string): string {
  const lowerUri = uri.toLowerCase();
  
  // Vídeos
  if (lowerUri.endsWith('.mp4')) return 'video/mp4';
  if (lowerUri.endsWith('.mov')) return 'video/quicktime';
  if (lowerUri.endsWith('.avi')) return 'video/x-msvideo';
  if (lowerUri.endsWith('.webm')) return 'video/webm';
  
  // Imagens
  if (lowerUri.endsWith('.png')) return 'image/png';
  if (lowerUri.endsWith('.jpg') || lowerUri.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerUri.endsWith('.gif')) return 'image/gif';
  if (lowerUri.endsWith('.webp')) return 'image/webp';
  
  // Padrão para imagem (mantém compatibilidade)
  return 'image/jpeg';
}

/**
 * Extrai a extensão correta baseada no MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  
  return mimeToExt[mimeType] || 'jpg';
}

/**
 * Faz upload de um arquivo local (React Native/Expo) para o Supabase Storage.
 * @param uri caminho local do arquivo (file://...)
 * @param bucket nome do bucket no Supabase
 * @param pathPrefix prefixo opcional (ex: 'contracts/')
 * @param contentType tipo MIME (opcional, será auto-detectado se não fornecido)
 */
export async function uploadFileToSupabase(
  uri: string,
  bucket: string,
  pathPrefix = '',
  contentType?: string
): Promise<string | null> {
  try {
    // Auto-detecta o tipo MIME se não foi fornecido
    const finalContentType = contentType || detectMimeType(uri);
    
    // Extrai a extensão correta baseada no MIME type
    const fileExtension = getExtensionFromMimeType(finalContentType);
    
    // Cria nome único com a extensão correta
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

    // Upload usando Uint8Array com o contentType correto
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, uint8Array, {
        contentType: finalContentType,
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