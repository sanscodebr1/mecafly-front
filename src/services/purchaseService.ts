// services/purchaseService.ts
import { supabase } from '../lib/supabaseClient';
import { CartSummary, markCartItemsAsProcessed } from './cart';
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

export async function createPurchase(purchaseData: CreatePurchaseData): Promise<Purchase | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return null;
    }

    const { cart, shippingOption, paymentMethod, selectedAddress, installments } = purchaseData;

    // Verificar se o carrinho está vazio (só considera itens com purchase_id null)
    if (cart.items.length === 0) {
      console.error('Carrinho está vazio ou todos os itens já foram processados');
      return null;
    }

    const productsTotal = cart.totalValue; 

    console.log('=== INICIANDO CRIAÇÃO DA PURCHASE ===');
    console.log('Total dos produtos:', productsTotal);
    console.log('Valor do frete:', shippingOption.price);
    console.log('Método de pagamento:', paymentMethod);
    console.log('Parcelas:', installments);
    console.log('Endereço ID:', selectedAddress.id);
    console.log('Itens do carrinho (ativos):', cart.items.length);

    // STEP 1: Criar a purchase principal primeiro
    const purchaseRecord = {
      customer_id: user.id,
      gateway_order_id: null,
      amount: productsTotal, 
      status: 'waiting_payment' as SaleStatus,
      shipping_fee: shippingOption.price, 
      payment_method: paymentMethod,
      address_id: selectedAddress.id, 
      installment: paymentMethod === 'credit_card' ? installments || 1 : null, 
    };

    console.log('Dados da purchase:', purchaseRecord);

    // Inserir a purchase principal
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchase')
      .insert(purchaseRecord)
      .select()
      .single();

    if (purchaseError) {
      console.error('Erro ao criar purchase:', purchaseError);
      return null;
    }

    console.log('✅ Purchase criada com ID:', purchase.id);

    // STEP 2: Marcar itens do carrinho como processados ANTES de criar store_sales
    const cartUpdateSuccess = await markCartItemsAsProcessed(purchase.id);
    
    if (!cartUpdateSuccess) {
      console.error('Erro ao marcar itens do carrinho como processados');
      // Tentar reverter a purchase criada
      await supabase.from('purchase').delete().eq('id', purchase.id);
      return null;
    }

    // STEP 3: Criar store_sales vinculadas à purchase criada
    const storeSalesPromises = cart.items.map(async (item) => {
      // Calcular valor total do item (preço unitário * quantidade)
      const itemTotalAmount = parseFloat(item.price.replace('R$ ', '').replace(',', '.')) * 100 * item.quantity;
      
      // Usar diretamente o storeUserId que já vem da view
      const storeUserId = item.storeUserId;

      console.log(`Debug item ${item.name}:`, {
        storeId_from_cart: item.storeId,
        storeUserId_from_cart: item.storeUserId,
        storeName: item.storeName
      });
      
      const storeSaleRecord = {
        store_id: storeUserId,
        customer_id: user.id,
        product_id: parseInt(item.productId),
        amount: itemTotalAmount,
        status: 'waiting_payment' as SaleStatus,
        quantity: item.quantity,
        payment_method: paymentMethod,
        installment: paymentMethod === 'credit_card' ? installments || 1 : null,
        customer_address: selectedAddress.id,
        purchase_id: purchase.id, // Vincular à purchase criada
      };

      console.log(`Criando store_sale para produto ${item.name} vinculada à purchase ${purchase.id}:`, storeSaleRecord);

      const { data: storeSale, error: storeSaleError } = await supabase
        .from('store_sale')
        .insert(storeSaleRecord)
        .select()
        .single();

      if (storeSaleError) {
        console.error('Erro ao criar store_sale:', storeSaleError);
        return null;
      }

      console.log('✅ Store sale criada com ID:', storeSale.id, '-> vinculada à purchase:', storeSale.purchase_id);
      return storeSale;
    });

    // Aguardar todas as store_sales serem criadas
    const storeSales = await Promise.all(storeSalesPromises);
    
    // Verificar se todas foram criadas com sucesso
    const failedSales = storeSales.filter(sale => sale === null);
    if (failedSales.length > 0) {
      console.error(`${failedSales.length} store_sales falharam ao ser criadas`);
      // Opcional: implementar rollback completo aqui se necessário
    }

    const successfulSales = storeSales.filter(sale => sale !== null);
    console.log(`=== PURCHASE ${purchase.id} CRIADA COM SUCESSO ===`);
    console.log(`- Purchase ID: ${purchase.id}`);
    console.log(`- Store sales criadas: ${successfulSales.length}/${cart.items.length}`);
    console.log(`- Parcelas: ${installments || 1}`);
    console.log(`- Endereço ID: ${selectedAddress.id}`);
    console.log(`- Valor total: R$ ${(purchase.amount + purchase.shipping_fee) / 100}`);
    console.log(`- Itens do carrinho marcados como processados: ✅`);

    return purchase as Purchase;

  } catch (error) {
    console.error('Erro inesperado ao criar purchase:', error);
    return null;
  }
}

