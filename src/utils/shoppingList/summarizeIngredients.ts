
import { ShoppingListItem } from "@/types/shoppingList";
import { supabase } from "@/integrations/supabase/client";
import { extractRawIngredientsWithFrequency, convertCategorizedToShoppingList } from "./extractIngredients";
import { Recipe } from "@/context/types";
import { MealPlanItem } from "@/types/profile";
import { groupBasicIngredients, convertRecipesToItems } from "./basicIngredientGrouper";

/**
 * Use OpenAI via Supabase Edge Function to create a categorized shopping list
 */
export async function summarizeWithAI(recipes: Recipe[], mealPlanItems: MealPlanItem[]): Promise<ShoppingListItem[]> {
  if (recipes.length === 0) return [];
  
  try {
    // Extract raw ingredients from all recipes with frequency multipliers
    const rawIngredients = extractRawIngredientsWithFrequency(recipes, mealPlanItems);
    
    if (rawIngredients.length === 0) {
      console.log("No ingredients found in recipes");
      return [];
    }
    
    console.log("Sending raw ingredients to AI:", rawIngredients);
    
    const { data, error } = await supabase.functions.invoke('summarize-shopping-list', {
      body: { ingredients: rawIngredients }
    });
    
    if (error) {
      console.error("Error calling summarize-shopping-list function:", error);
      // Fall back to simple aggregation if the edge function fails
      return groupBasicIngredients(convertRecipesToItems(recipes, mealPlanItems));
    }
    
    if (data && data.categories) {
      console.log("Received categorized data from AI:", data);
      return convertCategorizedToShoppingList(data);
    }
    
    throw new Error("Invalid response from summarize-shopping-list function");
  } catch (err) {
    console.error("Error summarizing shopping list with AI:", err);
    // Fall back to simple aggregation
    return groupBasicIngredients(convertRecipesToItems(recipes, mealPlanItems));
  }
}
