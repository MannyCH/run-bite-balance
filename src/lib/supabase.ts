
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Use the environment variables from the Supabase integration
const supabaseUrl = "https://lnaaxnpffaoqjyccpeso.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYWF4bnBmZmFvcWp5Y2NwZXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTIwMTEsImV4cCI6MjA2MTkyODAxMX0.3yEA-jW039yv8kONvClhA9D0YODALfj0qrmN6lfGaFg";

console.log('Supabase connection info:');
console.log('URL:', supabaseUrl);
console.log('Connection enabled:', !!supabaseUrl && !!supabaseAnonKey);

// Create the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Re-export types from database.types
export type { Database, Json } from './database.types';
