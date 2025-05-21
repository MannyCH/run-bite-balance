
import { supabase } from "@/integrations/supabase/client";

/**
 * Delete a recipe from the database by ID
 * This will set recipe_id to NULL in any meal_plan_items that reference this recipe
 * thanks to our ON DELETE SET NULL foreign key constraint
 */
export async function deleteRecipeById(recipeId: string): Promise<{ success: boolean, error?: string }> {
  try {
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);
      
    if (error) {
      console.error("Error deleting recipe:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting recipe:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
