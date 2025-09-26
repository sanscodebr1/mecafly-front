// services/notificationService.ts
import { supabase } from '../lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: number;
  created_at: string;
  title: string | null;
  content: string | null;
  page: string | null;
  page_params: any;
  read: boolean | null;
  user_id: string;
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  content: string;
  page?: string;
  pageParams?: any;
}

// Criar notificação via Edge Function
export async function createNotification(params: CreateNotificationParams): Promise<{
  success: boolean;
  notification?: Notification;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/notification-service?action=create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2lvdmtlZXpmaGF2ZmlzYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDM1NjAsImV4cCI6MjA3MTcxOTU2MH0.Ne_L8SZJn5Lg3_DY1i_2RVHABGLlQrcma7JkW3TkNgc',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Buscar notificações do usuário
export async function getUserNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/notification-service?action=list&unreadOnly=${unreadOnly}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2lvdmtlZXpmaGF2ZmlzYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDM1NjAsImV4cCI6MjA3MTcxOTU2MH0.Ne_L8SZJn5Lg3_DY1i_2RVHABGLlQrcma7JkW3TkNgc',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.notifications || [];
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
}

// Marcar notificação como lida
export async function markAsRead(notificationId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/notification-service?action=mark_read`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2lvdmtlZXpmaGF2ZmlzYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDM1NjAsImV4cCI6MjA3MTcxOTU2MH0.Ne_L8SZJn5Lg3_DY1i_2RVHABGLlQrcma7JkW3TkNgc',
        },
        body: JSON.stringify({ notificationId }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Marcar todas como lidas
export async function markAllAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/notification-service?action=mark_all_read`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc2lvdmtlZXpmaGF2ZmlzYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDM1NjAsImV4cCI6MjA3MTcxOTU2MH0.Ne_L8SZJn5Lg3_DY1i_2RVHABGLlQrcma7JkW3TkNgc',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Subscrever notificações em tempo real
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: Notification) => void
): RealtimeChannel {
  console.log('📡 [subscribeToNotifications] Inscrevendo em notificações do usuário:', userId);

  const channel = supabase
    .channel(`notifications_${userId}`, {
      config: {
        broadcast: { self: false },
      },
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notification',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('🔔 [subscribeToNotifications] Nova notificação recebida:', payload.new);
        onNewNotification(payload.new as Notification);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ [subscribeToNotifications] Inscrito com sucesso em notificações');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ [subscribeToNotifications] Erro no canal de notificações');
      } else if (status === 'TIMED_OUT') {
        console.error('⏰ [subscribeToNotifications] Timeout na subscrição');
      } else {
        console.log('📡 [subscribeToNotifications] Status da subscrição:', status);
      }
    });

  return channel;
}

// Desinscrever de notificações
export function unsubscribeFromNotifications(channel: RealtimeChannel) {
  if (channel) {
    supabase.removeChannel(channel);
    console.log('📡 Desinscrito de notificações');
  }
}

// Formatar data da notificação
export function formatNotificationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit',
    year: 'numeric'
  });
}