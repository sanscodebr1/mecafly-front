import { supabase } from '../lib/supabaseClient';

// Enums
export type PaymentGatewayType = 'pagarme';
export type AccountGatewayStatus = 'pending' | 'approved' | 'refused';

// Tipos para dados do Pagarme
export type PhoneNumber = {
  ddd: string;
  number: string;
  type: 'mobile' | 'landline';
};

export type BankAccount = {
  holder_name: string;
  holder_type: 'individual' | 'company';
  holder_document: string;
  bank: string;
  branch_number: string;
  branch_check_digit: string;
  account_number: string;
  account_check_digit: string;
  type: 'checking' | 'savings';
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
  // Campos adicionais obrigatórios para PagarMe v5
  address: {
    street: string;
    street_number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    complementary?: string;
    reference_point?: string;
  };
  site_url?: string;
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

  // Validar dados obrigatórios para PagarMe
  private static validateRegisterInformation(data: RegisterInformation): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validação de email
    if (!data.email) {
      errors.push('Email é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email deve ter formato válido');
    }

    // Validação de documento
    if (!data.document) {
      errors.push('Documento (CPF/CNPJ) é obrigatório');
    } else {
      const doc = data.document.replace(/\D/g, '');
      if (data.type === 'individual' && doc.length !== 11) {
        errors.push('CPF deve ter 11 dígitos');
      } else if (data.type === 'corporation' && doc.length !== 14) {
        errors.push('CNPJ deve ter 14 dígitos');
      }
    }

    // Validação de nome
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    // Validação de nome da mãe
    if (!data.mother_name || data.mother_name.trim().length < 2) {
      errors.push('Nome da mãe deve ter pelo menos 2 caracteres');
    }

    // Validação de data de nascimento
    if (!data.birthdate) {
      errors.push('Data de nascimento é obrigatória');
    } else {
      const birthDate = new Date(data.birthdate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        errors.push('Idade mínima é 18 anos');
      } else if (age > 100) {
        errors.push('Data de nascimento inválida');
      }
    }

    // Validação de renda mensal
    if (!data.monthly_income || data.monthly_income <= 0) {
      errors.push('Renda mensal deve ser maior que zero');
    }

    // Validação de ocupação
    if (!data.professional_occupation || data.professional_occupation.trim().length < 2) {
      errors.push('Ocupação profissional deve ter pelo menos 2 caracteres');
    }

    // Validação de telefone
    if (!data.phone_numbers || data.phone_numbers.length === 0) {
      errors.push('Pelo menos um telefone é obrigatório');
    } else {
      const phone = data.phone_numbers[0];
      if (!phone.ddd || phone.ddd.length !== 2) {
        errors.push('DDD deve ter 2 dígitos');
      }
      if (!phone.number || phone.number.length < 8 || phone.number.length > 9) {
        errors.push('Número de telefone deve ter 8 ou 9 dígitos');
      }
    }

    // Validação de endereço
    if (!data.address) {
      errors.push('Endereço é obrigatório');
    } else {
      if (!data.address.street || data.address.street.trim().length < 2) {
        errors.push('Rua deve ter pelo menos 2 caracteres');
      }
      if (!data.address.street_number || data.address.street_number.trim().length === 0) {
        errors.push('Número do endereço é obrigatório');
      }
      if (!data.address.neighborhood || data.address.neighborhood.trim().length < 2) {
        errors.push('Bairro deve ter pelo menos 2 caracteres');
      }
      if (!data.address.city || data.address.city.trim().length < 2) {
        errors.push('Cidade deve ter pelo menos 2 caracteres');
      }
      if (!data.address.state || data.address.state.length !== 2) {
        errors.push('Estado deve ter 2 caracteres (ex: SP)');
      }
      if (!data.address.zip_code) {
        errors.push('CEP é obrigatório');
      } else {
        const zipcode = data.address.zip_code.replace(/\D/g, '');
        if (zipcode.length !== 8) {
          errors.push('CEP deve ter 8 dígitos');
        }
      }
    }

    // Validação de conta bancária
    if (!data.default_bank_account) {
      errors.push('Conta bancária é obrigatória');
    } else {
      if (!data.default_bank_account.bank || data.default_bank_account.bank.length < 3) {
        errors.push('Código do banco é obrigatório');
      }
      if (!data.default_bank_account.branch_number || data.default_bank_account.branch_number.length < 3) {
        errors.push('Número da agência deve ter pelo menos 3 dígitos');
      }
      if (!data.default_bank_account.account_number || data.default_bank_account.account_number.length < 3) {
        errors.push('Número da conta deve ter pelo menos 3 dígitos');
      }
      if (!data.default_bank_account.account_check_digit) {
        errors.push('Dígito verificador da conta é obrigatório');
      }
      if (!data.default_bank_account.holder_name || data.default_bank_account.holder_name.trim().length < 2) {
        errors.push('Nome do titular da conta deve ter pelo menos 2 caracteres');
      }
      if (!data.default_bank_account.holder_document) {
        errors.push('Documento do titular da conta é obrigatório');
      }
    }

    // Validações específicas por tipo
    if (data.type === 'corporation') {
      if (!data.company_name || data.company_name.trim().length < 2) {
        errors.push('Razão social deve ter pelo menos 2 caracteres');
      }
      if (!data.trading_name || data.trading_name.trim().length < 2) {
        errors.push('Nome fantasia deve ter pelo menos 2 caracteres');
      }
      if (!data.annual_revenue || data.annual_revenue <= 0) {
        errors.push('Faturamento anual deve ser maior que zero');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Criar conta gateway
  static async createAccountGateway(data: CreateAccountGatewayData): Promise<AccountGateway | null> {
    try {
      console.log('Iniciando criacao de conta gateway');

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        console.log('Erro: Usuario nao autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log('Usuario autenticado:', user.id);

      // Validar dados obrigatórios
      const validation = this.validateRegisterInformation(data.register_information);
      if (!validation.isValid) {
        console.log('Erro de validacao:', validation.errors);
        throw new Error(`Dados obrigatórios faltando: ${validation.errors.join(', ')}`);
      }

      console.log('Dados validados com sucesso');

      // Primeiro, criar o recipient na Pagarme
      console.log('Criando recipient na PagarMe...');
      const recipientData = await this.createPagarmeRecipient(data.register_information);

      if (!recipientData) {
        console.log('Erro: Falha ao criar recipient na PagarMe');
        throw new Error('Erro ao criar recipient na Pagarme. Tente novamente em alguns minutos.');
      }

      console.log('Recipient criado com sucesso, ID:', recipientData.id);

      // Criar registro na tabela account_gateway
      console.log('Salvando conta gateway no banco de dados...');
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
        console.log('Erro ao salvar conta gateway:', accountError);
        return null;
      }

      console.log('Conta gateway salva com sucesso, ID:', accountData.id);

      // Salvar dados enviados na tabela account_gateway_data
      console.log('Salvando dados da conta gateway...');
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
        console.log('Erro ao salvar dados da conta gateway:', dataError);
      } else {
        console.log('Dados da conta gateway salvos com sucesso');
      }

      console.log('Conta gateway criada com sucesso');
      return accountData;
    } catch (error) {
      console.log('Erro ao criar conta gateway:', error);
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

        return false;
      }

      return true;
    } catch (error) {

      return false;
    }
  }

  // Criar recipient na PagarMe
  private static async createPagarmeRecipient(registerInfo: RegisterInformation): Promise<any> {
    console.log('Criando recipient na PagarMe');
    console.log('Dados recebidos:', JSON.stringify(registerInfo, null, 2));

    const apiKey = process.env.EXPO_PUBLIC_PAGARME_API_KEY;
    console.log('API Key disponivel:', apiKey ? 'Sim' : 'Nao');
    console.log('API Key (primeiros 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');

    if (!apiKey) {
      console.log('Erro: PAGARME_API_KEY nao configurada');
      return null;
    }

    // Usar btoa se disponível (web), senão usar Buffer (Node.js/React Native)
    const basic = typeof btoa !== 'undefined'
      ? btoa(`${apiKey}:`)
      : Buffer.from(`${apiKey}:`).toString('base64');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Timeout de 60s atingido na requisicao direta');
      controller.abort();
    }, 60000);

    try {
      console.log('Fazendo requisicao para PagarMe API');
      const response = await fetch('https://api.pagar.me/core/v5/recipients', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basic}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          register_information: registerInfo,
          default_bank_account: registerInfo.default_bank_account,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Resposta da PagarMe API:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Erro PagarMe:', response.status, errorText);
        return null;
      }

      const recipientData = await response.json();
      console.log('Recipient criado com sucesso:', recipientData);
      return recipientData;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Timeout na requisicao para PagarMe');
        return null;
      }

      console.log('Erro na requisicao:', error);
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

        return null;
      }

      return data;
    } catch (error) {

      return null;
    }
  }

  // Verificar se usuário pode vender (tem conta aprovada)
  static async canUserSell(userId: string): Promise<boolean> {
    try {
      const accountGateway = await this.getUserAccountGateway(userId);
      return accountGateway?.status === 'approved';
    } catch (error) {

      return false;
    }
  }
}

