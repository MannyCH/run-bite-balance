
import { supabase } from "@/lib/supabase";
import { Recipe } from "./types";
import { recipeToDbFormat, dbToRecipeFormat } from "./utils";

/**
 * Imports recipes into the Supabase database
 */
export const importRecipes = async (newRecipes: Recipe[]): Promise<Recipe[]> => {
  try {
    console.log('Importing recipes to Supabase:', newRecipes.length);
    
    // Verify Supabase connection
    if (!supabase || typeof supabase.from !== 'function') {
      throw new Error('Supabase connection not established. Please check your Supabase integration.');
    }
    
    // Pre-process recipes with proper IDs and ensure image URLs are properly saved
    const recipesForDb = await Promise.all(newRecipes.map(recipeToDbFormat));
    
    console.log('Prepared recipes for insert:', recipesForDb[0]);
    
    // Insert the data
    const { data, error: insertError } = await supabase
      .from('recipes')
      .insert(recipesForDb);
    
    if (insertError) {
      console.error('Error inserting recipes to Supabase:', insertError);
      throw new Error(`Failed to save recipes: ${insertError.message}`);
    }
    
    console.log('Successfully inserted recipes, now fetching them back');
    
    // Fetch all recipes in a separate query to update state
    const { data: fetchedData, error: selectError } = await supabase
      .from('recipes')
      .select('*');
    
    if (selectError) {
      console.error('Error fetching recipes after insert:', selectError);
      throw new Error(`Failed to fetch recipes: ${selectError.message}`);
    }
    
    if (fetchedData) {
      console.log('Successfully loaded all recipes:', fetchedData.length);
      
      // Map the fetched data back to our Recipe interface format
      return fetchedData.map(dbToRecipeFormat);
    }
    
    return [];
  } catch (error) {
    console.error('Error in importRecipes:', error);
    throw error;
  }
};

/**
 * Loads recipes from the Supabase database
 */
export const loadRecipes = async (): Promise<Recipe[]> => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*');

    if (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }

    if (data) {
      console.log('Loaded recipes from Supabase:', data.length);
      return data.map(dbToRecipeFormat);
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return [];
  }
};
