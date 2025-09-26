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
  isStorePickup?: boolean;
}

export interface StoreAddress {
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  complement?: string;
  phone?: string;
  email?: string;
}

export interface StoreShippingGroup {
  storeId: string;
  storeName: string;
  storeAddress: StoreAddress;
  items: any[];
  shippingOptions: ShippingOption[];
  packageData: PackageData;
  hasError?: boolean;
  errorMessage?: string;
  allowsStorePickup?: boolean;
  storePickupAddress?: StoreAddress;
}

interface PackageData {
  height: number;
  width: number;
  length: number;
  weight: number;
  insuranceValue: number;
}

export type DeliveryType = 'shipping' | 'store_pickup';

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
  type: DeliveryType;
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
  type: DeliveryType;
}

async function callShippingEdgeFunction(action: string, payload: any) {
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao chamar edge function:', error);
    throw new Error(`Erro inesperado: ${error instanceof Error ? error.message : error}`);
  }
}

export function createStorePickupOption(storeName: string): ShippingOption {
  return {
    id: 'store_pickup',
    name: 'Retirada na Loja',
    company: storeName,
    price: 0,
    priceFormatted: 'GRÁTIS',
    deadline: 'Disponível para retirada após confirmação do pedido',
    deliveryRange: {
      min: 0,
      max: 0
    },
    serviceId: 0,
    isStorePickup: true
  };
}

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

    if (result?.success) {
      const storeGroups = result.storeGroups || [];
      
      const storeGroupsWithPickup = storeGroups.map((group: StoreShippingGroup) => {
        
        return {
          ...group,
          allowsStorePickup: true,
          shippingOptions: [...group.shippingOptions],
          storePickupAddress: group.storeAddress
        };
      });
      
      return storeGroupsWithPickup;
    }

    return [];
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    return [];
  }
}
export async function confirmStoreDeliveryAndUpdateSaleWithCode(
  purchaseId: number, 
  productId: number,
  saleId: string,
  confirmationCode: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const result = await callShippingEdgeFunction('confirm-store-delivery-with-code', {
      purchaseId,
      productId,
      saleId,
      confirmationCode
    });

    return result;
  } catch (error) {
    console.error('Erro ao confirmar entrega com código:', error);
    return { success: false, error: String(error) };
  }
}
export async function createStorePickupRecords(
  storeGroups: StoreShippingGroup[],
  selectedShippingOptions: Record<string, ShippingOption>,
  purchaseId: number
): Promise<{ success: boolean; records?: PurchaseShipmentData[]; error?: string }> {
  try {
    const result = await callShippingEdgeFunction('create-store-pickup-records', {
      storeGroups,
      selectedShippingOptions,
      purchaseId
    });

    return result;
  } catch (error) {
    console.error('Erro ao criar registros de retirada na loja:', error);
    return { success: false, error: String(error) };
  }
}

export async function addToMelhorEnvioCart(
  storeGroups: StoreShippingGroup[],
  selectedShippingOptions: Record<string, ShippingOption>,
  destinationAddress: UserAddress,
  purchaseId?: number
): Promise<{ 
  success: boolean; 
  cartIds?: string[]; 
  error?: string; 
  shipmentRecords?: PurchaseShipmentData[];
  pickupRecords?: PurchaseShipmentData[];
}> {
  try {
    const shippingGroups: StoreShippingGroup[] = [];
    const pickupGroups: StoreShippingGroup[] = [];
    const shippingOptions: Record<string, ShippingOption> = {};
    const pickupOptions: Record<string, ShippingOption> = {};
    
    for (const group of storeGroups) {
      const selectedOption = selectedShippingOptions[group.storeId];
      
      if (selectedOption?.isStorePickup) {
        pickupGroups.push(group);
        pickupOptions[group.storeId] = selectedOption;
      } else if (selectedOption) {
        shippingGroups.push(group);
        shippingOptions[group.storeId] = selectedOption;
      }
    }
    
    let melhorEnvioResult = { success: true, cartIds: [], shipmentRecords: [] };
    let pickupResult = { success: true, records: [] };
    
    if (pickupGroups.length > 0 && purchaseId) {
      pickupResult = await createStorePickupRecords(
        pickupGroups, 
        pickupOptions, 
        purchaseId
      );
      
      if (!pickupResult.success) {
        return { 
          success: false, 
          error: `Erro ao criar registros de retirada: ${pickupResult.error}` 
        };
      }
    }
    
    if (shippingGroups.length > 0) {
      melhorEnvioResult = await callShippingEdgeFunction('add-to-cart', {
        storeGroups: shippingGroups,
        selectedShippingOptions: shippingOptions,
        destinationAddress,
        purchaseId
      });
      
      if (!melhorEnvioResult.success) {
        return { 
          success: false, 
          error: melhorEnvioResult.error || 'Erro ao processar envios' 
        };
      }
    }
    
    return {
      success: true,
      cartIds: melhorEnvioResult.cartIds || [],
      shipmentRecords: melhorEnvioResult.shipmentRecords || [],
      pickupRecords: pickupResult.records || []
    };
    
  } catch (error) {
    console.error('Erro ao processar envios e retiradas:', error);
    return { success: false, error: String(error) };
  }
}

