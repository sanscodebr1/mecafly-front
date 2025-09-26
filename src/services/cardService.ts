import { supabase } from '../lib/supabaseClient';

export interface CardData {
  number: string;
  holderName: string;
  holderDocument: string;
  expMonth: string;
  expYear: string;
  cvv: string;
}

export interface CustomerData {
  name: string;
  email: string;
  document: string;
  address: {
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipcode: string;
  };
}

export interface SavedCard {
  id: number;
  last_4_digits: string;
  brand: string;
  created_at: string;
}

export interface VerificationData {
  verificationId: number;
  cardIdentifier: string;
  verificationAmount: number;
  amountInReais: string;
  expiresAt: string;
  chargeId: string;
  refundId?: string;
}

// Função para criptografia simples
function encryptData(data: string, key: string): string {
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
}

// Função auxiliar para chamar a edge function
async function callCardEdgeFunction(action: string, payload: any = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se a sessão não está expirada
  const now = Math.round(Date.now() / 1000);
  const tokenExpiry = session.expires_at || 0;
  
  if (tokenExpiry <= now) {
    console.log('Token expirado, tentando renovar...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshData.session) {
      throw new Error('Sessão expirada e não foi possível renovar');
    }
  }

  try {
    console.log('💳 Chamando Card Edge Function:', action);
    
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/card_service?action=${action}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2lvdmtlZXpmaGF2ZmlzYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDM1NjAsImV4cCI6MjA3MTcxOTU2MH0.Ne_L8SZJn5Lg3_DY1i_2RVHABGLlQrcma7JkW3TkNgc',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('📡 Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Edge Function HTTP Error: ${response.status}`, errorText);
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Edge Function Response:', result);

    return result;
  } catch (error) {
    console.error('❌ Erro ao chamar edge function:', error);
    throw new Error(`Erro inesperado: ${error instanceof Error ? error.message : error}`);
  }
}

// Iniciar verificação de cartão com micro-transação
export async function startCardVerification(cardData: CardData, customerData: CustomerData): Promise<VerificationData | null> {
  try {
    const encryptionKey = 'default_key_change_in_production';
    
    console.log('🔐 Iniciando verificação do cartão...');
    const encryptedCardData = encryptData(JSON.stringify(cardData), encryptionKey);
    
    const result = await callCardEdgeFunction('start_verification', {
      encryptedCardData,
      customerData
    });

    if (result?.success && result?.data) {
      console.log('✅ Verificação iniciada:', result.data);
      return result.data;
    }

    console.warn('Edge function retornou success false:', result);
    return null;
  } catch (error) {
    console.error('Erro ao iniciar verificação:', error);
    throw error;
  }
}

// Verificar valor inserido pelo usuário
export async function verifyCardAmount(cardIdentifier: string, userAmountInCents: number): Promise<{ success: boolean; verified?: boolean; error?: string }> {
  try {
    console.log('🔍 Verificando valor inserido...');
    console.log('Card Identifier:', cardIdentifier);
    console.log('User Amount (centavos):', userAmountInCents);
    
    const result = await callCardEdgeFunction('verify_amount', {
      cardIdentifier,
      userAmount: userAmountInCents
    });

    if (result?.success && result?.verified) {
      console.log('✅ Cartão verificado com sucesso!');
      return { success: true, verified: true };
    }

    console.log('❌ Verificação falhou:', result?.error);
    return { 
      success: false, 
      error: result?.error || 'Erro na verificação' 
    };
  } catch (error) {
    console.error('Erro ao verificar valor:', error);
    throw error;
  }
}

// Criar cartão após verificação bem-sucedida
export async function createVerifiedCard(cardData: CardData, customerData: CustomerData, cardIdentifier: string): Promise<SavedCard | null> {
  try {
    const encryptionKey = 'default_key_change_in_production';
    
    console.log('💳 Criando cartão verificado...');
    const encryptedCardData = encryptData(JSON.stringify(cardData), encryptionKey);
    
    const result = await callCardEdgeFunction('create_card', {
      encryptedCardData,
      customerData,
      cardIdentifier
    });

    if (result?.success && result?.data) {
      console.log('✅ Cartão criado:', result.data);
      return result.data;
    }

    console.warn('Edge function retornou success false:', result);
    return null;
  } catch (error) {
    console.error('Erro ao criar cartão verificado:', error);
    throw error;
  }
}

// Listar cartões do usuário
export async function getUserCards(): Promise<SavedCard[]> {
  try {
    console.log('📋 Buscando cartões do usuário...');
    
    const result = await callCardEdgeFunction('list_cards');

    if (result?.success && result?.data) {
      console.log('✅ Cartões encontrados:', result.data.length);
      return result.data;
    }

    console.warn('Edge function retornou success false:', result);
    return [];
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    throw error;
  }
}

// Deletar cartão
export async function deleteCard(cardId: number): Promise<boolean> {
  try {
    console.log('🗑️ Deletando cartão:', cardId);
    
    const result = await callCardEdgeFunction('delete_card', { cardId });
    
    if (result?.success) {
      console.log('✅ Cartão deletado com sucesso');
      return true;
    } else {
      console.error('❌ Erro ao deletar cartão:', result?.error);
      return false;
    }
  } catch (error) {
    console.error('Erro ao deletar cartão:', error);
    return false;
  }
}

// Obter token do cartão para transações
export async function getCardTokenForTransaction(cardId: number): Promise<string | null> {
  try {
    console.log('🔓 Obtendo token do cartão para transação:', cardId);
    
    const result = await callCardEdgeFunction('get_card_token', { cardId });
    
    if (result?.success && result?.cardToken) {
      console.log('✅ Token obtido com sucesso');
      return result.cardToken;
    } else {
      console.error('❌ Erro ao obter token:', result?.error);
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter token do cartão:', error);
    return null;
  }
}

// Função auxiliar para formatar número do cartão
export function formatCardNumber(number: string): string {
  return number.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim();
}

// Função auxiliar para formatar data de validade
export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
}

// Função auxiliar para validar número do cartão (algoritmo de Luhn)
export function validateCardNumber(number: string): boolean {
  const cleaned = number.replace(/\s/g, '');
  if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// Função auxiliar para obter bandeira do cartão
export function getCardBrand(number: string): string {
  const cleaned = number.replace(/\s/g, '');
  
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  if (/^6011|^644[0-9]|^65/.test(cleaned)) return 'Discover';
  if (/^30[0-5]|^36|^38/.test(cleaned)) return 'Diners Club';
  
  return 'Desconhecida';
}

// Função auxiliar para validar CPF
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  // Verifica sequências inválidas
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

// Função auxiliar para mascarar CPF
export function maskCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função auxiliar para converter reais para centavos
export function reaisToLentavos(reais: string): number {
  return Math.round(parseFloat(reais.replace(',', '.')) * 100);
}

// Função auxiliar para converter centavos para reais formatado
export function centavosToReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

// Função auxiliar para mascarar CEP
export function maskZipCode(zipCode: string): string {
  const cleaned = zipCode.replace(/\D/g, '');
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Função auxiliar para obter máscara do cartão por bandeira
export function getCardMask(brand: string): string {
  switch (brand) {
    case 'American Express':
      return '**** ****** *****';
    case 'Diners Club':
      return '**** ****** ****';
    default:
      return '**** **** **** ****';
  }
}