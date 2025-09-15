import { supabase } from '../lib/supabaseClient';

// Tipos para webhook do Pagarme
export interface PagarmeWebhookEvent {
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

export interface WebhookValidationResult {
  isValid: boolean;
  event?: PagarmeWebhookEvent;
  error?: string;
}

export class WebhookService {
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

      // Atualizar conta gateway
      console.log(`Atualizando conta gateway ${recipientId} para status: ${newStatus}`);
      const { error } = await supabase
        .from('account_gateway')
        .update({
          status: newStatus,
          affiliation_url: affiliationUrl,
          last_webhook_at: new Date().toISOString(),
        })
        .eq('external_id', recipientId);

      if (error) {
        console.error('Erro ao atualizar conta gateway:', error);
        return false;
      }

      console.log(`Conta gateway ${recipientId} atualizada para status: ${newStatus}`);
      
      // KYC aprovado - usuário agora pode vender (produtos continuam pending para aprovação do admin)
      if (newStatus === 'approved') {
        console.log('Usuário aprovado no KYC - produtos continuam pending para aprovação do admin');
      }
      
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

  /**
   * Simular webhook para testes
   */
  static async simulateWebhook(
    recipientId: string,
    status: 'active' | 'inactive' | 'rejected' | 'pending',
    affiliationUrl?: string
  ): Promise<boolean> {
    const mockEvent: PagarmeWebhookEvent = {
      id: `evt_${Date.now()}`,
      type: 'recipient.updated',
      created_at: new Date().toISOString(),
      data: {
        id: recipientId,
        status,
        affiliation_url: affiliationUrl,
      },
    };

    return await this.processPagarmeWebhook(mockEvent);
  }

  /**
   * Simular webhook completo para um usuário específico
   */
  static async simulateUserWebhook(
    userId: string,
    status: 'active' | 'inactive' | 'rejected' | 'pending',
    affiliationUrl?: string
  ): Promise<boolean> {
    try {
      // Buscar recipient_id do usuário
      const { data: accountGateway, error } = await supabase
        .from('account_gateway')
        .select('external_id')
        .eq('user_id', userId)
        .single();

      if (error || !accountGateway) {
        console.error('Usuário não tem conta gateway configurada:', error);
        return false;
      }

      return await this.simulateWebhook(accountGateway.external_id, status, affiliationUrl);
    } catch (error) {
      console.error('Erro ao simular webhook do usuário:', error);
      return false;
    }
  }

  /**
   * Testar fluxo completo de KYC para um usuário
   */
  static async testKycFlow(userId: string): Promise<{
    success: boolean;
    steps: string[];
    errors: string[];
  }> {
    const steps: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Verificar se usuário tem conta gateway
      steps.push('1. Verificando conta gateway...');
      const { data: accountGateway, error } = await supabase
        .from('account_gateway')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !accountGateway) {
        errors.push('Usuário não tem conta gateway configurada');
        return { success: false, steps, errors };
      }

      steps.push(`Conta gateway encontrada: ${accountGateway.external_id}`);

      // Step 2: Simular status "pending"
      steps.push('2. Simulando status "pending"...');
      const pendingResult = await this.simulateUserWebhook(userId, 'pending');
      if (!pendingResult) {
        errors.push('Falha ao simular status pending');
        return { success: false, steps, errors };
      }
      steps.push('Status "pending" aplicado');

      // Step 3: Simular status "approved"
      steps.push('3. Simulando aprovação KYC...');
      const approvedResult = await this.simulateUserWebhook(userId, 'active', 'https://kyc.pagarme.com/test-link');
      if (!approvedResult) {
        errors.push('Falha ao simular aprovação');
        return { success: false, steps, errors };
      }
      steps.push('Status "approved" aplicado');

      // Step 4: Verificar se produtos foram publicados
      steps.push('4. Verificando publicação de produtos...');
      const { data: storeProfile } = await supabase
        .from('store_profile')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (storeProfile) {
        const { data: draftProducts } = await supabase
          .from('product')
          .select('id, status')
          .eq('store_id', storeProfile.id)
          .eq('status', 'draft');

        const { data: pendingProducts } = await supabase
          .from('product')
          .select('id, status')
          .eq('store_id', storeProfile.id)
          .eq('status', 'pending');

        steps.push(`Produtos em rascunho: ${draftProducts?.length || 0}`);
        steps.push(`Produtos pendentes: ${pendingProducts?.length || 0}`);
      }

      steps.push('Fluxo de KYC testado com sucesso!');
      return { success: true, steps, errors };

    } catch (error) {
      errors.push(`Erro inesperado: ${error}`);
      return { success: false, steps, errors };
    }
  }

  /**
   * Buscar logs de webhook para debug
   */
  static async getWebhookLogs(recipientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('account_gateway')
        .select('*')
        .eq('external_id', recipientId)
        .order('last_webhook_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs de webhook:', error);
      return [];
    }
  }
}

// Função para usar em Edge Functions do Supabase
export async function handlePagarmeWebhook(request: Request): Promise<Response> {
  const secret = process.env.PAGARME_WEBHOOK_SECRET;
  
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
  
  return await WebhookService.handleWebhookRequest(request, secret);
}
