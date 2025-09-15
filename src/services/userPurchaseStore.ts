import { supabase } from '../lib/supabaseClient';

export type PurchaseStatus = 
  | 'waiting_payment'
  | 'paid'
  | 'processing'
  | 'transport'
  | 'delivered'
  | 'canceled'
  | 'refunded';

export type PaymentMethod = 'pix' | 'boleto' | 'credit_card';

// Labels para exibição
export const statusLabels: Record<PurchaseStatus, string> = {
  waiting_payment: 'Aguardando Pagamento',
  paid: 'Pago',
  processing: 'Processando',
  transport: 'Em Transporte',
  delivered: 'Entregue',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
};

// Cores para cada status
export const statusColors: Record<PurchaseStatus, string> = {
  waiting_payment: '#FF9500',
  paid: '#34C759',
  processing: '#007AFF',
  transport: '#5856D6',
  delivered: '#22D883',
  canceled: '#FF3B30',
  refunded: '#8E8E93',
};

// Labels para métodos de pagamento
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  credit_card: 'Cartão de Crédito',
};

export interface UserPurchase {
  purchase_id: number;
  purchase_date: string;
  gateway_order_id?: string;
  amount: number;
  status: PurchaseStatus;
  shipping_fee: number;
  payment_method: PaymentMethod;
  installment?: number;
  address_id?: number;
  // Informações do endereço
  customer_address?: string;
  customer_number?: string;
  customer_neighborhood?: string;
  customer_city?: string;
  customer_state?: string;
  customer_zipcode?: string;
  // Totais calculados
  total_amount: number;
  items_count: number;
}

export interface UserPurchaseItem {
  cart_id: string;
  product_id: string;
  product_name: string;
  product_description?: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  brand_name?: string;
  category_name?: string;
  store_name?: string;
  store_user_id?: string;
  main_image_url?: string;
}

export interface UserPurchaseDetail extends UserPurchase {
  items: UserPurchaseItem[];
}

export interface PurchaseFilters {
  status?: PurchaseStatus;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

// Função auxiliar para buscar endereço por ID
async function getAddressById(addressId: number) {
  const { data, error } = await supabase
    .from('user_address')
    .select('*')
    .eq('id', addressId)
    .single();
    
  if (error) {
    console.error('Erro ao buscar endereço:', error);
    return null;
  }
  
  return data;
}

// Buscar todas as compras do usuário
export async function getUserPurchases(filters?: PurchaseFilters): Promise<UserPurchase[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return [];
    }

