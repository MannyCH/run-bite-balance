
import { supabase } from "@/integrations/supabase/client";

/**
 * Saves a recipe to the user's collection
 */
export async function saveRecipeToCollection(recipeData: any): Promise<boolean> {
  try {
    // Ensure the recipe has the is_ai_generated flag set
    if (recipeData.is_ai_generated === undefined) {
      recipeData.is_ai_generated = true;
    }

    // Insert the recipe into the database
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        title: recipeData.title,
        calories: recipeData.calories || 0,
        protein: recipeData.protein || 0,
        carbs: recipeData.carbs || 0,
        fat: recipeData.fat || 0,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        categories: recipeData.categories || [],
        is_ai_generated: recipeData.is_ai_generated
      });
    
    if (error) {
      console.error("Error saving recipe to collection:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in saveRecipeToCollection:", error);
    return false;
  }
}
