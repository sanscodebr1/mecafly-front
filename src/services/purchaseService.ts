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
}

// Função para criar uma nova compra com vendas por loja
export async function createPurchase(purchaseData: CreatePurchaseData): Promise<Purchase | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return null;
    }

    const { cart, shippingOption, paymentMethod } = purchaseData;

    // Calcular o valor total apenas dos produtos (sem frete)
    const productsTotal = cart.totalValue; // em centavos

    console.log('=== INICIANDO CRIAÇÃO DA PURCHASE ===');
    console.log('Total dos produtos:', productsTotal);
    console.log('Valor do frete:', shippingOption.price);
    console.log('Itens do carrinho:', cart.items);

    // Criar a purchase principal (apenas produtos, sem frete)
    const purchaseRecord = {
      customer_id: user.id,
      gateway_order_id: null,
      amount: productsTotal, // Total apenas dos produtos em centavos
      status: 'waiting_payment' as SaleStatus,
      shipping_fee: shippingOption.price, // Frete em centavos
      payment_method: paymentMethod,
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

    console.log('Purchase criada:', purchase);

    // Criar store_sales para cada item do carrinho
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
        store_id: storeUserId, // UUID do usuário da loja (já vem da view)
        customer_id: user.id,
        product_id: parseInt(item.productId),
        amount: itemTotalAmount, // Valor bruto total do item em centavos
        status: 'waiting_payment' as SaleStatus,
        quantity: item.quantity,
        payment_method: paymentMethod,
      };

      console.log(`Criando store_sale para produto ${item.name}:`, storeSaleRecord);

      const { data: storeSale, error: storeSaleError } = await supabase
        .from('store_sale')
        .insert(storeSaleRecord)
        .select()
        .single();

      if (storeSaleError) {
        console.error('Erro ao criar store_sale:', storeSaleError);
        return null;
      }

      console.log('Store sale criada:', storeSale);
      return storeSale;
    });

    // Aguardar todas as store_sales serem criadas
    const storeSales = await Promise.all(storeSalesPromises);
    
    // Verificar se todas foram criadas com sucesso
    const failedSales = storeSales.filter(sale => sale === null);
    if (failedSales.length > 0) {
      console.error(`${failedSales.length} store_sales falharam ao ser criadas`);
      // Você pode decidir se quer reverter a purchase ou continuar
    }

    const successfulSales = storeSales.filter(sale => sale !== null);
    console.log(`Purchase criada com ${successfulSales.length} store_sales associadas`);

    return purchase as Purchase;

  } catch (error) {
    console.error('Erro inesperado ao criar purchase:', error);
    return null;
  }
}

// Função para buscar uma compra por ID
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

// Função para buscar compras do usuário
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

// Função para buscar vendas da loja (store_sales)
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

// Função para buscar vendas da loja com detalhes do produto
export async function getStoreSalesWithDetails(): Promise<any[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return [];
    }

    const { data, error } = await supabase
      .from('store_sale')
      .select(`
        *,
        product:product_id (
          name,
          description,
          price
        ),
        customer:customer_id (
          email
        )
      `)
      .eq('store_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar vendas com detalhes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro inesperado ao buscar vendas com detalhes:', error);
    return [];
  }
}

// Função para atualizar status de uma compra e suas store_sales
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

    // Buscar e atualizar todas as store_sales relacionadas
    // Nota: Como não temos relação direta, precisamos atualizar baseado no timing ou criar uma tabela de relacionamento
    // Por enquanto, vamos atualizar as store_sales do mesmo cliente no mesmo período
    const { data: purchase } = await supabase
      .from('purchase')
      .select('customer_id, created_at')
      .eq('id', purchaseId)
      .single();

    if (purchase) {
      // Atualizar store_sales criadas no mesmo minuto (aproximadamente)
      const createdAt = new Date(purchase.created_at);
      const startTime = new Date(createdAt.getTime() - 60000); // 1 minuto antes
      const endTime = new Date(createdAt.getTime() + 60000); // 1 minuto depois

      const { error: storeSalesError } = await supabase
        .from('store_sale')
        .update({ status })
        .eq('customer_id', purchase.customer_id)
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString());

      if (storeSalesError) {
        console.error('Erro ao atualizar status das store_sales:', storeSalesError);
      }
    }

    console.log(`Status da purchase ${purchaseId} e store_sales relacionadas atualizado para: ${status}`);
    return true;
  } catch (error) {
    console.error('Erro inesperado ao atualizar status:', error);
    return false;
  }
}

// Função para atualizar gateway_order_id após integração com pagamento
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

// Função para buscar estatísticas de vendas da loja
export async function getStoreSalesStatistics(): Promise<{
  totalSales: number;
  totalRevenue: number;
  salesByStatus: Record<SaleStatus, number>;
  salesByMonth: Record<string, number>;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        salesByStatus: {} as Record<SaleStatus, number>,
        salesByMonth: {},
      };
    }

    const { data: sales, error } = await supabase
      .from('store_sale')
      .select('amount, status, created_at')
      .eq('store_id', user.id);

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        totalSales: 0,
        totalRevenue: 0,
        salesByStatus: {} as Record<SaleStatus, number>,
        salesByMonth: {},
      };
    }

    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((sum, sale) => sum + sale.amount, 0) || 0;

    const salesByStatus = sales?.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {} as Record<SaleStatus, number>) || {};

    const salesByMonth = sales?.reduce((acc, sale) => {
      const month = new Date(sale.created_at).toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + sale.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      totalSales,
      totalRevenue,
      salesByStatus,
      salesByMonth,
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar estatísticas:', error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      salesByStatus: {} as Record<SaleStatus, number>,
      salesByMonth: {},
    };
  }
}