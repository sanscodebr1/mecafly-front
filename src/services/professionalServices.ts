import { supabase } from '../lib/supabaseClient';

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

export type ProfessionalAttribute = {
  attribute_id: number;
  key: string;
  value_type: 'string' | 'number' | 'boolean';
  value: string;
};

export type Professional = {
  professional_id: number;
  created_at: string;
  updated_at: string;
  name: string;
  user_picture: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  user_id: string;
  user_type: string;
  description: string | null;
  legal_representative: string | null;
  company_type: string | null;
  attributes: ProfessionalAttribute[];
};

// Função para buscar todos os profissionais usando a view
export async function getAllProfessionals(): Promise<Professional[]> {
  try {
    const { data, error } = await supabase
      .from('vw_professionals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar profissionais:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    return [];
  }
}

// Função para buscar um profissional específico por ID
export async function getProfessionalById(professionalId: number): Promise<Professional | null> {
  try {
    const { data, error } = await supabase
      .from('vw_professionals')
      .select('*')
      .eq('professional_id', professionalId)
      .single();

    if (error) {
      console.error('Erro ao buscar profissional:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar profissional:', error);
    return null;
  }
}

// Função para buscar profissionais com filtros
export async function searchProfessionals(searchTerm?: string): Promise<Professional[]> {
  try {
    let query = supabase
      .from('vw_professionals')
      .select('*');

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar profissionais:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    return [];
  }
}

// Função para buscar valor específico de um atributo
export function getAttributeValue(professional: Professional, attributeKey: string): string | null {
  const attribute = professional.attributes.find(attr => attr.key === attributeKey);
  return attribute?.value || null;
}

// Função para buscar atributos de serviço profissional
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

// Função para buscar valores de atributos de um usuário
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

// Função para salvar ou atualizar valores de atributos de serviço
export async function upsertUserServiceAttributeValues(
  userProfileId: number, 
  attributeValues: Array<{ attribute_id: number; value: string }>
) {
  try {
    // Primeiro, buscar valores existentes
    const existingValues = await getUserServiceAttributeValues(userProfileId);
    
    for (const attrValue of attributeValues) {
      const existing = existingValues.find(v => v.attribute_id === attrValue.attribute_id);
      
      if (existing) {
        // Atualizar valor existente
        const { error } = await supabase
          .from('user_service_attribute_values')
          .update({ value: attrValue.value })
          .eq('id', existing.id);
        
        if (error) {
          console.error('Erro ao atualizar valor de atributo:', error);
        }
      } else {
        // Inserir novo valor
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