import { supabase } from '../lib/supabaseClient';
import * as FileSystem from 'expo-file-system';
import { decode as base64Decode } from 'base-64';

const BUCKET = 'user_profile';

export async function uploadUserProfileImage(userId: string, uri: string) {
  // Gera um caminho único por usuário
  const ext = uri.split('.').pop() || 'jpg';
  const path = `${userId}/profile.${ext}`;

  // Buscar binário da URI usando FileSystem para maior compatibilidade RN
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const binary = base64Decode(base64);
  const fileBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    fileBytes[i] = binary.charCodeAt(i);
  }

  // Tentar remover arquivo anterior para substituir
  await supabase.storage.from(BUCKET).remove([path]).catch(() => {});

  const { error } = await supabase.storage.from(BUCKET).upload(path, fileBytes as any, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'image/jpeg',
  });
  if (error) throw error;
  return getPublicUrl(path);
}

export function getPublicUrl(path: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}


