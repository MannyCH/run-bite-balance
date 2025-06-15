
// Supabase client utilities for the edge function
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

export function createSupabaseClient(authHeader: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  });
}

export async function fetchUserProfile(supabase: any, userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError) {
    throw new Error(`Failed to fetch user profile: ${profileError.message}`);
  }
  
  if (!profile) {
    throw new Error('User profile not found');
  }
  
  return profile;
}

export async function fetchRecipes(supabase: any) {
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*');
  
  if (recipesError) {
    throw new Error(`Failed to fetch recipes: ${recipesError.message}`);
  }
  
  if (!recipes || recipes.length === 0) {
    throw new Error('No recipes found in the database');
  }
  
  return recipes;
}
