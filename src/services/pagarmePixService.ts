import { CartSummary } from './cart';
import { ShippingOption } from './shippingService';
import { UserAddress } from './userAddress';
import { CustomerProfile } from './userProfiles';

export interface PagarmePixRequest {
  customer: {
    address: {
      country: string;
      state: string;
      city: string;
      zip_code: string;
      line_1?: string;
    };
    phones: {
      mobile_phone: {
        country_code: string;
        area_code: string;
        number: string;
      };
    };
    name: string;
    type: string;
    email: string;
    document: string;
    document_type: string;
    gender?: string;
  };
  items: Array<{
    amount: number;
    quantity: number;
    description: string;
    code: string;
  }>;
  payments: Array<{
    Pix: {
      expires_in: number;
    };
    payment_method: string;
    amount: number;
  }>;
}

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
      pix_provider_tid: string;
      qr_code: string;
      qr_code_url: string;
      expires_at: string;
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

export interface CreatePixOrderData {
  cart: CartSummary;
  shippingOption: ShippingOption;
  selectedAddress: UserAddress;
  customerProfile: CustomerProfile;
}

function cleanCPF(cpf: string): string {
  return cpf?.replace(/\D/g, '') || '12345678900';
}

function cleanZipCode(zipCode: string): string {
  return zipCode?.replace(/\D/g, '') || '01000000';
}

export async function createPagarmePixOrder(data: CreatePixOrderData): Promise<PagarmePixResponse | null> {
  try {
    const { cart, shippingOption, selectedAddress, customerProfile } = data;

    // Calcular valor total incluindo frete
    const itemsTotal = cart.totalValue; // em centavos
    const shippingCost = shippingOption.price; // em centavos
    const totalAmount = itemsTotal + shippingCost; // em centavos

    console.log('=== CRIANDO PEDIDO PIX PAGARME ===');
    console.log('Valor dos produtos:', itemsTotal, 'centavos');
    console.log('Valor do frete:', shippingCost, 'centavos');
    console.log('Valor total (incluindo frete):', totalAmount, 'centavos');
    console.log('Valor total em reais:', (totalAmount / 100).toFixed(2));

    // Preparar itens - consolidando tudo em um valor único com frete incluído
    const consolidatedItems = [
      {
        amount: totalAmount, // Valor total já incluindo frete
        quantity: 1,
        description: `Pedido com ${cart.items.length} item(ns) + frete ${shippingOption.name}`,
        code: `order_${Date.now()}`
      }
    ];

    // Telefone mocado conforme solicitado
    const phoneData = {
      country_code: "55",
      area_code: "11", 
      number: "999999999"
    };

    // Preparar dados do cliente
    const customerData = {
      address: {
        country: "BR",
        state: selectedAddress.state || "SP",
        city: selectedAddress.city || "São Paulo",
        zip_code: cleanZipCode(selectedAddress.zipcode),
        line_1: `${selectedAddress.address}, ${selectedAddress.number}${selectedAddress.complement ? ', ' + selectedAddress.complement : ''}`
      },
      phones: {
        mobile_phone: phoneData
      },
      name: customerProfile.name || selectedAddress.recipientName || "Cliente Teste",
      type: "individual",
      email: customerProfile.email || "cliente@exemplo.com",
      document: cleanCPF(customerProfile.document),
      document_type: "CPF",
      gender: "male"
    };

    // Preparar pagamento PIX
    const pixPayment = {
      Pix: {
        expires_in: 600 // 10 minutos
      },
      payment_method: "pix",
      amount: totalAmount // Valor total incluindo frete
    };

    // Montar requisição completa
    const pagarmeRequest: PagarmePixRequest = {
      customer: customerData,
      items: consolidatedItems,
      payments: [pixPayment]
    };

    console.log('=== DADOS ENVIADOS PARA PAGARME ===');
    console.log('Customer:', JSON.stringify(customerData, null, 2));
    console.log('Items:', JSON.stringify(consolidatedItems, null, 2));
    console.log('Payment:', JSON.stringify(pixPayment, null, 2));

    // Buscar API Key do ambiente
    const apiKey = process.env.EXPO_PUBLIC_PAGARME_API_KEY;
    if (!apiKey) {
      console.error('❌ API Key da Pagarme não encontrada nas variáveis de ambiente');
      return null;
    }

    console.log('🔑 Usando API Key:', apiKey.substring(0, 10) + '...');

    // Fazer requisição para Pagarme
    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Basic ${btoa(apiKey + ':')}`
      },
      body: JSON.stringify(pagarmeRequest)
    });

    console.log('=== RESPOSTA HTTP PAGARME ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const responseText = await response.text();
    console.log('=== RESPOSTA RAW PAGARME ===');
    console.log(responseText);

    if (!response.ok) {
      console.error('❌ Erro na requisição Pagarme:', response.status, response.statusText);
      console.error('❌ Detalhes do erro:', responseText);
      return null;
    }

    const pagarmeResponse: PagarmePixResponse = JSON.parse(responseText);

    console.log('=== ✅ PEDIDO PIX CRIADO COM SUCESSO ===');
    console.log('🆔 Order ID:', pagarmeResponse.id);
    console.log('📝 Order Code:', pagarmeResponse.code);
    console.log('💰 Amount:', pagarmeResponse.amount, 'centavos');
    console.log('📊 Status:', pagarmeResponse.status);
    console.log('📅 Created At:', pagarmeResponse.created_at);

    // Verificar se tem dados do PIX (CORRIGIDO)
    if (pagarmeResponse.charges && pagarmeResponse.charges.length > 0) {
      const charge = pagarmeResponse.charges[0];
      console.log('=== DADOS DO CHARGE ===');
      console.log('💳 Charge ID:', charge.id);
      console.log('📊 Charge Status:', charge.status);
      console.log('💰 Charge Amount:', charge.amount);
      console.log('🆔 Gateway ID:', charge.gateway_id);

      if (charge.last_transaction) {
        const transaction = charge.last_transaction;
        console.log('=== 🔥 DADOS PIX GERADO ===');
        console.log('📱 QR Code:', transaction.qr_code);
        console.log('🔗 QR Code URL:', transaction.qr_code_url);
        console.log('⏰ Expires At:', transaction.expires_at);
        console.log('🆔 Transaction ID:', transaction.id);
        console.log('🏦 Provider TID:', transaction.pix_provider_tid);
        console.log('📊 Transaction Status:', transaction.status);
      }
    }

    console.log('=== 📋 RESPOSTA COMPLETA PAGARME ===');
    console.log(JSON.stringify(pagarmeResponse, null, 2));

    return pagarmeResponse;

  } catch (error) {
    console.error('❌ Erro inesperado ao criar pedido PIX:', error);
    return null;
  }
}

function btoa(str: string): string {

  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(str);
  }
  
  return Buffer.from(str).toString('base64');
}