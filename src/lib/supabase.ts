
import { createClient } from '@supabase/supabase-js';

// These env variables are automatically injected by the Lovable Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Make sure the Supabase integration is properly connected.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string
          title: string
          calories: number
          protein: number
          carbs: number
          fat: number
          imgUrl?: string
          ingredients?: string[]
          instructions?: string[]
          categories?: string[]
          website?: string
          servings?: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          calories: number
          protein: number
          carbs: number
          fat: number
          imgUrl?: string
          ingredients?: string[]
          instructions?: string[]
          categories?: string[]
          website?: string
          servings?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          imgUrl?: string
          ingredients?: string[]
          instructions?: string[]
          categories?: string[]
          website?: string
          servings?: string
          created_at?: string
        }
      }
    }
  }
}
