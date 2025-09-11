// services/shippingService.ts
import { supabase } from '../lib/supabaseClient';
import { CartSummary } from './cart';
import { UserAddress } from './userAddress';
import { getStoreAddress } from './storeAddress';

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
}

export interface ShippingRequest {
  from: {
    postal_code: string;
  };
  to: {
    postal_code: string;
  };
  package: {
    height: number;
    width: number;
    length: number;
    weight: number;
  };
  options: {
    insurance_value: number;
    receipt: boolean;
    own_hand: boolean;
  };
  services: string;
}

interface PackageData {
  height: number;
  width: number;
  length: number;
  weight: number;
  insuranceValue: number;
}

// Configurações da API
const MELHOR_ENVIO_CONFIG = {
  baseURL: 'https://sandbox.melhorenvio.com.br/api/v2',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiI2NDA2YjY3ODQyMmEyMzRhYjM4NDg1OWJlMzA5OGViYTc3YmI2NjYyMGRjZTM3ZDgzOGRiOGMxYjc4OTM0ODBjZTY0YzVkY2UwYTRmZjE3MCIsImlhdCI6MTc1NzUzMjcwOS4xNDYxODYsIm5iZiI6MTc1NzUzMjcwOS4xNDYxODksImV4cCI6MTc4OTA2ODcwOS4xMzk1MzYsInN1YiI6IjlmZDhiYjU0LTlmZjktNGFjNS04ZjA2LWMzMzAwZjA2MTQ2YyIsInNjb3BlcyI6WyJjYXJ0LXJlYWQiLCJjYXJ0LXdyaXRlIiwiY29tcGFuaWVzLXJlYWQiLCJjb21wYW5pZXMtd3JpdGUiLCJjb3Vwb25zLXJlYWQiLCJjb3Vwb25zLXdyaXRlIiwibm90aWZpY2F0aW9ucy1yZWFkIiwib3JkZXJzLXJlYWQiLCJwcm9kdWN0cy1yZWFkIiwicHJvZHVjdHMtZGVzdHJveSIsInByb2R1Y3RzLXdyaXRlIiwicHVyY2hhc2VzLXJlYWQiLCJzaGlwcGluZy1jYWxjdWxhdGUiLCJzaGlwcGluZy1jYW5jZWwiLCJzaGlwcGluZy1jaGVja291dCIsInNoaXBwaW5nLWNvbXBhbmllcyIsInNoaXBwaW5nLWdlbmVyYXRlIiwic2hpcHBpbmctcHJldmlldyIsInNoaXBwaW5nLXByaW50Iiwic2hpcHBpbmctc2hhcmUiLCJzaGlwcGluZy10cmFja2luZyIsImVjb21tZXJjZS1zaGlwcGluZyIsInRyYW5zYWN0aW9ucy1yZWFkIiwidXNlcnMtcmVhZCIsInVzZXJzLXdyaXRlIiwid2ViaG9va3MtcmVhZCIsIndlYmhvb2tzLXdyaXRlIiwid2ViaG9va3MtZGVsZXRlIiwidGRlYWxlci13ZWJob29rIl19.MwVJFoowf29YDeJDX1MW1J6PqV-KChFo6QM-KhFOCnHtpv4sGaeYglMLjL2uGVMnvvchUfVQ5MeBqAUph0trezgJd9wN9TrRmJ94DWgyJqSr8ZHll4GNUBeid-qagDCgZ_G8dNfMl6sjc6h8RQFjGeRWYcKaa-yUPFXX9hV0KetcOYNaDiJHhE_jIvUi3XA0bL8NtjfND0xEb-AIDTyBc-tF_bRnfYpc3z_M0J13tm2Id9M9rgzGjqKhcgfXmpUm-s8OZ95zhpL1TYllZvrcFd3bk3JHWumW2OIhNqfBVNOB7_H0ifM-Lc8R7weIv5GhIONVsjvt5jiAQ3jOtCXQil9kmy9I29XDTNydRJ1eKfZwbsEJdR3vylrCVjuX-SUb2BqFnLECw1aoBwXt9CrKiqGsS_RfkW3iHyYlWsEiDtw2rFSweBvAH0oPPTbaWHlXEe9tQ1y7MSZLRxPGechzk5Gi17odxDVEBCjf4D_an0yJR8FNaQDV6pfhYRY6C4_rFWb-Rz7Fz4A2-hSVwpdPzJAwJnuoe_qtrZcKL98tmrSthEY0YlyAIhxKPTLOwM375f4DbanfHUIgJ-fjaorapTYbWJLn4mFRcK6AmUa8bCkY7lJgxpEKgLsIcS_jp_TrZDKZT8PFqnlK7qreAgHUHMQAZuLCEO41GdhZHSyXkr0', // Substitua pelo token real
  userAgent: 'Mercafly (guimaraesdev013@gmail.com)' // Substitua pelo seu app e email
};

