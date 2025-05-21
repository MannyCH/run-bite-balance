
import { supabase } from '@/integrations/supabase/client';

/**
 * Removes all recipes containing quinoa from the database
 * @returns Promise with number of deleted recipes
 */
export const removeQuinoaRecipes = async (): Promise<number> => {
  try {
    // First, identify recipes with quinoa in title, ingredients, or main ingredient
    const { data: recipesToDelete, error: findError } = await supabase
      .from('recipes')
      .select('id, title, ingredients, main_ingredient')
      .or('title.ilike.%quinoa%,main_ingredient.ilike.%quinoa%');
    
    if (findError) {
      console.error("Error identifying quinoa recipes:", findError);
      return 0;
    }
    
    // Also check for quinoa in the ingredients array
    const allQuinoaRecipes = recipesToDelete?.filter(recipe => 
      recipe.title.toLowerCase().includes('quinoa') || 
      recipe.main_ingredient?.toLowerCase().includes('quinoa') || 
      (recipe.ingredients && 
        recipe.ingredients.some((ingredient: string) => 
          ingredient.toLowerCase().includes('quinoa')
        ))
    ) || [];
    
    const recipeIds = allQuinoaRecipes.map(recipe => recipe.id);
    
    console.log(`Found ${recipeIds.length} quinoa recipes to delete`);
    
    if (recipeIds.length === 0) {
      console.log("No quinoa recipes found in the database");
      return 0;
    }
    
    // Delete the identified recipes
    const { error: deleteError, count } = await supabase
      .from('recipes')
      .delete({ count: 'exact' })
      .in('id', recipeIds);
    
    if (deleteError) {
      console.error("Error deleting quinoa recipes:", deleteError);
      return 0;
    }
    
    console.log(`Successfully deleted ${count} quinoa recipes`);
    return count || 0;
  } catch (error) {
    console.error("Unexpected error removing quinoa recipes:", error);
    return 0;
  }
};
