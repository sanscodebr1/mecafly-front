// services/cart.ts
import { supabase } from '../lib/supabaseClient';

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: string;
  quantity: number;
  subtotal: string;
  image: string;
  stock: number;
  isAvailable: boolean;
  productId: string;
  storeId: string | null;
  storeUserId: string | null;
  storeName: string;
  allow_pickup: boolean;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalValue: number;
  totalValueFormatted: string;
}

// Função auxiliar para chamar a edge function
async function callCartEdgeFunction(action: string, payload: any = {}) {
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
    console.log('🛒 Chamando Cart Edge Function:', action);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/cart-service?action=${action}`,
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

// Buscar todos os itens do carrinho do usuário (APENAS itens não processados)
export async function getUserCart(): Promise<CartSummary> {
  try {
    const result = await callCartEdgeFunction('get-cart');

    if (result?.success && result?.cart) {
      return result.cart;
    }

    console.warn('Edge function retornou success false:', result);
    return { items: [], totalItems: 0, totalValue: 0, totalValueFormatted: 'R$ 0,00' };
  } catch (error) {
    console.error('Erro ao buscar carrinho:', error);
    return { items: [], totalItems: 0, totalValue: 0, totalValueFormatted: 'R$ 0,00' };
  }
}

// Adicionar produto ao carrinho
export async function addToCart(productId: string, quantity: number = 1): Promise<boolean> {
  try {
    const result = await callCartEdgeFunction('add-to-cart', { productId, quantity });
    return result?.success || false;
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    return false;
  }
}

// Atualizar quantidade de item no carrinho
export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<boolean> {
  try {
    const result = await callCartEdgeFunction('update-quantity', { cartItemId, quantity });
    return result?.success || false;
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
    return false;
  }
}

// Remover item do carrinho
export async function removeFromCart(cartItemId: string): Promise<boolean> {
  try {
    const result = await callCartEdgeFunction('remove-item', { cartItemId });
    return result?.success || false;
  } catch (error) {
    console.error('Erro ao remover do carrinho:', error);
    return false;
  }
}

// Limpar carrinho
export async function clearCart(): Promise<boolean> {
  try {
    const result = await callCartEdgeFunction('clear-cart');
    return result?.success || false;
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    return false;
  }
}

// Verificar se produto está no carrinho
export async function isProductInCart(productId: string): Promise<{ inCart: boolean; quantity: number }> {
  try {
    const result = await callCartEdgeFunction('check-product', { productId });

    if (result?.success) {
      return { inCart: result.inCart || false, quantity: result.quantity || 0 };
    }

    return { inCart: false, quantity: 0 };
  } catch (error) {
    console.error('Erro ao verificar produto no carrinho:', error);
    return { inCart: false, quantity: 0 };
  }
}

// Obter quantidade total de itens no carrinho
export async function getCartItemCount(): Promise<number> {
  try {
    const result = await callCartEdgeFunction('get-item-count');

    if (result?.success) {
      return result.count || 0;
    }

    return 0;
  } catch (error) {
    console.error('Erro ao contar itens do carrinho:', error);
    return 0;
  }
}

// Validar carrinho antes do checkout
export async function validateCart(): Promise<{ valid: boolean; issues: string[] }> {
  try {
    const result = await callCartEdgeFunction('validate-cart');

    if (result?.success) {
      return { valid: result.valid || false, issues: result.issues || [] };
    }

    return { valid: false, issues: ['Erro ao validar carrinho'] };
  } catch (error) {
    console.error('Erro ao validar carrinho:', error);
    return { valid: false, issues: ['Erro ao validar carrinho'] };
  }
}

// Sincronizar carrinho (alias para getUserCart)
export async function syncCart(): Promise<CartSummary> {
  try {
    const result = await callCartEdgeFunction('sync-cart');

    if (result?.success && result?.cart) {
      return result.cart;
    }

    return { items: [], totalItems: 0, totalValue: 0, totalValueFormatted: 'R$ 0,00' };
  } catch (error) {
    console.error('Erro ao sincronizar carrinho:', error);
    return { items: [], totalItems: 0, totalValue: 0, totalValueFormatted: 'R$ 0,00' };
  }
}

// Marcar itens do carrinho como processados
export async function markCartItemsAsProcessed(purchaseId: number): Promise<boolean> {
  try {
    const result = await callCartEdgeFunction('mark-items-processed', { purchaseId });
    return result?.success || false;
  } catch (error) {
    console.error('Erro ao marcar itens do carrinho como processados:', error);
    return false;
  }
}