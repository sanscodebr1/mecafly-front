// Edge Function para processar webhooks do Pagarme usando WebhookService
// Esta função é executada no ambiente Deno do Supabase

// Declarações de tipos para evitar erros de TypeScript
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

// Tipos para webhook do Pagarme
interface PagarmeWebhookEvent {
  id: string;
  type: string;
  created_at: string;
  data: {
    id: string;
    status: string;
    affiliation_url?: string;
    [key: string]: any;
  };
}

interface WebhookValidationResult {
  isValid: boolean;
  event?: PagarmeWebhookEvent;
  error?: string;
}

// Classe WebhookService adaptada para Deno
class WebhookService {
  /**
   * Valida a assinatura do webhook do Pagarme usando HMAC-SHA256
   */
  static async validatePagarmeWebhook(
    payload: string,
    signature: string,
    secret: string
  ): Promise<WebhookValidationResult> {
    try {
      // SEGURANÇA: Validar parâmetros obrigatórios
      if (!payload || !signature || !secret) {
        console.error('Parâmetros obrigatórios ausentes para validação HMAC');
        return {
          isValid: false,
          error: 'Missing required parameters for HMAC validation',
        };
      }

      // SEGURANÇA: Validar se a assinatura não está vazia
      if (signature.trim().length === 0) {
        console.error('Assinatura vazia - REJEITANDO webhook');
        return {
          isValid: false,
          error: 'Empty signature',
        };
      }

      // Validar assinatura HMAC-SHA256
      const isValidSignature = await this.validateHMACSignature(payload, signature, secret);
      
      if (!isValidSignature) {
        console.error('Assinatura HMAC inválida');
        return {
          isValid: false,
          error: 'Invalid HMAC signature',
        };
      }

      // Parse do evento
      const event: PagarmeWebhookEvent = JSON.parse(payload);
      
      // Validar estrutura básica do evento
      if (!event.type || !event.data || !event.data.id) {
        return {
          isValid: false,
          error: 'Invalid event structure',
        };
      }
      
      return {
        isValid: true,
        event,
      };
    } catch (error) {
      console.error('Erro ao validar webhook:', error);
      return {
        isValid: false,
        error: 'Invalid webhook payload',
      };
    }
  }

  /**
   * Valida assinatura HMAC-SHA256
   * CRÍTICO: Sempre valida HMAC, nunca aceita webhooks sem validação
   */
  private static async validateHMACSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      // Verificar se crypto.subtle está disponível
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        // Ambiente moderno com crypto.subtle - validação completa
        return await this.validateHMACWithSubtle(payload, signature, secret);
      } else {
        // SEGURANÇA: Rejeitar webhook se não conseguir validar HMAC
        console.error('crypto.subtle não disponível - REJEITANDO webhook por segurança');
        return false; // NUNCA aceitar sem validação HMAC
      }
    } catch (error) {
      console.error('Erro na validação HMAC:', error);
      return false; // Sempre rejeitar em caso de erro
    }
  }

  /**
   * Validação HMAC usando crypto.subtle
   */
  private static async validateHMACWithSubtle(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      
      // Importar chave secreta
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Gerar assinatura HMAC
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
      
      // Converter para hex
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Normalizar assinatura recebida (remover prefixo sha256= se existir)
      const normalizedSignature = signature.replace(/^sha256=/i, '').trim();
      
      // Comparar assinaturas (timing-safe comparison)
      return this.timingSafeEqual(computedSignature, normalizedSignature);
      
    } catch (error) {
      console.error('Erro na validação HMAC com crypto.subtle:', error);
      return false;
    }
  }

  /**
   * Comparação segura contra timing attacks
   */
  private static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Processa webhook do Pagarme
   */
  static async processPagarmeWebhook(event: PagarmeWebhookEvent): Promise<boolean> {
    try {
      console.log('Processando webhook Pagarme:', event);

      // Só processamos eventos de recipient.updated
      if (event.type !== 'recipient.updated') {
        console.log('Tipo de evento não suportado:', event.type);
        return true;
      }

      const recipientId = event.data.id;
      const status = event.data.status;
      const affiliationUrl = event.data.affiliation_url;

      // Mapear status do Pagarme para nosso enum
      let newStatus: 'pending' | 'approved' | 'refused';
      
      switch (status) {
        case 'active':
          newStatus = 'approved';
          break;
        case 'rejected':
        case 'inactive':
          newStatus = 'refused';
          break;
        case 'pending':
        default:
          newStatus = 'pending';
      }

      // Conectar ao Supabase usando fetch direto
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Variáveis de ambiente do Supabase não configuradas');
        return false;
      }

      // Atualizar conta gateway usando fetch direto
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/account_gateway?external_id=eq.${encodeURIComponent(recipientId)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: newStatus,
          affiliation_url: affiliationUrl,
          last_webhook_at: new Date().toISOString(),
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Erro ao atualizar conta gateway:', errorText);
        return false;
      }

      console.log(`Conta gateway ${recipientId} atualizada para status: ${newStatus}`);
      return true;

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return false;
    }
  }

  /**
   * Endpoint para receber webhooks (para usar em Edge Functions do Supabase)
   */
  static async handleWebhookRequest(
    request: Request,
    secret: string
  ): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pagarme-signature',
    };

    try {
      // Lidar com requisições CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
      }

      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
      }

      const payload = await request.text();
      const signature = request.headers.get('x-pagarme-signature') || '';

      console.log('Webhook recebido:', {
        signature: signature.substring(0, 20) + '...',
        payloadLength: payload.length
      });

      // Validar webhook com HMAC
      const validation = await this.validatePagarmeWebhook(payload, signature, secret);
      
      if (!validation.isValid || !validation.event) {
        console.error('Webhook inválido:', validation.error);
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      // Processar webhook
      const success = await this.processPagarmeWebhook(validation.event);
      
      if (!success) {
        console.error('Erro ao processar webhook');
        return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
      }

      console.log('Webhook processado com sucesso');
      return new Response('OK', { status: 200, headers: corsHeaders });

    } catch (error) {
      console.error('Erro no webhook handler:', error);
      return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
    }
  }
}

// Função principal do webhook
async function handleWebhook(req: Request): Promise<Response> {
  const secret = Deno.env.get('PAGARME_WEBHOOK_SECRET');
  
  // SEGURANÇA: Rejeitar se chave secreta não estiver configurada
  if (!secret) {
    console.error('PAGARME_WEBHOOK_SECRET não configurada - REJEITANDO webhook');
    return new Response('Webhook secret not configured', { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pagarme-signature',
      }
    });
  }
  
  return await WebhookService.handleWebhookRequest(req, secret);
}

export default handleWebhook;