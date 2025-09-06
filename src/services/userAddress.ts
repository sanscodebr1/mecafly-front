import { supabase } from '../lib/supabaseClient';

export type UserAddress = {
  id?: number;
  user_id?: string;
  created_at?: string;
  zipcode?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export type CreateAddressData = {
  zipcode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
};

// Função para buscar todos os endereços do usuário
export async function getUserAddresses(): Promise<UserAddress[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return [];
    }

    const { data, error } = await supabase
      .from('user_address')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar endereços:', error);
      return [];
    }

    return data as UserAddress[];
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    return [];
  }
}

// Função para criar um novo endereço
export async function createUserAddress(addressData: CreateAddressData): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    const { error } = await supabase
      .from('user_address')
      .insert([{
        user_id: user.id,
        zipcode: addressData.zipcode,
        address: addressData.address,
        number: addressData.number,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state
      }]);

    if (error) {
      console.error('Erro ao criar endereço:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    return false;
  }
}

// Função para atualizar um endereço existente
export async function updateUserAddress(
  addressId: number, 
  addressData: Partial<CreateAddressData>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    const { error } = await supabase
      .from('user_address')
      .update(addressData)
      .eq('id', addressId)
      .eq('user_id', user.id); // Garantir que só pode editar próprios endereços

    if (error) {
      console.error('Erro ao atualizar endereço:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return false;
  }
}

// Função para deletar um endereço
export async function deleteUserAddress(addressId: number): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    const { error } = await supabase
      .from('user_address')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id); // Garantir que só pode deletar próprios endereços

    if (error) {
      console.error('Erro ao deletar endereço:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    return false;
  }
}

// Função para buscar um endereço específico
export async function getUserAddressById(addressId: number): Promise<UserAddress | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return null;
    }

    const { data, error } = await supabase
      .from('user_address')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar endereço:', error);
      return null;
    }

    return data as UserAddress;
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    return null;
  }
}