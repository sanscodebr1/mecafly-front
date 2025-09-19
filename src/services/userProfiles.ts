import { supabase } from '../lib/supabaseClient';

export type UserTypeEnum = 'customer' | 'seller' | 'professional';
export type CompanyTypeEnum = 'individual' | 'company';
export type UserStatusEnum = 'active' | 'pending' | 'inactive';

// Customer Profile - obrigatório para todos
export type CustomerProfile = {
  id?: number;
  created_at?: string;
  name?: string | null;
  email?: string | null;
  document?: string | null; // CPF
  image_profile?: string | null;
  dateOfBirth?: string | null; // ISO date string yyyy-mm-dd
  user_id: string; // auth.users.id
  phone_number: string;
};

export type ProfessionalProfile = {
  id?: number;
  created_at?: string;
  updated_at?: string;
  name?: string | null;
  email?: string | null;
  document?: string | null; 
  date_of_birth?: string | null; 
  phone_number?: string | null;
  user_picture?: string | null;
  document_picture?: string | null;
  user_id: string; // auth.users.id
  user_type: UserTypeEnum;
  description?: string | null;
  legal_representative?: string | null;
  company_type?: CompanyTypeEnum | null;
  has_equipment?: boolean | null;
};

export type StoreProfile = {
  id?: number;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  status?: UserStatusEnum | null;
  company_type?: CompanyTypeEnum | null;
  picture?: string | null;
  name?: string | null;
  document?: string | null;
  phone?: string | null;
  contrato_social?: string | null;
  legal_representative?: string | null;
  cpf_legal_representative?: string | null;
  rg_legal_representative?: string | null;
  company_name?: string | null;
  description?: string | null;
};

export type UserProfiles = {
  id: string;
  email: string | null;
  customer_profile: CustomerProfile;
  professional_profile?: ProfessionalProfile | null;
  store_profile?: StoreProfile | null;
};

export type ServiceAttribute = {
  id: number;
  service_id: number;
  key: string;
  value_type: 'string' | 'number' | 'boolean';
};

export type UserServiceAttributeValue = {
  id?: number;
  user_profile_id: number;
  attribute_id: number;
  value: string;
};

// Função principal para buscar todos os perfis do usuário
export async function getCurrentUserProfiles(): Promise<UserProfiles | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  try {
    // Buscar customer profile (obrigatório)
    const { data: customerData, error: customerError } = await supabase
      .from('customer_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerError) {
      console.error('Erro ao buscar customer profile:', customerError);
    }

    // Buscar professional profile (opcional)
    const { data: professionalData, error: professionalError } = await supabase
      .from('professional_profile')
      .select('*')
      .eq('user_id', user.id)
      .eq('user_type', 'professional')
      .maybeSingle();

    if (professionalError) {
      console.error('Erro ao buscar professional profile:', professionalError);
    }

    // Buscar store profile (opcional)
    const { data: storeData, error: storeError } = await supabase
      .from('store_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (storeError) {
      console.error('Erro ao buscar store profile:', storeError);
    }

    // Se não existe customer profile, criar um
    let customerProfile = customerData;
    if (!customerProfile) {
      customerProfile = await createDefaultCustomerProfile(user.id, user.email || null);
    }

    const result: UserProfiles = {
      id: user.id,
      email: user.email || null,
      customer_profile: customerProfile as CustomerProfile,
      professional_profile: professionalData as ProfessionalProfile | null,
      store_profile: storeData as StoreProfile | null,
    };

    console.log('Perfis do usuário:', result);
    return result;

  } catch (error) {
    console.error('Erro ao buscar perfis do usuário:', error);
    return null;
  }
}

// Criar customer profile padrão (obrigatório)
async function createDefaultCustomerProfile(userId: string, email: string | null): Promise<CustomerProfile> {
  const { data, error } = await supabase
    .from('customer_profile')
    .insert({
      user_id: userId,
      email: email,
      name: null,
      document: null,
      image_profile: null,
      dateOfBirth: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar customer profile padrão:', error);
    throw error;
  }

  return data as CustomerProfile;
}

// Função para criar/atualizar customer profile
export async function upsertCustomerProfile(profile: Partial<CustomerProfile> & { user_id: string }) {
  const existing = await supabase
    .from('customer_profile')
    .select('*')
    .eq('user_id', profile.user_id)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    // Atualizar perfil existente
    const { data, error } = await supabase
      .from('customer_profile')
      .update({
        name: profile.name ?? existing.data.name,
        email: profile.email ?? existing.data.email,
        document: profile.document ?? existing.data.document,
        dateOfBirth: profile.dateOfBirth ?? existing.data.dateOfBirth,
        image_profile: profile.image_profile ?? existing.data.image_profile,
        phone_number: profile.phone_number ?? existing.data.phone_number
      })
      .eq('user_id', profile.user_id)
      .select()
      .single();

    if (error) throw error;
    return data as CustomerProfile;
  }

  // Criar novo perfil
  const { data, error } = await supabase
    .from('customer_profile')
    .insert(profile)
    .select()
    .single();

  if (error) throw error;
  return data as CustomerProfile;
}

