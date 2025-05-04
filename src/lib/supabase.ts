
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// These env variables are automatically injected by the Lovable Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Re-export types from database.types
export type { Database, Json } from './database.types';
