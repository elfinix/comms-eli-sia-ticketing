import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ActivityLog, ActivityLogWithUser } from '../types';

export function useActivityLogs(userId: string, limit = 20) {
  const [activityLogs, setActivityLogs] = useState<ActivityLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchActivityLogs();
  }, [userId, limit]);

  async function fetchActivityLogs() {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:users(id, name, email, role)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setActivityLogs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function logActivity(action: string, ipAddress?: string, device?: string) {
    try {
      const { error: insertError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action,
          ip_address: ipAddress || null,
          device: device || null
        });

      if (insertError) throw insertError;

      // Refresh activity logs
      await fetchActivityLogs();
    } catch (err: any) {
      console.error('Error logging activity:', err);
    }
  }

  return {
    activityLogs,
    loading,
    error,
    logActivity,
    refetch: fetchActivityLogs
  };
}

// Hook for admin to view all activity logs
export function useAllActivityLogs(limit = 50) {
  const [activityLogs, setActivityLogs] = useState<ActivityLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivityLogs();
  }, [limit]);

  async function fetchActivityLogs() {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:users(id, name, email, role, department)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setActivityLogs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  }

  return {
    activityLogs,
    loading,
    error,
    refetch: fetchActivityLogs
  };
}
