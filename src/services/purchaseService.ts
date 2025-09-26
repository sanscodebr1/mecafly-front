// services/purchaseService.ts
import { supabase } from '../lib/supabaseClient';
import { CartSummary } from './cart';
import { ShippingOption } from './shippingService';
import { UserAddress } from './userAddress';

export type SaleStatus = 
  | 'waiting_payment'
  | 'paid'
  | 'processing'
  | 'transport'
  | 'delivered'
  | 'canceled'
  | 'refunded';

export type PaymentMethod = 'pix' | 'boleto' | 'credit_card';

export type PaymentGateway = 'Pagarme';

export interface CreatePurchaseData {
  cart: CartSummary;
  shippingOption: ShippingOption;
  paymentMethod: PaymentMethod;
  selectedAddress: UserAddress;
  installments?: number; 
}

export interface Purchase {
  id: number;
  created_at: string;
  customer_id: string;
  gateway_order_id?: string;
  amount: number;
  status: SaleStatus;
  shipping_fee: number;
  payment_method: PaymentMethod;
  address_id?: number;
  installment?: number;
}

export interface StoreSale {
  id: number;
  created_at: string;
  store_id: string;
  customer_id: string;
  product_id: number;
  amount: number;
  status: SaleStatus;
  quantity: number;
  payment_method: PaymentMethod;
  installment?: number;
  customer_address?: number;
  purchase_id?: number;
}

// Função auxiliar para chamar a edge function
async function callPurchaseEdgeFunction(action: string, payload: any) {
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
    console.log('🚀 Chamando Purchase Edge Function:', action);
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/purchase-service?action=${action}`,
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

// Função principal para criar purchase
export async function createPurchase(purchaseData: CreatePurchaseData): Promise<Purchase | null> {
  try {
    console.log('Criando purchase:', purchaseData);
    
    const result = await callPurchaseEdgeFunction('create', purchaseData);

    if (result?.success && result?.purchase) {
      return result.purchase;
    }

    console.warn('Edge function retornou success false:', result);
    return null;
  } catch (error) {
    console.error('Erro ao criar purchase:', error);
    return null;
  }
}

// Buscar purchase por ID
export async function getPurchaseById(purchaseId: number): Promise<Purchase | null> {
  try {
    const result = await callPurchaseEdgeFunction('get-by-id', { purchaseId });

    if (result?.success) {
      return result.purchase || null;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar purchase por ID:', error);
    return null;
  }
}

// Buscar todas as purchases do usuário
export async function getUserPurchases(): Promise<Purchase[]> {
  try {
    const result = await callPurchaseEdgeFunction('get-user-purchases', {});

    if (result?.success) {
      return result.purchases || [];
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar purchases do usuário:', error);
    return [];
  }
}

// Buscar vendas da loja
export async function getStoreSales(): Promise<StoreSale[]> {
  try {
    const result = await callPurchaseEdgeFunction('get-store-sales', {});

    if (result?.success) {
      return result.storeSales || [];
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar vendas da loja:', error);
    return [];
  }
}

// Atualizar status da purchase
export async function updatePurchaseStatus(purchaseId: number, status: SaleStatus): Promise<boolean> {
  try {
    const result = await callPurchaseEdgeFunction('update-status', { purchaseId, status });
    return result?.success || false;
  } catch (error) {
    console.error('Erro ao atualizar status da purchase:', error);
    return false;
  }
}

// Atualizar gateway order ID
export async function updatePurchaseGatewayOrderId(purchaseId: number, gatewayOrderId: string): Promise<boolean> {
  try {
    const result = await callPurchaseEdgeFunction('update-gateway-order-id', { 
      purchaseId, 
      gatewayOrderId 
    });
    return result?.success || false;
  } catch (error) {
    console.error('Erro ao atualizar gateway order ID:', error);
    return false;
  }
}

// Buscar store sales por purchase ID
export async function getStoreSalesByPurchaseId(purchaseId: number): Promise<StoreSale[]> {
  try {
    const result = await callPurchaseEdgeFunction('get-store-sales-by-purchase', { purchaseId });

    if (result?.success) {
      return result.storeSales || [];
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar store sales por purchase ID:', error);
    return [];
  }
}

// Buscar purchase com store sales
export async function getPurchaseWithStoreSales(purchaseId: number): Promise<{
  purchase: Purchase | null;
  storeSales: StoreSale[];
}> {
  try {
    const result = await callPurchaseEdgeFunction('get-purchase-with-store-sales', { purchaseId });

    if (result?.success) {
      return {
        purchase: result.purchase || null,
        storeSales: result.storeSales || []
      };
    }

    return {
      purchase: null,
      storeSales: []
    };
  } catch (error) {
    console.error('Erro ao buscar purchase com store sales:', error);
    return {
      purchase: null,
      storeSales: []
    };
  }
}

// Buscar histórico de compras do usuário com itens do carrinho
export async function getUserPurchaseHistory(): Promise<Array<Purchase & { cartItems: any[] }>> {
  try {
    const result = await callPurchaseEdgeFunction('get-purchase-history', {});

    if (result?.success) {
      return result.history || [];
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar histórico de compras:', error);
    return [];
  }
}