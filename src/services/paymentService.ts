// services/paymentService.ts - Updated interface
import { supabase } from '../lib/supabaseClient';
import { CartSummary } from './cart';
import { ShippingOption } from './shippingService';
import { UserAddress } from './userAddress';
import { CustomerProfile } from './userProfiles';
import { Purchase } from './purchaseService'; 

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto';

export interface CreatePaymentData {
  paymentMethod: PaymentMethod;
  cart: CartSummary;
  shippingOption: ShippingOption;
  selectedAddress: UserAddress;
  customerProfile: CustomerProfile;
  installments?: number;
  selectedCardId?: number;
}

// Interface para resposta PIX (compatível com a atual)
export interface PagarmePixResponse {
  id: string;
  code: string;
  amount: number;
  currency: string;
  closed: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  customer: any;
  items: any[];
  charges: Array<{
    id: string;
    code: string;
    gateway_id: string;
    amount: number;
    status: string;
    currency: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
    customer: any;
    last_transaction: {
      pix_provider_tid?: string;
      qr_code?: string;
      qr_code_url?: string;
      expires_at?: string;
      id: string;
      transaction_type: string;
      gateway_id: string;
      amount: number;
      status: string;
      success: boolean;
      created_at: string;
      updated_at: string;
      gateway_response: Record<string, any>;
      antifraud_response: Record<string, any>;
      metadata: Record<string, any>;
    };
  }>;
}

// Interface para resposta de cartão de crédito
export interface PagarmeCreditCardResponse {
  id: string;
  code: string;
  amount: number;
  currency: string;
  closed: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  customer: any;
  items: any[];
  charges: Array<{
    id: string;
    code: string;
    gateway_id: string;
    amount: number;
    status: string; // 'paid', 'pending', 'failed', etc.
    currency: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
    customer: any;
    last_transaction: {
      id: string;
      transaction_type: string;
      gateway_id: string;
      amount: number;
      status: string;
      success: boolean;
      installments: number;
      created_at: string;
      updated_at: string;
      gateway_response: Record<string, any>;
      antifraud_response: Record<string, any>;
      metadata: Record<string, any>;
    };
  }>;
}

// Interface para resposta de boleto (para futuro uso)
export interface PagarmeBoletoResponse {
  id: string;
  status: string;
  [key: string]: any;
}

// Interface unificada de resposta
export interface PaymentResponse {
  success: boolean;
  data?: PagarmePixResponse | PagarmeCreditCardResponse | PagarmeBoletoResponse;
  purchase?: Purchase; 
  storeSales?: any[]; 
  validatedCart?: any;
  error?: string;
}

