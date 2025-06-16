
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
  console.log('Fetching recipes with meal_type data...');
  
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, title, calories, protein, carbs, fat, ingredients, categories, meal_type, seasonal_suitability, temperature_preference, dish_type');
  
  if (recipesError) {
    throw new Error(`Failed to fetch recipes: ${recipesError.message}`);
  }
  
  if (!recipes || recipes.length === 0) {
    throw new Error('No recipes found in the database');
  }
  
  // Log sample recipe to check meal_type format
  if (recipes.length > 0) {
    console.log('Sample recipe with meal_type:', {
      id: recipes[0].id,
      title: recipes[0].title,
      meal_type: recipes[0].meal_type,
      meal_type_type: typeof recipes[0].meal_type,
      meal_type_is_array: Array.isArray(recipes[0].meal_type)
    });
  }
  
  // Count recipes with meal_type data
  const recipesWithMealType = recipes.filter(recipe => 
    recipe.meal_type && 
    (Array.isArray(recipe.meal_type) ? recipe.meal_type.length > 0 : recipe.meal_type)
  );
  
  console.log(`Fetched ${recipes.length} total recipes, ${recipesWithMealType.length} have meal_type classifications`);
  
  return recipes;
}
