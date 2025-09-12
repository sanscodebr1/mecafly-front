import { supabase } from '../lib/supabaseClient';

// Enums
export type PaymentGatewayType = 'pagarme';
export type AccountGatewayStatus = 'pending' | 'approved' | 'refused';

// Tipos para dados do Pagarme
export type PhoneNumber = {
  ddd: string;
  number: string;
};

export type BankAccount = {
  bank_code: string;
  agencia: string;
  conta: string;
  conta_dv: string;
  type: 'conta_corrente' | 'conta_poupanca';
  document_type: 'cpf' | 'cnpj';
  document_number: string;
  legal_name: string;
};

export type RegisterInformation = {
  email: string;
  document: string;
  type: 'individual' | 'corporation';
  phone_numbers: PhoneNumber[];
  company_name?: string;
  trading_name?: string;
  annual_revenue?: number;
  name: string;
  mother_name: string;
  birthdate: string; // YYYY-MM-DD
  monthly_income: number;
  professional_occupation: string;
  default_bank_account: BankAccount;
};

// Tabela payment_gateway
export type PaymentGateway = {
  id: number;
  created_at: string;
  name: string;
  type: PaymentGatewayType;
  is_active: boolean;
  config: Record<string, any>; // Configurações específicas do gateway
};

// Tabela account_gateway
export type AccountGateway = {
  id: number;
  created_at: string;
  updated_at: string;
  external_id: string; // ID do recebedor na Pagarme
  payment_gateway: PaymentGatewayType;
  status: AccountGatewayStatus;
  store_profile_id?: number;
  professional_profile_id?: number;
  user_id: string; // Para facilitar consultas
  affiliation_url?: string; // URL para prova de vida
  last_webhook_at?: string;
};

// Tabela account_gateway_data
export type AccountGatewayData = {
  id: number;
  created_at: string;
  updated_at: string;
  external_id: string;
  payment_gateway: PaymentGatewayType;
  account_gateway_id: number;
  register_information: RegisterInformation;
  raw_response?: Record<string, any>; // Resposta completa da API
};

// Tipos para requisições
export type CreateAccountGatewayData = {
  payment_gateway: PaymentGatewayType;
  store_profile_id?: number;
  professional_profile_id?: number;
  register_information: RegisterInformation;
};

export type UpdateAccountGatewayStatusData = {
  status: AccountGatewayStatus;
  external_id?: string;
  affiliation_url?: string;
};

// Serviços
export class PaymentGatewayService {
  // Buscar gateway de pagamento ativo
  static async getActiveGateway(): Promise<PaymentGateway | null> {
    try {
      const { data, error } = await supabase
        .from('payment_gateway')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Erro ao buscar gateway ativo:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar gateway ativo:', error);
      return null;
    }
  }

  // Buscar conta gateway do usuário
  static async getUserAccountGateway(userId: string): Promise<AccountGateway | null> {
    try {
      const { data, error } = await supabase
        .from('account_gateway')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar conta gateway:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar conta gateway:', error);
      return null;
    }
  }

  // Criar conta gateway
  static async createAccountGateway(data: CreateAccountGatewayData): Promise<AccountGateway | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Primeiro, criar o recipient na Pagarme
      const recipientData = await this.createPagarmeRecipient(data.register_information);
      
      if (!recipientData) {
        throw new Error('Erro ao criar recipient na Pagarme');
      }

      // Criar registro na tabela account_gateway
      const { data: accountData, error: accountError } = await supabase
        .from('account_gateway')
        .insert({
          external_id: recipientData.id,
          payment_gateway: data.payment_gateway,
          status: 'pending',
          store_profile_id: data.store_profile_id,
          professional_profile_id: data.professional_profile_id,
          user_id: user.id,
        })
        .select()
        .single();

      if (accountError) {
        console.error('Erro ao criar account_gateway:', accountError);
        return null;
      }