// Função para criar/atualizar professional profile
export async function upsertProfessionalProfile(profile: Partial<ProfessionalProfile> & { user_id: string }) {
  const existing = await supabase
    .from('professional_profile')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('user_type', 'professional')
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    // Atualizar perfil existente
    const { data, error } = await supabase
      .from('professional_profile')
      .update({
        name: profile.name ?? existing.data.name,
        email: profile.email ?? existing.data.email,
        document: profile.document ?? existing.data.document,
        date_of_birth: profile.date_of_birth ?? existing.data.date_of_birth,
        phone_number: profile.phone_number ?? existing.data.phone_number,
        user_picture: profile.user_picture ?? existing.data.user_picture,
        document_picture: profile.document_picture ?? existing.data.document_picture,
        description: profile.description ?? existing.data.description,
        legal_representative: profile.legal_representative ?? existing.data.legal_representative,
        company_type: profile.company_type ?? existing.data.company_type,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.user_id)
      .eq('user_type', 'professional')
      .select()
      .single();

    if (error) throw error;
    return data as ProfessionalProfile;
  }

  // Criar novo perfil profissional
  const { data, error } = await supabase
    .from('professional_profile')
    .insert({
      ...profile,
      user_type: 'professional',
    })
    .select()
    .single();

  if (error) throw error;
  return data as ProfessionalProfile;
}

// Função para criar/atualizar store profile (mantém compatibilidade)
export async function upsertStoreProfile(profile: Partial<StoreProfile> & { user_id: string }) {
  const existing = await supabase
    .from('store_profile')
    .select('*')
    .eq('user_id', profile.user_id)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    // Atualizar perfil existente
    const { data, error } = await supabase
      .from('store_profile')
      .update({
        name: profile.name ?? existing.data.name,
        document: profile.document ?? existing.data.document,
        company_type: profile.company_type ?? existing.data.company_type,
        phone: profile.phone ?? existing.data.phone,
        legal_representative: profile.legal_representative ?? existing.data.legal_representative,
        cpf_legal_representative: profile.cpf_legal_representative ?? existing.data.cpf_legal_representative,
        company_name: profile.company_name ?? existing.data.company_name,
        rg_legal_representative: profile.rg_legal_representative ?? existing.data.rg_legal_representative,
        contrato_social: profile.contrato_social ?? existing.data.contrato_social,
        status: profile.status ?? existing.data.status,
        picture: profile.picture ?? existing.data.picture,
        description: profile.description ?? existing.data.description,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.user_id)
      .select()
      .single();

    if (error) throw error;
    return data as StoreProfile;
  }

  // Criar novo perfil de loja
  const { data, error } = await supabase
    .from('store_profile')
    .insert({
      user_id: profile.user_id,
      name: profile.name,
      document: profile.document,
      company_type: profile.company_type || 'MEI',
      phone: profile.phone,
      legal_representative: profile.legal_representative,
      cpf_legal_representative: profile.cpf_legal_representative,
      company_name: profile.company_name,
      rg_legal_representative: profile.rg_legal_representative,
      contrato_social: profile.contrato_social,
      status: profile.status || 'pending',
      picture: profile.picture,
      description: profile.description,
    })
    .select()
    .single();

  if (error) throw error;
  return data as StoreProfile;
}

// Funções de compatibilidade para manter o código atual funcionando
export async function getCurrentUserProfile() {
  const profiles = await getCurrentUserProfiles();
  if (!profiles) return null;

  // Retorna no formato antigo para compatibilidade
  return {
    id: profiles.id,
    email: profiles.email,
    name: profiles.customer_profile.name || null,
    user_type: profiles.professional_profile ? 'professional' : 'customer',
    user_profiles: profiles.professional_profile ? [profiles.professional_profile] : [],
    store_profiles: profiles.store_profile ? [profiles.store_profile] : [],
  };
}

export async function getCurrentStoreProfile() {
  const profiles = await getCurrentUserProfiles();
  return profiles?.store_profile || null;
}

export async function getUserProfileByType(userType: UserTypeEnum) {
  const profiles = await getCurrentUserProfiles();
  if (!profiles) return null;

  switch (userType) {
    case 'customer':
      return profiles.customer_profile;
    case 'professional':
      return profiles.professional_profile;
    case 'seller':
      return profiles.store_profile;
    default:
      return null;
  }
}

// Manter as funções de professional services para compatibilidade
export async function getProfessionalServiceAttributes() {
  const { data, error } = await supabase
    .from('service_attributes')
    .select('*')
    .eq('service_id', 1) // Sempre ID 1 para profissional
    .order('id');

  if (error) {
    console.error('Erro ao buscar atributos de serviço:', error);
    return [];
  }

  return data as ServiceAttribute[];
}

export async function getUserServiceAttributeValues(userProfileId: number) {
  const { data, error } = await supabase
    .from('user_service_attribute_values')
    .select('*')
    .eq('user_profile_id', userProfileId);

  if (error) {
    console.error('Erro ao buscar valores de atributos:', error);
    return [];
  }

  return data as UserServiceAttributeValue[];
}

export async function upsertUserServiceAttributeValues(
  userProfileId: number,
  attributeValues: Array<{ attribute_id: number; value: string }>
) {
  try {
    const existingValues = await getUserServiceAttributeValues(userProfileId);

    for (const attrValue of attributeValues) {
      const existing = existingValues.find(v => v.attribute_id === attrValue.attribute_id);

      if (existing) {
        const { error } = await supabase
          .from('user_service_attribute_values')
          .update({ value: attrValue.value })
          .eq('id', existing.id);

        if (error) {
          console.error('Erro ao atualizar valor de atributo:', error);
        }
      } else {
        const { error } = await supabase
          .from('user_service_attribute_values')
          .insert([{
            user_profile_id: userProfileId,
            attribute_id: attrValue.attribute_id,
            value: attrValue.value
          }]);

        if (error) {
          console.error('Erro ao inserir valor de atributo:', error);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar valores de atributos:', error);
    return false;
  }
}

// Função para manter compatibilidade com o código antigo
export async function upsertUserProfile(profile: any) {
  if (profile.user_type === 'professional') {
    return await upsertProfessionalProfile(profile);
  }
  return await upsertCustomerProfile(profile);
}