
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/context/types";
import { MealPlanItem } from "@/types/profile";
import { extractRawIngredientsWithFrequency } from "./extractIngredients";
import { ShoppingList } from "@/types/shoppingList";

/**
 * Summarize ingredients using AI and return a categorized shopping list
 */
export async function summarizeWithAI(
  recipes: Recipe[], 
  mealPlanItems: MealPlanItem[],
  batchCookingPeople: number = 1
): Promise<ShoppingList> {
  try {
    // Extract ingredients with proper scaling for batch cooking people
    const ingredients = extractRawIngredientsWithFrequency(recipes, mealPlanItems, batchCookingPeople);
    
    if (ingredients.length === 0) {
      console.log('No ingredients found to summarize');
      return [];
    }

    console.log(`Summarizing ${ingredients.length} ingredients for ${batchCookingPeople} people with AI...`);
    
    const { data, error } = await supabase.functions.invoke('summarize-shopping-list', {
      body: { ingredients }
    });

    if (error) {
      console.error('Error calling summarize-shopping-list function:', error);
      throw error;
    }

    if (!data || !data.categories) {
      console.error('Invalid response from summarize-shopping-list function:', data);
      return [];
    }

    // Convert categorized data to flat shopping list
    const shoppingList: ShoppingList = [];
    
    Object.entries(data.categories).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          shoppingList.push({
            id: item.id || Math.random().toString(36).substr(2, 9),
            name: item.name,
            quantity: item.quantity || '',
            isBought: item.isBought || false,
            category: category
          });
        });
      }
    });

    console.log(`Generated shopping list with ${shoppingList.length} items`);
    return shoppingList;
  } catch (error) {
    console.error('Error in summarizeWithAI:', error);
    return [];
  }
}