// Nova função para buscar envios com informações da loja
export async function getPurchaseShipmentsWithStoreInfo(purchaseId: number): Promise<{
  success: boolean;
  data?: (ProductShipmentInfo & { storeAddress?: StoreAddress })[];
  error?: string;
}> {
  try {
    const result = await callShippingEdgeFunction('get-purchase-shipments-with-store-info', {
      purchaseId
    });

    return result;
  } catch (error) {
    return { success: false, error: `Erro inesperado: ${error}` };
  }
}

// Função para confirmar retirada na loja
export async function confirmStorePickup(
  purchaseId: number, 
  productId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callShippingEdgeFunction('confirm-store-pickup', {
      purchaseId,
      productId
    });

    return result;
  } catch (error) {
    console.error('Erro ao confirmar retirada:', error);
    return { success: false, error: String(error) };
  }
}

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

export async function confirmStorePickupDelivery(
  purchaseId: number, 
  productId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callShippingEdgeFunction('confirm-store-pickup-delivery', {
      purchaseId,
      productId
    });

    return result;
  } catch (error) {
    console.error('Erro ao confirmar entrega:', error);
    return { success: false, error: String(error) };
  }
}

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
export async function payShippingLabelsForSale(saleId: string): Promise<{
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  paidLabels?: string[];
  saleId?: string;
  productId?: number;
}> {
  try {
    const result = await callShippingEdgeFunction('pay-sale-shipping-labels', {
      saleId
    });

    return result;
  } catch (error) {
    console.error('Erro ao pagar etiquetas da venda:', error);
    return { success: false, error: `Erro inesperado: ${error}` };
  }
}

export async function payShippingLabelsForPurchase(purchaseId: number): Promise<{
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}> {
  try {
    const result = await callShippingEdgeFunction('pay-shipping-labels', {
      purchaseId
    });

    return result;
  } catch (error) {
    console.error('Erro ao pagar etiquetas:', error);
    return { success: false, error: `Erro inesperado: ${error}` };
  }
}

export async function updateStorePickupStatus(
  purchaseId: number, 
  productId: number, 
  newStatus: 'awaiting_pickup' | 'ready_for_pickup' | 'picked_up'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('purchase_shipment')
      .update({ 
        status: newStatus,
        ...(newStatus === 'picked_up' && { delivered_at: new Date().toISOString() })
      })
      .eq('purchase_id', purchaseId)
      .eq('product_id', productId)
      .eq('type', 'store_pickup');

    if (error) {
      console.error('Erro ao atualizar status de retirada:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status de retirada:', error);
    return { success: false, error: String(error) };
  }
}

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
    'generated': 'Etiqueta Gerada',
    'awaiting_pickup': 'Aguardando confirmação da loja',
    'ready_for_pickup': 'Pronto para Retirada',
    'picked_up': 'Retirado'
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
    'generated': '#5856D6',
    'awaiting_pickup': '#FF9500',
    'ready_for_pickup': '#007AFF',
    'picked_up': '#22D883'
  };

  return colorMap[status] || '#8E8E93';
}

export async function confirmStoreDeliveryAndUpdateSale(
  purchaseId: number, 
  productId: number,
  saleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callShippingEdgeFunction('confirm-store-delivery-and-update-sale', {
      purchaseId,
      productId,
      saleId
    });

    return result;
  } catch (error) {
    console.error('Erro ao confirmar entrega e atualizar venda:', error);
    return { success: false, error: String(error) };
  }
}

export async function confirmClientStorePickup(
  purchaseId: number, 
  productId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callShippingEdgeFunction('confirm-client-store-pickup', {
      purchaseId,
      productId
    });

    return result;
  } catch (error) {
    console.error('Erro ao confirmar retirada pelo cliente:', error);
    return { success: false, error: String(error) };
  }
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