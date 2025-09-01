import { supabase } from '../lib/supabaseClient';

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
    // cria nome único
    const fileName = `${pathPrefix}${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.jpg`;

    // monta arquivo compatível com FormData
    const file = {
      uri,
      name: fileName,
      type: contentType,
    } as any;

    // usa FormData
    const formData = new FormData();
    formData.append('file', file);

    // faz upload usando o endpoint REST do Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Erro no upload:', error);
      return null;
    }

    // gera URL pública
    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return publicUrl.publicUrl;
  } catch (err) {
    console.error('Erro ao processar upload:', err);
    return null;
  }
}