    let query = supabase
      .from('purchase')
      .select(`
        id,
        created_at,
        gateway_order_id,
        amount,
        status,
        shipping_fee,
        payment_method,
        installment,
        address_id
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    // Aplicar filtros se fornecidos
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar compras do usuário:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Para cada purchase, buscar a contagem de itens e o endereço
    const purchasesWithItemCount = await Promise.all(
      data.map(async (purchase) => {
        // Buscar contagem de itens
        const { count: itemsCount, error: countError } = await supabase
          .from('vw_cart_detail')
          .select('*', { count: 'exact', head: true })
          .eq('purchase_id', purchase.id)
          .eq('user_id', user.id);

        if (countError) {
          console.error(`Erro ao contar itens da purchase ${purchase.id}:`, countError);
        }

        // Buscar endereço se address_id existir
        let address = null;
        if (purchase.address_id) {
          address = await getAddressById(purchase.address_id);
        }
        
        const userPurchase: UserPurchase = {
          purchase_id: purchase.id,
          purchase_date: purchase.created_at,
          gateway_order_id: purchase.gateway_order_id,
          amount: purchase.amount,
          status: purchase.status,
          shipping_fee: purchase.shipping_fee,
          payment_method: purchase.payment_method,
          installment: purchase.installment,
          address_id: purchase.address_id,
          customer_address: address?.address,
          customer_number: address?.number,
          customer_neighborhood: address?.neighborhood,
          customer_city: address?.city,
          customer_state: address?.state,
          customer_zipcode: address?.zipcode,
          total_amount: purchase.amount + purchase.shipping_fee,
          items_count: itemsCount || 0,
        };

        return userPurchase;
      })
    );

    // Aplicar filtro de pesquisa se fornecido
    if (filters?.searchQuery) {
      const searchTerm = filters.searchQuery.toLowerCase();
      return purchasesWithItemCount.filter(purchase => 
        purchase.purchase_id.toString().includes(searchTerm) ||
        purchase.gateway_order_id?.toLowerCase().includes(searchTerm)
      );
    }

    return purchasesWithItemCount;
  } catch (error) {
    console.error('Erro ao buscar compras do usuário:', error);
    return [];
  }
}

// Buscar detalhes de uma compra específica com todos os itens
export async function getUserPurchaseDetails(purchaseId: string): Promise<UserPurchaseDetail | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return null;
    }

    // Buscar dados da purchase
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchase')
      .select(`
        id,
        created_at,
        gateway_order_id,
        amount,
        status,
        shipping_fee,
        payment_method,
        installment,
        address_id
      `)
      .eq('id', parseInt(purchaseId))
      .eq('customer_id', user.id)
      .single();

    if (purchaseError) {
      console.error('Erro ao buscar dados da purchase:', purchaseError);
      return null;
    }

    if (!purchaseData) {
      console.log('Purchase não encontrada');
      return null;
    }

    // Buscar endereço se address_id existir
    let address = null;
    if (purchaseData.address_id) {
      address = await getAddressById(purchaseData.address_id);
    }

    // Buscar itens da compra através da view vw_cart_detail
    const { data: itemsData, error: itemsError } = await supabase
      .from('vw_cart_detail')
      .select('*')
      .eq('purchase_id', parseInt(purchaseId))
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (itemsError) {
      console.error('Erro ao buscar itens da purchase:', itemsError);
      return null;
    }
    
    const items: UserPurchaseItem[] = (itemsData || []).map(item => ({
      cart_id: item.cart_id.toString(),
      product_id: item.product_id.toString(),
      product_name: item.product_name,
      product_description: item.product_description,
      product_price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
      brand_name: item.brand_name,
      category_name: item.category_name,
      store_name: item.store_name || item.company_name,
      store_user_id: item.store_user_id,
      main_image_url: item.main_image_url,
    }));

    const purchaseDetail: UserPurchaseDetail = {
      purchase_id: purchaseData.id,
      purchase_date: purchaseData.created_at,
      gateway_order_id: purchaseData.gateway_order_id,
      amount: purchaseData.amount,
      status: purchaseData.status,
      shipping_fee: purchaseData.shipping_fee,
      payment_method: purchaseData.payment_method,
      installment: purchaseData.installment,
      address_id: purchaseData.address_id,
      customer_address: address?.address,
      customer_number: address?.number,
      customer_neighborhood: address?.neighborhood,
      customer_city: address?.city,
      customer_state: address?.state,
      customer_zipcode: address?.zipcode,
      total_amount: purchaseData.amount + purchaseData.shipping_fee,
      items_count: items.length,
      items,
    };

    return purchaseDetail;
  } catch (error) {
    console.error('Erro ao buscar detalhes da compra:', error);
    return null;
  }
}

// Função para formatar preço
export function formatPrice(price: number): string {
  return `R$ ${(price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// Função para formatar data
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

// Função para obter texto do pagamento com parcelas
export function getPaymentText(purchase: UserPurchase): string {
  const method = paymentMethodLabels[purchase.payment_method];
  if (purchase.installment && purchase.installment > 1) {
    return `${purchase.installment}x ${method}`;
  }
  return method;
}

// Função para obter texto das parcelas
export function getInstallmentText(purchase: UserPurchase): string {
  if (purchase.installment && purchase.installment > 1) {
    const installmentValue = purchase.total_amount / purchase.installment;
    return `ou ${purchase.installment}x de ${formatPrice(installmentValue)} sem juros`;
  }
  return 'À vista';
}