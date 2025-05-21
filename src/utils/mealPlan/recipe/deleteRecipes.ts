
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Removes all recipes containing quinoa from the database
 * (searches title, ingredients, and main_ingredient fields)
 */
export async function removeQuinoaRecipes(): Promise<{ count: number, success: boolean }> {
  try {
    console.log("Starting removal of quinoa recipes");
    
    // Find recipes containing quinoa in title, ingredients, or main_ingredient
    const { data: quinoaRecipes, error: findError } = await supabase
      .from("recipes")
      .select("id, title")
      .or(`title.ilike.%quinoa%, ingredients.cs.{%quinoa%}, main_ingredient.ilike.%quinoa%`);
      
    if (findError) {
      console.error("Error finding quinoa recipes:", findError);
      return { count: 0, success: false };
    }
    
    if (!quinoaRecipes || quinoaRecipes.length === 0) {
      console.log("No quinoa recipes found to delete");
      return { count: 0, success: true };
    }
    
    console.log(`Found ${quinoaRecipes.length} quinoa recipes to delete:`, 
      quinoaRecipes.map(r => r.title).join(", "));
    
    // Delete the recipes
    const recipeIds = quinoaRecipes.map(recipe => recipe.id);
    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .in("id", recipeIds);
      
    if (deleteError) {
      console.error("Error deleting quinoa recipes:", deleteError);
      return { count: 0, success: false };
    }
    
    console.log(`Successfully deleted ${quinoaRecipes.length} quinoa recipes`);
    return { 
      count: quinoaRecipes.length,
      success: true 
    };
  } catch (error) {
    console.error("Unexpected error removing quinoa recipes:", error);
    return { count: 0, success: false };
  }
}
