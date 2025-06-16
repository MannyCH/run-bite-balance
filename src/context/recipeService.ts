
import { supabase } from "@/lib/supabase";
import { Recipe } from "./types";
import { recipeToDbFormat, dbToRecipeFormat } from "./utils";

/**
 * Imports recipes into the Supabase database
 */
export const importRecipes = async (newRecipes: Recipe[]): Promise<Recipe[]> => {
  try {
    console.log('RecipeService: Importing recipes to Supabase:', newRecipes.length);
    
    // Verify Supabase connection
    if (!supabase || typeof supabase.from !== 'function') {
      throw new Error('Supabase connection not established. Please check your Supabase integration.');
    }
    
    // Pre-process recipes with proper IDs and ensure image URLs are properly saved
    const recipesForDb = await Promise.all(newRecipes.map(recipeToDbFormat));
    
    console.log('RecipeService: Prepared recipes for insert:', recipesForDb[0]);
    
    // Insert the data
    const { data, error: insertError } = await supabase
      .from('recipes')
      .insert(recipesForDb);
    
    if (insertError) {
      console.error('RecipeService: Error inserting recipes to Supabase:', insertError);
      throw new Error(`Failed to save recipes: ${insertError.message}`);
    }
    
    console.log('RecipeService: Successfully inserted recipes, now fetching them back');
    
    // Fetch all recipes in a separate query to update state
    const { data: fetchedData, error: selectError } = await supabase
      .from('recipes')
      .select('*');
    
    if (selectError) {
      console.error('RecipeService: Error fetching recipes after insert:', selectError);
      throw new Error(`Failed to fetch recipes: ${selectError.message}`);
    }
    
    if (fetchedData) {
      console.log('RecipeService: Successfully loaded all recipes:', fetchedData.length);
      
      // Map the fetched data back to our Recipe interface format
      return fetchedData.map(dbToRecipeFormat);
    }
    
    return [];
  } catch (error) {
    console.error('RecipeService: Error in importRecipes:', error);
    throw error;
  }
};

/**
 * Loads recipes from the Supabase database
 */
export const loadRecipes = async (): Promise<Recipe[]> => {
  try {
    console.log('RecipeService: Starting to load recipes from Supabase...');
    
    // Verify Supabase connection
    if (!supabase || typeof supabase.from !== 'function') {
      console.error('RecipeService: Supabase not properly initialized');
      return [];
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('*');

    if (error) {
      console.error('RecipeService: Error fetching recipes:', error);
      console.error('RecipeService: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }

    if (data) {
      console.log('RecipeService: Successfully loaded recipes from Supabase:', data.length);
      // Check if we have any blob URLs that won't work after refresh
      const recipesWithBlobUrls = data.filter(r => r.is_blob_url).length;
      if (recipesWithBlobUrls > 0) {
        console.log(`RecipeService: Found ${recipesWithBlobUrls} recipes with blob URLs that won't display correctly`);
      }
      
      const mappedRecipes = data.map(dbToRecipeFormat);
      console.log('RecipeService: Mapped recipes to format:', mappedRecipes.length);
      return mappedRecipes;
    }
    
    console.log('RecipeService: No data returned from Supabase');
    return [];
  } catch (error) {
    console.error('RecipeService: Failed to fetch recipes:', error);
    return [];
  }
};
