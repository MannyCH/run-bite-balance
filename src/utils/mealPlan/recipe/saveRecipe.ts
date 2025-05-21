
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

    // Ensure the recipe has a main_ingredient field
    if (!recipeData.main_ingredient && recipeData.ingredients && recipeData.ingredients.length > 0) {
      // Extract main ingredient from the first ingredient if possible
      const firstIngredient = recipeData.ingredients[0].toLowerCase();
      recipeData.main_ingredient = firstIngredient.split(' ').slice(1).join(' ').split(',')[0] || null;
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
        is_ai_generated: recipeData.is_ai_generated,
        main_ingredient: recipeData.main_ingredient || null,
        // Add meal_type as a category if available
        ...(recipeData.meal_type && { 
          categories: [...(recipeData.categories || []), recipeData.meal_type] 
        })
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

/**
 * New function to mark an AI-generated recipe as saved by the user
 * This prevents it from being deleted when cleaning up unsaved AI recipes
 */
export async function saveAIRecipe(recipeId: string): Promise<boolean> {
  try {
    // Create a flag in the database to mark this recipe as explicitly saved by the user
    // This will prevent it from being cleaned up by the cleanupUnsavedAIRecipes function
    const { error } = await supabase
      .from('recipes')
      .update({
        // Update the categories to include 'saved_by_user' 
        // This serves as a flag until we have a proper is_saved_by_user column
        categories: supabase.rpc('array_append_unique', { 
          arr: supabase.rpc('get_recipe_categories', { recipe_id: recipeId }),
          el: 'saved_by_user'
        })
      })
      .eq('id', recipeId);
    
    if (error) {
      console.error("Error saving AI recipe:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in saveAIRecipe:", error);
    return false;
  }
}
