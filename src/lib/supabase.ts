
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// These env variables are automatically injected by the Lovable Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug info to troubleshoot connection issues
console.log('Supabase connection info:');
console.log('URL defined:', !!supabaseUrl);
console.log('Anon key defined:', !!supabaseAnonKey);

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Make sure the Supabase integration is properly connected.');
}

// Create a dummy client if credentials are missing to prevent runtime crashes
let supabaseClient;
try {
  if (!supabaseUrl) {
    throw new Error('Supabase URL is required but not provided');
  }
  if (!supabaseAnonKey) {
    throw new Error('Supabase Anon Key is required but not provided');
  }
  
  // Create the real client when credentials are available
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  
  // Provide a mock client to prevent runtime errors
  supabaseClient = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signIn: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      }),
    },
  };
}

// Export the client (real or mock)
export const supabase = supabaseClient as ReturnType<typeof createClient<Database>>;

// Re-export types from database.types
export type { Database, Json } from './database.types';