// Função para calcular dados do pacote baseado no carrinho
export async function calculatePackageData(cartData: CartSummary): Promise<PackageData> {
  let totalWeight = 0;
  let totalValue = 0;
  let maxHeight = 0;
  let totalWidth = 0;
  let totalLength = 0;

  try {
    console.log('=== CALCULANDO DADOS DO PACOTE ===');
    console.log(`Processando ${cartData.items.length} tipos de produtos no carrinho`);

    // Buscar dados reais dos produtos no banco
    for (const item of cartData.items) {
      console.log(`Buscando dados do produto ID: ${item.productId}`);
      
      const { data: productData, error } = await supabase
        .from('vw_product_detail')
        .select('height, width, length, weight, declared_value, product_name')
        .eq('product_id', item.productId)
        .single();

      if (error) {
        console.error(`Erro ao buscar dados do produto ${item.productId}:`, error);
        // Usar valores padrão se não conseguir buscar
        totalWeight += 0.5 * item.quantity;
        maxHeight = Math.max(maxHeight, 10);
        totalWidth += 15 * item.quantity;
        totalLength = Math.max(totalLength, 20);
        continue;
      }

      const quantity = item.quantity;
      
      // Usar dados reais do banco (garantindo que sejam números válidos)
      const productWeight = productData.weight ? Number(productData.weight) : 0.5; // em kg
      const productHeight = productData.height ? Number(productData.height) : 10; // em cm
      const productWidth = productData.width ? Number(productData.width) : 15; // em cm
      const productLength = productData.length ? Number(productData.length) : 20; // em cm
      
      console.log(`Produto: ${productData.product_name}`);
      console.log(`- Quantidade: ${quantity}`);
      console.log(`- Peso unitário: ${productWeight}kg`);
      console.log(`- Dimensões: ${productHeight}x${productWidth}x${productLength}cm`);
      
      totalWeight += productWeight * quantity;
      
      // Para dimensões, considerar empilhamento/agrupamento inteligente
      maxHeight = Math.max(maxHeight, productHeight);
      totalWidth += productWidth * quantity; // Colocar lado a lado
      totalLength = Math.max(totalLength, productLength);
    }

    // Calcular valor total para seguro
    totalValue = parseFloat(
      cartData.totalValueFormatted
        .replace('R$ ', '')
        .replace(/\./g, '') // Remove pontos de milhares
        .replace(',', '.') // Converte vírgula decimal para ponto
    );

  } catch (error) {
    console.error('Erro ao calcular dados do pacote:', error);
    // Usar valores padrão em caso de erro
    totalWeight = cartData.items.reduce((sum, item) => sum + (0.5 * item.quantity), 0);
    totalValue = parseFloat(cartData.totalValueFormatted.replace('R$ ', '').replace('.', '').replace(',', '.'));
    maxHeight = 10;
    totalWidth = 15 * cartData.totalItems;
    totalLength = 20;
  }

  // Ajustar para limites mínimos e máximos dos Correios
  const finalHeight = Math.max(Math.min(Math.ceil(maxHeight), 105), 1); // máx 105cm
  const finalWidth = Math.max(Math.min(Math.ceil(totalWidth), 105), 1); // máx 105cm  
  const finalLength = Math.max(Math.min(Math.ceil(totalLength), 105), 1); // máx 105cm
  const finalWeight = Math.max(Math.min(totalWeight, 30), 0.1); // máx 30kg, mín 100g

  console.log('=== DADOS FINAIS DO PACOTE ===');
  console.log(`Peso total: ${finalWeight}kg`);
  console.log(`Dimensões (A x L x C): ${finalHeight} x ${finalWidth} x ${finalLength} cm`);
  console.log(`Valor declarado: R$ ${totalValue.toFixed(2)}`);

  return {
    height: finalHeight,
    width: finalWidth,
    length: finalLength,
    weight: finalWeight,
    insuranceValue: totalValue
  };
}

