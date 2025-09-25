import { supabase } from '../lib/supabaseClient';

// Interfaces
export interface StoreSale {
  sale_id: string;
  sale_date: string;
  amount: number;
  status: 'waiting_payment' | 'paid' | 'processing' | 'transport' | 'delivered' | 'canceled' | 'refunded';
  quantity: number;
  payment_method: 'pix' | 'boleto' | 'credit_card';
  installment: number;
  store_id: string;
  customer_id: string;
  customer_zipcode: string;
  customer_address: string;
  customer_number: string;
  customer_neighborhood: string;
  customer_city: string;
  customer_state: string;
  product_id: string;
  product_name: string;
  product_description: string;
  product_price: number;
  product_image_url: string;
  purchase_id: string;
  purchase_date: string;
  gateway_order_id: string;
  purchase_amount: number;
  purchase_status: string;
  shipping_fee: number;
}

export interface ShippingDetail {
  id: number;
  product_id: number;
  purchase_id: number;
  carrier: string;
  status: string;
  tracking_code: string | null;
  shipping_fee: number;
  label_url: string | null;
  external_shipment_id: string;
  external_service_id: string;
  external_protocol: string;
}

export interface SalesFilters {
  status?: string;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
}

// Labels e configurações
export const statusLabels = {
  waiting_payment: 'Aguardando Pagamento',
  paid: 'Pago',
  processing: 'Processando',
  transport: 'Em Transporte',
  delivered: 'Entregue',
  canceled: 'Cancelado',
  refunded: 'Reembolsado'
};

export const statusColors = {
  waiting_payment: '#FFA500',
  paid: '#22D883',
  processing: '#2196F3',
  transport: '#9C27B0',
  delivered: '#4CAF50',
  canceled: '#F44336',
  refunded: '#FF5722'
};

export const paymentMethodLabels = {
  pix: 'PIX',
  boleto: 'Boleto',
  credit_card: 'Cartão de Crédito'
};

// Função principal para buscar vendas da loja
export async function getStoreSales(filters?: SalesFilters): Promise<StoreSale[]> {
  try {
    // Pegar o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return [];
    }

    console.log('Buscando vendas para user_id:', user.id);

    // Consultar a view usando o user_id como store_id
    let query = supabase
      .from('view_store_sale')
      .select('*')
      .eq('store_id', user.id);

    // Aplicar filtros de status
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Aplicar filtros de método de pagamento
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.eq('payment_method', filters.paymentMethod);
    }

    // Aplicar filtros de data
    if (filters?.dateFrom) {
      query = query.gte('sale_date', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('sale_date', filters.dateTo);
    }

    // Ordenar por data mais recente
    query = query.order('sale_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar vendas:', error);
      return [];
    }

    console.log('Vendas encontradas:', data?.length || 0);
    let sales = data || [];

    // Aplicar filtro de pesquisa no frontend
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const searchQuery = filters.searchQuery.toLowerCase().trim();
      sales = sales.filter(sale => {
        const saleId = sale.sale_id?.toString().toLowerCase() || '';
        const gatewayId = sale.gateway_order_id?.toLowerCase() || '';
        const productName = sale.product_name?.toLowerCase() || '';
        const customerCity = sale.customer_city?.toLowerCase() || '';
        const customerState = sale.customer_state?.toLowerCase() || '';
        
        return saleId.includes(searchQuery) ||
               gatewayId.includes(searchQuery) ||
               productName.includes(searchQuery) ||
               customerCity.includes(searchQuery) ||
               customerState.includes(searchQuery);
      });
    }

    return sales;
  } catch (error) {
    console.error('Erro ao buscar vendas da loja:', error);
    return [];
  }
}

// Buscar detalhes de uma venda específica
export async function getSaleDetails(saleId: string): Promise<StoreSale | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return null;
    }

    const { data, error } = await supabase
      .from('view_store_sale')
      .select('*')
      .eq('store_id', user.id)
      .eq('sale_id', saleId)
      .single();

    if (error) {
      console.error('Erro ao buscar detalhes da venda:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar detalhes da venda:', error);
    return null;
  }
}

// Atualizar status de uma venda
export async function updateSaleStatus(
  saleId: string, 
  newStatus: StoreSale['status']
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    // Verificar se a venda pertence ao usuário
    const sale = await getSaleDetails(saleId);
    if (!sale || sale.store_id !== user.id) {
      console.error('Venda não encontrada ou não pertence à loja');
      return false;
    }

    const { error } = await supabase
      .from('store_sale')
      .update({ status: newStatus })
      .eq('id', saleId)
      .eq('store_id', user.id);

    if (error) {
      console.error('Erro ao atualizar status da venda:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    return false;
  }
}

// NOVA FUNÇÃO: Buscar detalhes do frete de uma compra
export async function getShippingDetails(purchaseId: string): Promise<ShippingDetail[]> {
  try {
    if (!purchaseId) {
      console.log('Purchase ID não fornecido');
      return [];
    }

    const { data, error } = await supabase
      .from('purchase_shipment')
      .select('*')
      .eq('purchase_id', purchaseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar detalhes do frete:', error);
      return [];
    }

    console.log(`Encontrados ${data?.length || 0} registros de frete para purchase_id: ${purchaseId}`);
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar detalhes do frete:', error);
    return [];
  }
}