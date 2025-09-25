import { supabase } from '../lib/supabaseClient';
import { CartSummary } from './cart';
import { UserAddress } from './userAddress';

export interface ShippingOption {
  id: string;
  name: string;
  company: string;
  price: number;
  priceFormatted: string;
  deadline: string;
  deliveryRange: {
    min: number;
    max: number;
  };
  error?: string;
  serviceId: number;
}

export interface StoreShippingGroup {
  storeId: string;
  storeName: string;
  storeAddress: any;
  items: any[];
  shippingOptions: ShippingOption[];
  packageData: PackageData;
  hasError?: boolean;
  errorMessage?: string;
}

interface PackageData {
  height: number;
  width: number;
  length: number;
  weight: number;
  insuranceValue: number;
}

export interface PurchaseShipmentData {
  purchase_id: number;
  product_id: number;
  carrier: string;
  status: string;
  tracking_code?: string;
  shipping_fee: number;
  label_url?: string;
  external_shipment_id: string;
  external_service_id: string;
  external_protocol: string;
}

export interface ShipmentTrackingData {
  id: string;
  protocol: string;
  status: string;
  tracking: string | null;
  melhorenvio_tracking: string;
  created_at: string;
  paid_at: string | null;
  generated_at: string | null;
  posted_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
  expired_at: string | null;
}

export interface ShipmentTrackingResponse {
  [key: string]: ShipmentTrackingData;
}

export interface ProductShipmentInfo {
  product_id: number;
  product_name: string;
  external_shipment_id: string;
  carrier: string;
  status: string;
  tracking_code?: string;
  label_url?: string;
  external_protocol: string;
  shipping_fee: number;
  tracking_data?: ShipmentTrackingData;
}

async function callShippingEdgeFunction(action: string, payload: any) {
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
    console.log('🚀 Chamando Edge Function:', action);
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));
    console.log('🔑 Token (primeiros 20 chars):', session.access_token.substring(0, 20) + '...');
    
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/calculate-shipping?action=${action}`,
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

// Função principal para calcular frete
export async function calculateShipping(
  destinationAddress: UserAddress,
  cartData: CartSummary
): Promise<StoreShippingGroup[]> {
  try {
    console.log('Calculando frete para:', { destinationAddress, cartData });
    
    const result = await callShippingEdgeFunction('calculate', {
      destinationAddress,
      cartData
    });

    console.log('Resultado do cálculo de frete:', result);

    if (result?.success) {
      return result.storeGroups || [];
    }

    console.warn('Edge function retornou success false:', result);
    return [];
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    return [];
  }
}

// Função para adicionar ao carrinho do Melhor Envio
export async function addToMelhorEnvioCart(
  storeGroups: StoreShippingGroup[],
  selectedShippingOptions: Record<string, ShippingOption>,
  destinationAddress: UserAddress,
  purchaseId?: number
): Promise<{ success: boolean; cartIds?: string[]; error?: string; shipmentRecords?: PurchaseShipmentData[] }> {
  try {
    const result = await callShippingEdgeFunction('add-to-cart', {
      storeGroups,
      selectedShippingOptions,
      destinationAddress,
      purchaseId
    });

    return result || { success: false, error: 'Resposta inválida' };
  } catch (error) {
    console.error('Erro ao adicionar no carrinho Melhor Envio:', error);
    return { success: false, error: String(error) };
  }
}

// Função para solicitar geração de etiqueta
export async function requestShipmentGeneration(externalShipmentId: string): Promise<{ success: boolean; message?: string; needsGeneration?: boolean; error?: string }> {
  try {
    const result = await callShippingEdgeFunction('request-generation', {
      externalShipmentId
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: `Erro inesperado: ${error}`
    };
  }
}

// Função para gerar etiqueta de envio
export async function generateShippingLabel(externalShipmentId: string): Promise<{ success: boolean; pdfUrl?: string; error?: string; needsGeneration?: boolean }> {
  try {
    const result = await callShippingEdgeFunction('generate-label', {
      externalShipmentId
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: `Erro inesperado: ${error}`
    };
  }
}

// Função para rastrear envios
export async function getShipmentTracking(externalShipmentIds: string[]): Promise<{
  success: boolean;
  data?: ShipmentTrackingResponse;
  error?: string;
}> {
  try {
    const result = await callShippingEdgeFunction('track-shipments', {
      externalShipmentIds
    });

    return result;
  } catch (error) {
    return { success: false, error: `Erro inesperado: ${error}` };
  }
}

// Função para buscar detalhes dos envios de uma compra
export async function getPurchaseShipmentDetails(purchaseId: number): Promise<{
  success: boolean;
  data?: ProductShipmentInfo[];
  error?: string;
}> {
  try {
    const result = await callShippingEdgeFunction('get-purchase-shipments', {
      purchaseId
    });

    return result;
  } catch (error) {
    return { success: false, error: `Erro inesperado: ${error}` };
  }
}

// Função para buscar envios com dados de rastreamento
export async function getPurchaseShipmentsWithTracking(purchaseId: number): Promise<{
  success: boolean;
  data?: ProductShipmentInfo[];
  error?: string;
}> {
  try {
    const result = await callShippingEdgeFunction('get-purchase-shipments-with-tracking', {
      purchaseId
    });

    return result;
  } catch (error) {
    return { success: false, error: `Erro inesperado: ${error}` };
  }
}

// NOVA FUNÇÃO: Pagar etiquetas de uma compra (aceitar venda)
export async function payShippingLabelsForPurchase(purchaseId: number): Promise<{
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}> {
  try {
    console.log('💰 Pagando etiquetas para purchase:', purchaseId);
    
    const result = await callShippingEdgeFunction('pay-shipping-labels', {
      purchaseId
    });

    return result;
  } catch (error) {
    console.error('Erro ao pagar etiquetas:', error);
    return { success: false, error: `Erro inesperado: ${error}` };
  }
}

// Funções de formatação e utilitários (sem API calls)
export function formatShippingPrice(priceInCents: number): string {
  return `R$ ${(priceInCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'posted': 'Postado',
    'delivered': 'Entregue',
    'canceled': 'Cancelado',
    'expired': 'Expirado',
    'pending': 'Pendente',
    'paid': 'Confirmado',
    'generated': 'Etiqueta Gerada'
  };

  return statusMap[status] || status;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'posted': '#007AFF',
    'delivered': '#22D883',
    'canceled': '#FF3B30',
    'expired': '#FF9500',
    'pending': '#8E8E93',
    'paid': '#34C759',
    'generated': '#5856D6'
  };

  return colorMap[status] || '#8E8E93';
}

export function formatTrackingDate(dateString: string | null): string {
  if (!dateString) return '--';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  } catch {
    return '--';
  }
}