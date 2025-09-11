import { supabase } from '../lib/supabaseClient';

export type StoreAddress = {
  id?: number;
  user_id?: string;
  created_at?: string;
  zipcode?: string | null;
  address?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

export type CreateStoreAddressData = {
  zipcode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
};

// Função para buscar o endereço da loja do usuário
export async function getStoreAddress(): Promise<StoreAddress | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return null;
    }

    const { data, error } = await supabase
      .from('store_address')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar endereço da loja:', error);
      return null;
    }

    return data as StoreAddress | null;
  } catch (error) {
    console.error('Erro ao buscar endereço da loja:', error);
    return null;
  }
}

// Função para criar ou atualizar o endereço da loja (upsert)
export async function upsertStoreAddress(addressData: CreateStoreAddressData): Promise<StoreAddress | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return null;
    }

    // Verificar se já existe um endereço para esta loja
    const existingAddress = await getStoreAddress();

    if (existingAddress) {
      // Atualizar endereço existente
      const { data, error } = await supabase
        .from('store_address')
        .update({
          zipcode: addressData.zipcode,
          address: addressData.address,
          number: addressData.number,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar endereço da loja:', error);
        return null;
      }

      return data as StoreAddress;
    } else {
      // Criar novo endereço
      const { data, error } = await supabase
        .from('store_address')
        .insert([{
          user_id: user.id,
          zipcode: addressData.zipcode,
          address: addressData.address,
          number: addressData.number,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar endereço da loja:', error);
        return null;
      }

      return data as StoreAddress;
    }
  } catch (error) {
    console.error('Erro ao salvar endereço da loja:', error);
    return null;
  }
}

// Função para deletar o endereço da loja
export async function deleteStoreAddress(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    const { error } = await supabase
      .from('store_address')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar endereço da loja:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar endereço da loja:', error);
    return false;
  }
}