// Função auxiliar para chamar a edge function
async function callPaymentEdgeFunction(action: string, payload: any) {
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
    
    // Usar a sessão renovada
    session = refreshData.session;
  }

  try {
    console.log('🚀 Chamando Payment Edge Function:', action);
    console.log('💳 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/payment-service?action=${action}`,
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

    const result = await response.json();
    console.log('✅ Payment Edge Function Response:', result);

    if (!response.ok) {
      console.error(`Payment Edge Function HTTP Error: ${response.status}`, result);
      throw new Error(`Erro HTTP ${response.status}: ${result.error || 'Erro desconhecido'}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Erro ao chamar payment edge function:', error);
    throw new Error(`Erro inesperado: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Função principal para criar pagamento
 * Substitui a antiga createPagarmePixOrder e será expandida para outros métodos
 */
export async function createPayment(paymentData: CreatePaymentData): Promise<PaymentResponse> {
  try {
    console.log('=== CRIANDO PAGAMENTO ===');
    console.log('Método:', paymentData.paymentMethod);
    console.log('Valor total do carrinho:', paymentData.cart.totalValue);
    console.log('Valor do frete:', paymentData.shippingOption.price);
    console.log('Parcelas:', paymentData.installments || 1);
    console.log('Card ID:', paymentData.selectedCardId || 'N/A');
    
    const result = await callPaymentEdgeFunction('create_payment', {
      paymentData
    });

    if (result?.success) {
      console.log('✅ Pagamento criado com sucesso');
      console.log('✅ Purchase criada pelo backend:', result.purchase?.id);
      console.log('✅ Status determinado pelo backend:', result.purchase?.status);
      
      return {
        success: true,
        data: result.data,
        purchase: result.purchase, 
        storeSales: result.storeSales,
        validatedCart: result.validatedCart
      };
    } else {
      console.warn('⚠️ Edge function retornou success false:', result);
      return {
        success: false,
        error: result.error || 'Erro desconhecido ao criar pagamento'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao criar pagamento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado'
    };
  }
}

/**
 * NOVA FUNÇÃO: Cancelar uma venda na Pagarme
 */
export async function cancelSalePayment(gatewayOrderId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    console.log('=== CANCELANDO PAGAMENTO NA PAGARME ===');
    console.log('Gateway Order ID:', gatewayOrderId);
    
    const result = await callPaymentEdgeFunction('cancel_payment', {
      gatewayOrderId
    });

    if (result?.success) {
      console.log('✅ Pagamento cancelado com sucesso na Pagarme');
      return {
        success: true,
        message: result.message || 'Pagamento cancelado com sucesso'
      };
    } else {
      console.warn('⚠️ Erro ao cancelar pagamento:', result);
      return {
        success: false,
        error: result.error || 'Erro desconhecido ao cancelar pagamento'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao cancelar pagamento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado'
    };
  }
}

/**
 * Função específica para PIX (mantém compatibilidade com código atual)
 * Esta é um wrapper para a createPayment que força o método PIX
 */
export async function createPagarmePixOrder(data: {
  cart: CartSummary;
  shippingOption: ShippingOption;
  selectedAddress: UserAddress;
  customerProfile: CustomerProfile;
}): Promise<PagarmePixResponse | null> {
  try {
    console.log('=== WRAPPER PIX (COMPATIBILIDADE) ===');
    
    const paymentData: CreatePaymentData = {
      paymentMethod: 'pix',
      cart: data.cart,
      shippingOption: data.shippingOption,
      selectedAddress: data.selectedAddress,
      customerProfile: data.customerProfile,
    };

    const result = await createPayment(paymentData);
    
    if (result.success && result.data) {
      return result.data as PagarmePixResponse;
    } else {
      console.error('Erro no wrapper PIX:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro no wrapper PIX:', error);
    return null;
  }
}

/**
 * Função específica para cartão de crédito
 */
export async function createCreditCardPayment(data: {
  cart: CartSummary;
  shippingOption: ShippingOption;
  selectedAddress: UserAddress;
  customerProfile: CustomerProfile;
  installments: number;
  selectedCardId: number;
}): Promise<PagarmeCreditCardResponse | null> {
  try {
    console.log('=== PAGAMENTO CARTÃO DE CRÉDITO ===');
    
    const paymentData: CreatePaymentData = {
      paymentMethod: 'credit_card',
      cart: data.cart,
      shippingOption: data.shippingOption,
      selectedAddress: data.selectedAddress,
      customerProfile: data.customerProfile,
      installments: data.installments,
      selectedCardId: data.selectedCardId,
    };

    const result = await createPayment(paymentData);
    
    if (result.success && result.data) {
      return result.data as PagarmeCreditCardResponse;
    } else {
      console.error('Erro no pagamento cartão:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro no pagamento cartão:', error);
    return null;
  }
}

/**
 * Função específica para boleto (para futuro uso)
 */
export async function createBoletoPayment(data: {
  cart: CartSummary;
  shippingOption: ShippingOption;
  selectedAddress: UserAddress;
  customerProfile: CustomerProfile;
}): Promise<PagarmeBoletoResponse | null> {
  try {
    console.log('=== PAGAMENTO BOLETO ===');
    
    const paymentData: CreatePaymentData = {
      paymentMethod: 'boleto',
      cart: data.cart,
      shippingOption: data.shippingOption,
      selectedAddress: data.selectedAddress,
      customerProfile: data.customerProfile,
    };

    const result = await createPayment(paymentData);
    
    if (result.success && result.data) {
      return result.data as PagarmeBoletoResponse;
    } else {
      console.error('Erro no pagamento boleto:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro no pagamento boleto:', error);
    return null;
  }
}

// Funções utilitárias (mantidas do arquivo original)
function cleanCPF(cpf: string): string {
  return cpf?.replace(/\D/g, '') || '12345678900';
}

function cleanZipCode(zipCode: string): string {
  return zipCode?.replace(/\D/g, '') || '01000000';
}

function btoa(str: string): string {
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(str);
  }
  
  return Buffer.from(str).toString('base64');
}