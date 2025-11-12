import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://qfqfmtemtatvouwvazgt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcWZtdGVtdGF0dm91d3Zhemd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTM0NDMsImV4cCI6MjA3ODQyOTQ0M30.NrdIkG_glBHdpkmP1qUOvgR0EHt9bNDTit12K6RmuoQ';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Export configuration for use in other modules
export { supabaseUrl, supabaseAnonKey };