// Função de exemplo para criar dados completos para PagarMe
export function createCompleteRegisterInformation(
  customerProfile: any,
  storeProfile?: any,
  professionalProfile?: any,
  address?: any,
  bankAccount?: any
): RegisterInformation {
  return {
    email: customerProfile.email || '',
    document: customerProfile.document || '',
    type: storeProfile ? 'corporation' : 'individual',
    phone_numbers: [{
      ddd: customerProfile.phone_number?.substring(0, 2) || '11',
      number: customerProfile.phone_number?.substring(2) || '999999999',
    }],
    name: customerProfile.name || '',
    mother_name: professionalProfile?.mother_name || '',
    birthdate: professionalProfile?.date_of_birth || customerProfile.dateOfBirth || '',
    monthly_income: professionalProfile?.monthly_income || 0,
    professional_occupation: professionalProfile?.professional_occupation || '',
    // Endereço obrigatório
    address: {
      street: address?.street || address?.address || '',
      street_number: address?.number || address?.street_number || '0',
      neighborhood: address?.neighborhood || address?.district || '',
      city: address?.city || '',
      state: address?.state || '',
      zip_code: address?.zipcode || address?.zip_code || address?.postal_code || '',
      complementary: address?.complement || address?.complementary || '',
      reference_point: address?.reference || address?.reference_point || 'N/A',
    },
    site_url: storeProfile?.website || '',
    // Conta bancária obrigatória
    default_bank_account: {
      bank_code: bankAccount?.bank_code || '',
      agencia: bankAccount?.agencia || '',
      conta: bankAccount?.conta || '',
      conta_dv: bankAccount?.conta_dv || '',
      type: bankAccount?.type || 'conta_corrente',
      document_type: storeProfile ? 'cnpj' : 'cpf',
      document_number: storeProfile?.document || customerProfile.document || '',
      legal_name: storeProfile?.company_name || storeProfile?.name || customerProfile.name || '',
    },
    // Campos específicos para pessoa jurídica
    ...(storeProfile && {
      company_name: storeProfile.company_name || storeProfile.name || '',
      trading_name: storeProfile.trading_name || storeProfile.name || '',
      annual_revenue: storeProfile.annual_revenue || 0,
    }),
  };
}

