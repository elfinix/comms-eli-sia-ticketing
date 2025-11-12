import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Ticket, TicketWithRelations } from '../types';

export function useTickets(userId?: string, role?: string) {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();

    // Set up real-time subscription
    const subscription = supabase
      .channel('tickets-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets'
      }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, role]);

  async function fetchTickets() {
    try {
      setLoading(true);
      
      let query = supabase
        .from('tickets')
        .select(`
          *,
          submitted_by_user:users!tickets_submitted_by_fkey(id, name, email, role, department, avatar_url),
          assigned_to_user:users!tickets_assigned_to_fkey(id, name, email, role, department, avatar_url)
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (userId && role) {
        if (role === 'student' || role === 'faculty') {
          query = query.eq('submitted_by', userId);
        }
        // ICT and Admin can see all tickets (no filter needed)
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTickets(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  }

  return { tickets, loading, error, refetch: fetchTickets };
}

export function useTicket(ticketId: string) {
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) return;
    fetchTicket();

    // Set up real-time subscription for this specific ticket
    const subscription = supabase
      .channel(`ticket-${ticketId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `id=eq.${ticketId}`
      }, () => {
        fetchTicket();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId]);

  async function fetchTicket() {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select(`
          *,
          submitted_by_user:users!tickets_submitted_by_fkey(id, name, email, role, department, avatar_url),
          assigned_to_user:users!tickets_assigned_to_fkey(id, name, email, role, department, avatar_url),
          notes:ticket_notes(*, author:users(id, name, avatar_url)),
          attachments:ticket_attachments(*, uploader:users(id, name))
        `)
        .eq('id', ticketId)
        .single();

      if (fetchError) throw fetchError;

      setTicket(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  }

  return { ticket, loading, error, refetch: fetchTicket };
}
