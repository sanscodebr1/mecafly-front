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
  type: string;
}

export interface SalesFilters {
  status?: string;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
}

export interface StoreSupportTicket {
  id: number;
  purchase_id: number;
  product_id: number;
  category_id: number | null;
  custom_category: string | null;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  allow_store_messages: boolean;
  support_category?: {
    id: number;
    name: string;
  } | null;
  product?: {
    id: number;
    name: string;
  } | null;
  images?: StoreSupportImage[];
  messages?: StoreSupportMessage[];
}

export interface StoreSupportImage {
  id: number;
  ticket_id: number;
  url: string;
  created_at: string;
}

export interface StoreSupportMessage {
  id: number;
  message: string;
  created_at: string;
  sender_type: 'admin' | 'user' | 'store';
  sender_name: string;
  sender_image: string | null;
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

export const supportStatusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

export const supportStatusColors = {
  pending: '#FF9500',
  in_progress: '#007AFF',
  resolved: '#22D883',
  closed: '#8E8E93'
};

// Função principal para buscar vendas da loja
export async function getStoreSales(filters?: SalesFilters): Promise<StoreSale[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return [];
    }

    console.log('Buscando vendas para user_id:', user.id);

    let query = supabase
      .from('view_store_sale')
      .select('*')
      .eq('store_id', user.id);

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.eq('payment_method', filters.paymentMethod);
    }

    if (filters?.dateFrom) {
      query = query.gte('sale_date', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('sale_date', filters.dateTo);
    }

    query = query.order('sale_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar vendas:', error);
      return [];
    }

    console.log('Vendas encontradas:', data?.length || 0);
    let sales = data || [];

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

// Buscar detalhes do frete de uma compra
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

// ============ FUNÇÕES DE SUPORTE ============

async function callSupportEdgeFunction(action: string, payload: any = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuário não autenticado');
  }

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
    console.log('📫 Chamando Support Edge Function:', action);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/support-ticket-service?action=${action}`,
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

// Buscar tickets de suporte para uma venda específica
export async function getStoreTickets(
  purchaseId: string, 
  productId: string
): Promise<StoreSupportTicket[]> {
  try {
    const result = await callSupportEdgeFunction('get-store-tickets', { 
      purchaseId: parseInt(purchaseId),
      productId: parseInt(productId)
    });

    if (result?.success && result?.tickets) {
      return result.tickets;
    }

    console.warn('Edge function retornou success false:', result);
    return [];
  } catch (error) {
    console.error('Erro ao buscar tickets de suporte:', error);
    return [];
  }
}

// Enviar mensagem em um ticket (como loja)
export async function sendStoreTicketMessage(
  ticketId: number,
  message: string
): Promise<{ success: boolean; message?: StoreSupportMessage; error?: string }> {
  try {
    const result = await callSupportEdgeFunction('send-store-message', {
      ticketId,
      message: message.trim()
    });

    if (result?.success && result?.message) {
      return {
        success: true,
        message: result.message
      };
    }

    return {
      success: false,
      error: result?.error || 'Erro ao enviar mensagem'
    };
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado'
    };
  }
}

// Funções auxiliares para formatação
export function formatSupportDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function formatChatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}