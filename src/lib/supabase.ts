
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// These env variables are automatically injected by the Lovable Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Make sure the Supabase integration is properly connected.');
}

// Create a dummy client if credentials are missing (for development without crashing)
// In production, this should never happen if the Supabase integration is properly set up
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : {
      // Provide minimal mock functionality to prevent crashes
      from: () => ({
        select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      // Add any other methods you're using
    } as unknown as ReturnType<typeof createClient<Database>>;

// Re-export types from database.types
export type { Database, Json } from './database.types';
