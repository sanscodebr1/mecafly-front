import { supabase } from '../lib/supabaseClient';
import { uploadFileToSupabase } from './fileUpload';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============ INTERFACES COMPARTILHADAS ============

export interface SupportCategory {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketImage {
  id: number;
  ticket_id: number;
  url: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  message: string;
  created_at: string;
  sender_type: 'admin' | 'user' | 'store';
  sender_name: string;
  sender_image: string | null;
  media_url?: string | null;
}

export interface ProductInfo {
  id: number;
  name: string;
}

export interface SupportTicket {
  id: number;
  purchase_id: number;
  product_id: number | null;
  category_id: number | null;
  custom_category: string | null;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  user_id: string;
  allow_user_messages: boolean;
  allow_store_messages: boolean;
  support_category?: SupportCategory | null;
  product?: ProductInfo | null;
  images?: SupportTicketImage[];
  messages?: ChatMessage[];
}

export interface CreateTicketData {
  purchaseId: number;
  productId: number;
  categoryId?: number;
  customCategory?: string;
  description: string;
  imageUris?: string[];
}

export interface SendMessageData {
  ticketId: number;
  message: string;
  mediaUri?: string;
}

export interface SendStoreMessageData {
  ticketId: number;
  message: string;
  mediaUri?: string;
}

// ============ LABELS E CONFIGURAÇÕES ============

export const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

export const statusColors: Record<string, string> = {
  pending: '#FF9500',
  in_progress: '#007AFF',
  resolved: '#22D883',
  closed: '#8E8E93'
};

export function getStatusLabel(status: string): string {
  return statusLabels[status] || status;
}

export function getStatusColor(status: string): string {
  return statusColors[status] || '#8E8E93';
}

// ============ FUNÇÃO AUXILIAR PARA CHAMAR EDGE FUNCTION ============

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
    console.log('🎫 Chamando Support Edge Function:', action);
    
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Edge Function HTTP Error: ${response.status}`, errorText);
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao chamar edge function:', error);
    throw new Error(`Erro inesperado: ${error instanceof Error ? error.message : error}`);
  }
}

// ============ FUNÇÕES COMPARTILHADAS ============

export async function getSupportCategories(): Promise<SupportCategory[]> {
  try {
    const result = await callSupportEdgeFunction('get-categories');

    if (result?.success && result?.categories) {
      return result.categories;
    }

    console.warn('Edge function retornou success false:', result);
    return [];
  } catch (error) {
    console.error('Erro ao buscar categorias de suporte:', error);
    return [];
  }
}

// ============ FUNÇÕES DO CLIENTE (USER) ============

export async function getTicketsByPurchase(purchaseId: number): Promise<SupportTicket[]> {
  try {
    const result = await callSupportEdgeFunction('get-tickets', { purchaseId });

    if (result?.success && result?.tickets) {
      return result.tickets;
    }

    console.warn('Edge function retornou success false:', result);
    return [];
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    return [];
  }
}

export async function getTicketByPurchase(purchaseId: number): Promise<{ hasTicket: boolean; ticket: SupportTicket | null }> {
  try {
    const result = await callSupportEdgeFunction('get-ticket', { purchaseId });

    if (result?.success) {
      return {
        hasTicket: result.hasTicket || false,
        ticket: result.ticket || null
      };
    }

    console.warn('Edge function retornou success false:', result);
    return { hasTicket: false, ticket: null };
  } catch (error) {
    console.error('Erro ao buscar ticket:', error);
    return { hasTicket: false, ticket: null };
  }
}

export async function uploadSupportImages(imageUris: string[]): Promise<string[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const uploadPromises = imageUris.map(async (uri, index) => {
      try {
        return await uploadFileToSupabase(
          uri,
          'support',
          `support_images_${session.user.id}/`
        );
      } catch (error) {
        console.error(`Erro ao fazer upload da imagem ${index}:`, error);
        return null;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls.filter((url): url is string => url !== null);
  } catch (error) {
    console.error('Erro ao fazer upload das imagens de suporte:', error);
    return [];
  }
}

// Nova função para upload de mídia do chat
export async function uploadChatMedia(uri: string): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    return await uploadFileToSupabase(
      uri,
      'support',
      `chat_media_${session.user.id}/`
    );
  } catch (error) {
    console.error('Erro ao fazer upload de mídia do chat:', error);
    return null;
  }
}

export async function createSupportTicket(ticketData: CreateTicketData): Promise<{ success: boolean; ticketId?: number; error?: string }> {
  try {
    let imageUrls: string[] = [];

    if (ticketData.imageUris && ticketData.imageUris.length > 0) {
      console.log('Fazendo upload das imagens...');
      imageUrls = await uploadSupportImages(ticketData.imageUris);
      console.log('Imagens enviadas:', imageUrls);
    }

    const payload = {
      purchaseId: ticketData.purchaseId,
      productId: ticketData.productId,
      categoryId: ticketData.categoryId || null,
      customCategory: ticketData.customCategory || null,
      description: ticketData.description,
      imageUrls: imageUrls
    };

    const result = await callSupportEdgeFunction('create-ticket', payload);

    if (result?.success) {
      return {
        success: true,
        ticketId: result.ticketId
      };
    }

    return {
      success: false,
      error: result?.error || 'Erro ao criar ticket'
    };
  } catch (error) {
    console.error('Erro ao criar ticket de suporte:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado'
    };
  }
}

export async function sendMessage(messageData: SendMessageData): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  try {
    let mediaUrl: string | null = null;

    // Upload da mídia se houver
    if (messageData.mediaUri) {
      console.log('Fazendo upload de mídia...');
      mediaUrl = await uploadChatMedia(messageData.mediaUri);
      if (!mediaUrl) {
        return {
          success: false,
          error: 'Erro ao fazer upload da mídia'
        };
      }
      console.log('Mídia enviada:', mediaUrl);
    }

    const result = await callSupportEdgeFunction('send-message', {
      ticketId: messageData.ticketId,
      message: messageData.message || '',
      mediaUrl: mediaUrl
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

// ============ FUNÇÕES DA LOJA (STORE) ============

export async function getStoreTickets(
  purchaseId: string, 
  productId: string
): Promise<SupportTicket[]> {
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
    console.error('Erro ao buscar tickets de suporte da loja:', error);
    return [];
  }
}

export async function sendStoreMessage(
  ticketId: number,
  message: string,
  mediaUri?: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  try {
    let mediaUrl: string | null = null;

    // Upload da mídia se houver
    if (mediaUri) {
      console.log('Fazendo upload de mídia da loja...');
      mediaUrl = await uploadChatMedia(mediaUri);
      if (!mediaUrl) {
        return {
          success: false,
          error: 'Erro ao fazer upload da mídia'
        };
      }
      console.log('Mídia enviada:', mediaUrl);
    }

    const result = await callSupportEdgeFunction('send-store-message', {
      ticketId,
      message: message || '',
      mediaUrl: mediaUrl
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
    console.error('Erro ao enviar mensagem da loja:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado'
    };
  }
}

// ============ FUNÇÕES DE REALTIME ============

/**
 * Conecta a um canal Realtime de um ticket específico
 * Funciona tanto para cliente quanto para loja
 */
export function subscribeToTicketWithPermissions(
  ticketId: number,
  onNewMessage: (message: ChatMessage) => void,
  onPermissionChange: (data: { ticketId: number; field: string; value: boolean }) => void,
  context: 'user' | 'store' = 'user'
): RealtimeChannel {
  console.log(`📡 [${context.toUpperCase()}] Conectando ao canal: ticket_${ticketId}`);

  const channel = supabase.channel(`ticket_${ticketId}`, {
    config: {
      broadcast: { self: false },
    },
  });

  channel
    .on('broadcast', { event: 'new_message' }, (payload) => {
      console.log(`📨 [${context.toUpperCase()}] Nova mensagem recebida:`, payload);
      onNewMessage(payload.payload as ChatMessage);
    })
    .on('broadcast', { event: 'permission_change' }, (payload) => {
      console.log(`🔒 [${context.toUpperCase()}] Permissão alterada:`, payload);
      onPermissionChange(payload.payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ [${context.toUpperCase()}] Inscrito no canal ticket_${ticketId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ [${context.toUpperCase()}] Erro no canal ticket_${ticketId}`);
      } else if (status === 'TIMED_OUT') {
        console.warn(`⏱️ [${context.toUpperCase()}] Timeout no canal ticket_${ticketId}`);
      } else if (status === 'CLOSED') {
        console.log(`🔌 [${context.toUpperCase()}] Canal ticket_${ticketId} fechado`);
      }
    });

  return channel;
}

