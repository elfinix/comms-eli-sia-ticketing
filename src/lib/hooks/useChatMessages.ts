import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ChatMessage, ChatMessageWithUsers } from '../types';

export function useChatMessages(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessageWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    
    fetchMessages();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        // Add new message to the list
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  async function fetchMessages() {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey(id, name, avatar_url, role),
          receiver:users!chat_messages_receiver_id_fkey(id, name, avatar_url, role)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(senderId: string, receiverId: string, message: string, ticketId?: string) {
    try {
      const { data, error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          receiver_id: receiverId,
          message,
          ticket_id: ticketId || null,
          is_read: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, data };
    } catch (err: any) {
      console.error('Error sending message:', err);
      return { success: false, error: err.message };
    }
  }

  async function markAsRead(messageIds: string[]) {
    try {
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', messageIds);

      if (updateError) throw updateError;

      // Update local state
      setMessages(prev =>
        prev.map(m => messageIds.includes(m.id) ? { ...m, is_read: true } : m)
      );
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    refetch: fetchMessages
  };
}

// Hook to get unread message count
export function useUnreadMessageCount(userId: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    fetchUnreadCount();

    // Set up real-time subscription
    const subscription = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `receiver_id=eq.${userId}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  async function fetchUnreadCount() {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      setUnreadCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching unread count:', err);
    } finally {
      setLoading(false);
    }
  }

  return { unreadCount, loading, refetch: fetchUnreadCount };
}