export async function getPurchaseById(purchaseId: number): Promise<Purchase | null> {
  try {
    const { data, error } = await supabase
      .from('purchase')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (error) {
      console.error('Erro ao buscar purchase:', error);
      return null;
    }

    return data as Purchase;
  } catch (error) {
    console.error('Erro inesperado ao buscar purchase:', error);
    return null;
  }
}

export async function getUserPurchases(): Promise<Purchase[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return [];
    }

    const { data, error } = await supabase
      .from('purchase')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar purchases do usuário:', error);
      return [];
    }

    return data as Purchase[];
  } catch (error) {
    console.error('Erro inesperado ao buscar purchases:', error);
    return [];
  }
}

export async function getStoreSales(): Promise<StoreSale[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return [];
    }

    const { data, error } = await supabase
      .from('store_sale')
      .select('*')
      .eq('store_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar vendas da loja:', error);
      return [];
    }

    return data as StoreSale[];
  } catch (error) {
    console.error('Erro inesperado ao buscar vendas da loja:', error);
    return [];
  }
}

export async function updatePurchaseStatus(purchaseId: number, status: SaleStatus): Promise<boolean> {
  try {
    // Atualizar a purchase
    const { error: purchaseError } = await supabase
      .from('purchase')
      .update({ status })
      .eq('id', purchaseId);

    if (purchaseError) {
      console.error('Erro ao atualizar status da purchase:', purchaseError);
      return false;
    }

    // Atualizar todas as store_sales relacionadas usando purchase_id
    const { error: storeSalesError } = await supabase
      .from('store_sale')
      .update({ status })
      .eq('purchase_id', purchaseId);

    if (storeSalesError) {
      console.error('Erro ao atualizar status das store_sales:', storeSalesError);
      return false;
    }

    console.log(`Status da purchase ${purchaseId} e store_sales relacionadas atualizado para: ${status}`);
    return true;
  } catch (error) {
    console.error('Erro inesperado ao atualizar status:', error);
    return false;
  }
}

export async function updatePurchaseGatewayOrderId(purchaseId: number, gatewayOrderId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('purchase')
      .update({ gateway_order_id: gatewayOrderId })
      .eq('id', purchaseId);

    if (error) {
      console.error('Erro ao atualizar gateway_order_id:', error);
      return false;
    }

    console.log(`Gateway Order ID ${gatewayOrderId} adicionado à purchase ${purchaseId}`);
    return true;
  } catch (error) {
    console.error('Erro inesperado ao atualizar gateway_order_id:', error);
    return false;
  }
}

export async function getStoreSalesByPurchaseId(purchaseId: number): Promise<StoreSale[]> {
  try {
    const { data, error } = await supabase
      .from('store_sale')
      .select('*')
      .eq('purchase_id', purchaseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar store sales por purchase ID:', error);
      return [];
    }

    return data as StoreSale[];
  } catch (error) {
    console.error('Erro inesperado ao buscar store sales:', error);
    return [];
  }
}

export async function getPurchaseWithStoreSales(purchaseId: number): Promise<{
  purchase: Purchase | null;
  storeSales: StoreSale[];
}> {
  try {
    const [purchase, storeSales] = await Promise.all([
      getPurchaseById(purchaseId),
      getStoreSalesByPurchaseId(purchaseId)
    ]);

    return {
      purchase,
      storeSales
    };
  } catch (error) {
    console.error('Erro ao buscar purchase com store sales:', error);
    return {
      purchase: null,
      storeSales: []
    };
  }
}

// ★ NOVA FUNÇÃO: Buscar histórico de compras do usuário com itens do carrinho
export async function getUserPurchaseHistory(): Promise<Array<Purchase & { cartItems: any[] }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return [];
    }

    // Buscar purchases do usuário
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchase')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (purchaseError) {
      console.error('Erro ao buscar histórico de purchases:', purchaseError);
      return [];
    }

    if (!purchases || purchases.length === 0) {
      return [];
    }

    // Para cada purchase, buscar os itens do carrinho relacionados
    const purchasesWithItems = await Promise.all(
      purchases.map(async (purchase) => {
        const { data: cartItems, error: cartError } = await supabase
          .from('vw_cart_detail')
          .select('*')
          .eq('user_id', user.id)
          .eq('purchase_id', purchase.id)
          .order('added_at', { ascending: false });

        if (cartError) {
          console.error(`Erro ao buscar itens da purchase ${purchase.id}:`, cartError);
          return { ...purchase, cartItems: [] };
        }

        return {
          ...purchase,
          cartItems: cartItems || []
        };
      })
    );

    return purchasesWithItems;
  } catch (error) {
    console.error('Erro ao buscar histórico de compras:', error);
    return [];
  }
}