export function subscribeToTicket(
  ticketId: number,
  onNewMessage: (message: ChatMessage) => void,
  context: 'user' | 'store' = 'user'
): RealtimeChannel {
  console.log(`📡 [${context.toUpperCase()}] Conectando ao canal: ticket_${ticketId}`);

  const channel = supabase.channel(`ticket_${ticketId}`, {
    config: {
      broadcast: { self: false },
    },
  });

  channel
    .on('broadcast', { event: 'new_message' }, (payload) => {
      console.log(`📨 [${context.toUpperCase()}] Nova mensagem recebida:`, payload);
      onNewMessage(payload.payload as ChatMessage);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ [${context.toUpperCase()}] Inscrito no canal ticket_${ticketId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ [${context.toUpperCase()}] Erro no canal ticket_${ticketId}`);
      } else if (status === 'TIMED_OUT') {
        console.warn(`⏱️ [${context.toUpperCase()}] Timeout no canal ticket_${ticketId}`);
      } else if (status === 'CLOSED') {
        console.log(`🔌 [${context.toUpperCase()}] Canal ticket_${ticketId} fechado`);
      }
    });

  return channel;
}

/**
 * Desconecta de um canal Realtime
 * Funciona tanto para cliente quanto para loja
 */
export function unsubscribeFromTicket(channel: RealtimeChannel | null) {
  if (channel) {
    console.log('🔌 Desconectando do canal');
    channel.unsubscribe();
  }
}

// ============ FUNÇÕES DE FORMATAÇÃO ============

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

// ============ FUNÇÃO AUXILIAR PARA DETECTAR TIPO DE MÍDIA ============

export function getMediaType(url: string): 'image' | 'video' | 'unknown' {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'];
  
  const lowercaseUrl = url.toLowerCase();
  
  if (imageExtensions.some(ext => lowercaseUrl.includes(ext))) {
    return 'image';
  }
  
  if (videoExtensions.some(ext => lowercaseUrl.includes(ext))) {
    return 'video';
  }
  
  return 'unknown';
}