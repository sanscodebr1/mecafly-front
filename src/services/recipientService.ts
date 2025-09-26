// services/walletService.ts
import { supabase } from '../lib/supabaseClient';

export interface WalletBalance {
  available: number;
  pending: number;
  transferred: number;
  currency: string;
}

export interface Transfer {
  id: number;
  amount: number;
  type: string;
  status: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  fee: number;
  funding_date: string;
  funding_estimated_date: string;
  transaction_id: string;
  date_created: string;
  bank_response: string;
  bank_account: any;
  metadata: any;
}

export interface TransfersListResponse {
  success: boolean;
  transfers?: Transfer[];
  nextCursor?: string;
  previousCursor?: string;
  error?: string;
}

// Função auxiliar para chamar a edge function
async function callWalletEdgeFunction(action: string, payload: any = {}) {
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
  }

  try {
    console.log('💰 Chamando Wallet Edge Function:', action);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/recipient-account?action=${action}`,
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

// Buscar saldo da carteira
export async function getWalletBalance(): Promise<{
  success: boolean;
  balance?: WalletBalance;
  needsAccount?: boolean;
  error?: string;
}> {
  try {
    const result = await callWalletEdgeFunction('get_balance');
    return result;
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Criar transferência (saque)
export async function createTransfer(amount: number): Promise<{
  success: boolean;
  transfer?: any;
  error?: string;
}> {
  try {
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: 'Valor inválido para saque'
      };
    }

    const result = await callWalletEdgeFunction('create_transfer', { amount });
    return result;
  } catch (error) {
    console.error('Erro ao criar transferência:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Listar transferências
export async function listTransfers(
  count: number = 20,
  cursor?: string
): Promise<TransfersListResponse> {
  try {
    let url = `${supabase.supabaseUrl}/functions/v1/recipient-account?action=list_transfers&count=${count}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2lvdmtlZXpmaGF2ZmlzYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDM1NjAsImV4cCI6MjA3MTcxOTU2MH0.Ne_L8SZJn5Lg3_DY1i_2RVHABGLlQrcma7JkW3TkNgc',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao listar transferências:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Formatar valores em centavos para real
export function formatCurrency(valueInCents: number): string {
  return `R$ ${(valueInCents / 100).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
}

// Status traduzidos
export const transferStatusLabels: Record<string, string> = {
  'pending': 'Pendente',
  'processing': 'Processando',
  'transferred': 'Transferido',
  'failed': 'Falhou',
  'canceled': 'Cancelado'
};

// Cores dos status
export const transferStatusColors: Record<string, string> = {
  'pending': '#FFA500',
  'processing': '#007AFF',
  'transferred': '#22D883',
  'failed': '#FF3B30',
  'canceled': '#999999'
};