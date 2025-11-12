import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '../lib/types';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from users table
  async function fetchUserProfile(userId: string) {
    try {
      console.log('📋 Fetching user profile for ID:', userId);
      
      // No timeout - let Supabase handle it naturally
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error.message || error);
        return null;
      }

      if (!data) {
        console.error('❌ User profile not found in database.');
        return null;
      }

      console.log('✅ User profile fetched successfully:', data.name, `(${data.role})`);
      return data as User;
    } catch (err: any) {
      console.error('❌ Database error:', err.message || 'Could not fetch user profile.');
      return null;
    }
  }

  // Log activity
  async function logActivity(userId: string, action: string) {
    try {
      // Get device info
      const userAgent = navigator.userAgent;
      let device = 'Unknown';
      
      if (userAgent.includes('Chrome')) {
        device = `Chrome ${userAgent.match(/Chrome\/(\d+)/)?.[1]} (${navigator.platform})`;
      } else if (userAgent.includes('Firefox')) {
        device = `Firefox ${userAgent.match(/Firefox\/(\d+)/)?.[1]} (${navigator.platform})`;
      } else if (userAgent.includes('Safari')) {
        device = `Safari (${navigator.platform})`;
      } else if (userAgent.includes('Edge')) {
        device = `Edge ${userAgent.match(/Edge\/(\d+)/)?.[1]} (${navigator.platform})`;
      }

      await supabase.from('activity_logs').insert({
        user_id: userId,
        action,
        device,
        ip_address: null, // Would need backend to get real IP
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  }

  // Update last login
  async function updateLastLogin(userId: string) {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
      console.error('Error updating last login:', err);
    }
  }

  // Sign in function
  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        
        if (!profile) {
          await supabase.auth.signOut();
          return { success: false, error: 'User profile not found in database' };
        }

        // Check if user is inactive
        if (profile.status === 'inactive') {
          await supabase.auth.signOut();
          return { success: false, error: 'Your account has been deactivated. Please contact the administrator.' };
        }

        setUser(profile);
        setSupabaseUser(data.user);
        
        // Log the login activity
        await logActivity(data.user.id, 'Logged in');
        await updateLastLogin(data.user.id);

        return { success: true };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (err: any) {
      console.error('Sign in exception:', err);
      return { success: false, error: err.message || 'An error occurred during sign in' };
    }
  }

  // Sign out function
  async function signOut() {
    try {
      if (user) {
        await logActivity(user.id, 'Logged out');
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }

  // Refresh user data
  async function refreshUser() {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      if (profile) {
        setUser(profile);
        setSupabaseUser(data.user);
      }
    }
  }

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        console.log('🔍 Checking for existing session...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          console.log('✅ Session found for user:', session.user.email);
          const profile = await fetchUserProfile(session.user.id);
          
          if (profile && mounted) {
            console.log('✅ User profile loaded:', profile.name);
            setUser(profile);
            setSupabaseUser(session.user);
          } else if (mounted) {
            console.warn('⚠️ User profile not found in database');
            await supabase.auth.signOut();
          }
        } else {
          console.log('ℹ️ No active session found');
        }
      } catch (err) {
        console.error('❌ Error checking session:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    // ONLY listen for SIGNED_OUT event - nothing else
    // Sign in is handled by the signIn function directly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Only handle sign out - that's it!
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setSupabaseUser(null);
        }
        
        // Ignore all other events (SIGNED_IN, TOKEN_REFRESHED, etc.)
        // These are handled by signIn function or session restoration
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}