// Função para fazer requisição à API do Melhor Envio
export async function calculateShippingRates(
  fromCep: string,
  toCep: string,
  packageData: PackageData
): Promise<ShippingOption[]> {
  try {
    console.log('=== FAZENDO REQUISIÇÃO PARA API DO MELHOR ENVIO ===');
    
    const shippingRequest: ShippingRequest = {
      from: {
        postal_code: fromCep.replace(/\D/g, '') 
      },
      to: {
        postal_code: toCep.replace(/\D/g, '')
      },
      package: {
        height: packageData.height,
        width: packageData.width,
        length: packageData.length,
        weight: packageData.weight
      },
      options: {
        insurance_value: packageData.insuranceValue,
        receipt: false,
        own_hand: false
      },
      services: "1,2,3,4,7,11"
    };

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MELHOR_ENVIO_CONFIG.token}`,
      'User-Agent': MELHOR_ENVIO_CONFIG.userAgent
    };

    console.log('URL:', `${MELHOR_ENVIO_CONFIG.baseURL}/me/shipment/calculate`);
    console.log('Headers:', headers);
    console.log('Body:', JSON.stringify(shippingRequest, null, 2));

    const response = await fetch(`${MELHOR_ENVIO_CONFIG.baseURL}/me/shipment/calculate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(shippingRequest)
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('=== RESPOSTA DA API ===');
    console.log(JSON.stringify(result, null, 2));

    // Processar resposta e converter para formato da interface
    const shippingOptions: ShippingOption[] = result
      .filter((service: any) => !service.error) // Filtrar apenas serviços sem erro
      .map((service: any) => ({
        id: service.id.toString(),
        name: service.name,
        company: service.company?.name || 'Transportadora',
        price: Math.round(parseFloat(service.price) * 100), // Converter para centavos
        priceFormatted: `R$ ${parseFloat(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        deadline: `${service.delivery_time} dias úteis`,
        deliveryRange: {
          min: service.delivery_range?.min || service.delivery_time,
          max: service.delivery_range?.max || service.delivery_time
        }
      }));

    console.log('=== OPÇÕES PROCESSADAS ===');
    console.log(shippingOptions);

    // Se não há opções válidas, incluir opções com erro para mostrar na tela
    if (shippingOptions.length === 0) {
      const errorOptions: ShippingOption[] = result
        .filter((service: any) => service.error)
        .map((service: any) => ({
          id: service.id.toString(),
          name: service.name,
          company: service.company?.name || 'Transportadora',
          price: 0,
          priceFormatted: 'Indisponível',
          deadline: 'Serviço indisponível',
          deliveryRange: { min: 0, max: 0 },
          error: service.error
        }));

      console.log('=== OPÇÕES COM ERRO ===');
      console.log(errorOptions);
      
      return errorOptions;
    }

    return shippingOptions;

  } catch (error) {
    console.error('Erro na requisição de frete:', error);
    
    // Retornar opções mock em caso de erro (para desenvolvimento)
    return [
      {
        id: 'mock_pac',
        name: 'PAC',
        company: 'Correios',
        price: 1500, // R$ 15,00 em centavos
        priceFormatted: 'R$ 15,00',
        deadline: '5-7 dias úteis',
        deliveryRange: { min: 5, max: 7 },
        error: `Erro na API: ${error}`
      },
      {
        id: 'mock_sedex',
        name: 'SEDEX',
        company: 'Correios', 
        price: 2500, // R$ 25,00 em centavos
        priceFormatted: 'R$ 25,00',
        deadline: '2-3 dias úteis',
        deliveryRange: { min: 2, max: 3 },
        error: `Erro na API: ${error}`
      }
    ];
  }
}

// Função principal para calcular frete completo
export async function calculateShipping(
  destinationAddress: UserAddress,
  cartData: CartSummary
): Promise<ShippingOption[]> {
  try {
    console.log('=== INICIANDO CÁLCULO DE FRETE ===');
    
    // Buscar endereço de origem (loja)
    const storeAddress = await getStoreAddress();
    if (!storeAddress) {
      throw new Error('Endereço da loja não encontrado');
    }

    // Calcular dados do pacote
    const packageData = await calculatePackageData(cartData);

    // Preparar CEPs
    const fromCep = storeAddress.zipcode || '';
    const toCep = destinationAddress.zipcode || '';

    console.log('=== ENDEREÇOS ===');
    console.log('Origem (loja):', {
      cep: fromCep,
      endereco: `${storeAddress.address}, ${storeAddress.number}`,
      cidade: `${storeAddress.city} - ${storeAddress.state}`
    });
    console.log('Destino:', {
      cep: toCep,
      endereco: `${destinationAddress.address}, ${destinationAddress.number}`,
      cidade: `${destinationAddress.city} - ${destinationAddress.state}`
    });

    // Calcular frete
    const shippingOptions = await calculateShippingRates(fromCep, toCep, packageData);
    
    return shippingOptions;

  } catch (error) {
    console.error('Erro no cálculo de frete:', error);
    return [{
      id: 'error',
      name: 'Erro no cálculo',
      company: 'Sistema',
      price: 0,
      priceFormatted: 'R$ 0,00',
      deadline: 'Indisponível',
      deliveryRange: { min: 0, max: 0 },
      error: `Não foi possível calcular o frete: ${error}`
    }];
  }
}

// Função utilitária para formatar preço
export function formatShippingPrice(priceInCents: number): string {
  return `R$ ${(priceInCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}