      // Salvar dados enviados na tabela account_gateway_data
      const { error: dataError } = await supabase
        .from('account_gateway_data')
        .insert({
          external_id: recipientData.id,
          payment_gateway: data.payment_gateway,
          account_gateway_id: accountData.id,
          register_information: data.register_information,
          raw_response: recipientData,
        });

      if (dataError) {
        console.error('Erro ao salvar dados do gateway:', dataError);
      }

      return accountData;
    } catch (error) {
      console.error('Erro ao criar conta gateway:', error);
      return null;
    }
  }

  // Atualizar status da conta gateway
  static async updateAccountGatewayStatus(
    externalId: string, 
    status: AccountGatewayStatus,
    affiliationUrl?: string
  ): Promise<boolean> {
    try {
      const updateData: UpdateAccountGatewayStatusData = {
        status,
        external_id: externalId,
        affiliation_url: affiliationUrl,
      };

      const { error } = await supabase
        .from('account_gateway')
        .update({
          ...updateData,
          last_webhook_at: new Date().toISOString(),
        })
        .eq('external_id', externalId);

      if (error) {
        console.error('Erro ao atualizar status da conta gateway:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status da conta gateway:', error);
      return false;
    }
  }

  // Criar recipient via Edge Function (não expor chave no app)
  private static async createPagarmeRecipient(registerInfo: RegisterInformation): Promise<any> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData.session?.access_token;
      if (!jwt) throw new Error('Sem sessão');

      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-recipient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
          'apikey': `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ register_information: registerInfo }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Erro na Edge Function create-recipient:', err);
        return null;
      }

      return await res.json();
    } catch (error) {
      console.error('Erro ao chamar create-recipient:', error);
      return null;
    }
  }

  // Buscar dados da conta gateway
  static async getAccountGatewayData(accountGatewayId: number): Promise<AccountGatewayData | null> {
    try {
      const { data, error } = await supabase
        .from('account_gateway_data')
        .select('*')
        .eq('account_gateway_id', accountGatewayId)
        .single();

      if (error) {
        console.error('Erro ao buscar dados da conta gateway:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar dados da conta gateway:', error);
      return null;
    }
  }

  // Verificar se usuário pode vender (tem conta aprovada)
  static async canUserSell(userId: string): Promise<boolean> {
    try {
      const accountGateway = await this.getUserAccountGateway(userId);
      return accountGateway?.status === 'approved';
    } catch (error) {
      console.error('Erro ao verificar se usuário pode vender:', error);
      return false;
    }
  }
}

// Função utilitária para formatar dados do perfil para Pagarme
export function formatProfileDataForPagarme(
  customerProfile: any,
  storeProfile?: any,
  professionalProfile?: any
): Partial<RegisterInformation> {
  const baseData = {
    email: customerProfile.email,
    document: customerProfile.document,
    name: customerProfile.name,
    phone_numbers: [{
      ddd: customerProfile.phone_number?.substring(0, 2) || '11',
      number: customerProfile.phone_number?.substring(2) || '999999999',
    }],
  };

  // Se for loja, usar dados da store_profile
  if (storeProfile) {
    return {
      ...baseData,
      type: 'corporation',
      company_name: storeProfile.company_name,
      trading_name: storeProfile.name,
    };
  }

  // Se for profissional, usar dados do professional_profile
  if (professionalProfile) {
    return {
      ...baseData,
      type: 'individual',
      mother_name: '', // Precisa ser preenchido pelo usuário
      birthdate: professionalProfile.date_of_birth || '',
      monthly_income: 0, // Precisa ser preenchido pelo usuário
      professional_occupation: '', // Precisa ser preenchido pelo usuário
    };
  }

  // Se for apenas cliente, usar dados básicos
  return {
    ...baseData,
    type: 'individual',
    mother_name: '', // Precisa ser preenchido pelo usuário
    birthdate: customerProfile.dateOfBirth || '',
    monthly_income: 0, // Precisa ser preenchido pelo usuário
    professional_occupation: '', // Precisa ser preenchido pelo usuário
  };
}
