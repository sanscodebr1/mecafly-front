import { supabase } from '../lib/supabaseClient';

export type UserTypeEnum = 'customer' | 'seller' | 'professional';

export type UserProfile = {
  id?: number;
  created_at?: string;
  updated_at?: string;
  name?: string | null;
  email?: string | null;
  document?: string | null; // CPF/CNPJ
  date_of_birth?: string | null; // ISO date string yyyy-mm-dd
  phone_number?: string | null;
  user_picture?: string | null;
  document_picture?: string | null;
  user_id: string; // auth.users.id
  user_type: UserTypeEnum;
};

export async function upsertUserProfile(profile: UserProfile) {
  // Primeiro, verificar se já existe perfil para este user_id
  const existing = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', profile.user_id)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    // Update por user_id
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        name: profile.name ?? existing.data.name,
        email: profile.email ?? existing.data.email,
        document: profile.document ?? existing.data.document,
        date_of_birth: profile.date_of_birth ?? existing.data.date_of_birth,
        phone_number: profile.phone_number ?? existing.data.phone_number,
        user_picture: profile.user_picture ?? existing.data.user_picture,
        document_picture: profile.document_picture ?? existing.data.document_picture,
        user_type: profile.user_type ?? existing.data.user_type,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.user_id)
      .select()
      .single();
    if (error) throw error;
    return data as UserProfile;
  }

  // Insert se não existe
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single();
  if (error) throw error;
  return data as UserProfile;
}



export async function getCurrentUserProfile() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  // buscar user_profiles
  const { data: profiles, error: errorProfiles } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id);

  if (errorProfiles) {
    console.error('Erro ao buscar user_profiles:', errorProfiles);
  }

  // buscar store_profiles
  const { data: stores, error: errorStores } = await supabase
    .from('store_profile')
    .select('*')
    .eq('user_id', user.id);

  if (errorStores) {
    console.error('Erro ao buscar store_profiles:', errorStores);
  }

  const result = {
    id: user.id,
    email: user.email,
    user_profiles: (profiles ?? []) as UserProfile[],
    store_profiles: (stores ?? []) as StoreProfile[], // novo
  };

  console.log('Dados do perfil:', result);
  return result;
}