// Função utilitária para formatar dados do perfil para Pagarme
// Função auxiliar para formatar birthdate para DD/MM/YYYY
function formatBirthdate(dateStr: string): string {
  if (!dateStr) return '';

  // Se já está no formato DD/MM/YYYY, retorna como está
  if (dateStr.includes('/')) return dateStr;

  // Se está no formato DDMMYYYY, converte para DD/MM/YYYY
  const numbers = dateStr.replace(/\D/g, '');
  if (numbers.length === 8) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }

  return dateStr;
}

export function formatProfileDataForPagarme(
  customerProfile: any,
  storeProfile?: any,
  professionalProfile?: any,
  address?: any
): RegisterInformation {
  const baseData = {
    email: customerProfile.email || '',
    document: customerProfile.document || '',
    name: customerProfile.name || '',
    phone_numbers: [{
      ddd: customerProfile.phone_number?.substring(0, 2) || '11',
      number: customerProfile.phone_number?.substring(2) || '999999999',
      type: 'mobile' as const,
    }],
    // Campos obrigatórios que precisam ser preenchidos
    mother_name: professionalProfile?.mother_name || '',
    birthdate: formatBirthdate(professionalProfile?.date_of_birth || customerProfile.dateOfBirth || ''),
    monthly_income: professionalProfile?.monthly_income || 0,
    professional_occupation: professionalProfile?.professional_occupation || '',
    // Endereço obrigatório
    address: {
      street: address?.street || address?.address || '',
      street_number: address?.number || address?.street_number || '0',
      neighborhood: address?.neighborhood || address?.district || '',
      city: address?.city || '',
      state: address?.state || '',
      zip_code: address?.zipcode || address?.zip_code || address?.postal_code || '',
      complementary: address?.complement || address?.complementary || '',
      reference_point: address?.reference || address?.reference_point || 'N/A',
    },
    site_url: storeProfile?.website || '',
    // Conta bancária obrigatória (precisa ser fornecida pelo usuário)
    default_bank_account: {
      holder_name: customerProfile.name || '',
      holder_type: 'individual' as const,
      holder_document: customerProfile.document || '',
      bank: '',
      branch_number: '',
      branch_check_digit: '',
      account_number: '',
      account_check_digit: '',
      type: 'checking' as const,
    },
  };

  // Se for loja, usar dados da store_profile
  if (storeProfile) {
    return {
      ...baseData,
      type: 'corporation',
      company_name: storeProfile.company_name || storeProfile.name || '',
      trading_name: storeProfile.trading_name || storeProfile.name || '',
      annual_revenue: storeProfile.annual_revenue || 0,
      default_bank_account: {
        ...baseData.default_bank_account,
        holder_document: storeProfile.document || customerProfile.document || '',
        holder_name: storeProfile.company_name || storeProfile.name || '',
        holder_type: 'company' as const,
      },
    };
  }

  // Se for profissional, usar dados do professional_profile
  if (professionalProfile) {
    return {
      ...baseData,
      type: 'individual',
      mother_name: professionalProfile.mother_name || '',
      birthdate: professionalProfile.date_of_birth || '',
      monthly_income: professionalProfile.monthly_income || 0,
      professional_occupation: professionalProfile.professional_occupation || '',
    };
  }

  // Se for apenas cliente, usar dados básicos
  return {
    ...baseData,
    type: 'individual',
    mother_name: '',
    birthdate: customerProfile.dateOfBirth || '',
    monthly_income: 0,
    professional_occupation: '',
  };
}
