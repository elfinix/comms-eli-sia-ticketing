import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setUsers(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  return { users, loading, error, refetch: fetchUsers };
}

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchUser();
  }, [userId]);

  async function fetchUser() {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      setUser(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(updates: Partial<User>) {
    try {
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      setUser(data);
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating user:', err);
      return { success: false, error: err.message };
    }
  }

  return { user, loading, error, updateUser, refetch: fetchUser };
}

// Get ICT staff members (for ticket assignment)
export function useICTStaff() {
  const [ictStaff, setIctStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchICTStaff();
  }, []);

  async function fetchICTStaff() {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'ict')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setIctStaff(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching ICT staff:', err);
    } finally {
      setLoading(false);
    }
  }

  return { ictStaff, loading, error, refetch: fetchICTStaff };
}
