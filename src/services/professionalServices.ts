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
