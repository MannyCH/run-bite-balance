
import { Recipe } from "@/context/types";
import { MealPlanItem } from "@/types/profile";
import { multiplyIngredientQuantity } from "./quantityMultiplier";

/**
 * Extract raw ingredients from recipes with frequency multipliers based on meal plan occurrences
 */
export function extractRawIngredientsWithFrequency(
  recipes: Recipe[], 
  mealPlanItems: MealPlanItem[]
): string[] {
  const allIngredients: string[] = [];
  
  // Count how many times each recipe appears in the meal plan
  const recipeFrequency = new Map<string, number>();
  mealPlanItems.forEach(item => {
    if (item.recipe_id) {
      const currentCount = recipeFrequency.get(item.recipe_id) || 0;
      recipeFrequency.set(item.recipe_id, currentCount + 1);
    }
  });
  
  // Extract ingredients and multiply by frequency
  recipes.forEach(recipe => {
    if (!recipe.ingredients || !recipe.id) return;
    
    const frequency = recipeFrequency.get(recipe.id) || 1;
    
    recipe.ingredients.forEach(ingredient => {
      if (ingredient && ingredient.trim()) {
        // If frequency > 1, we need to multiply the quantity in the ingredient string
        if (frequency > 1) {
          const multipliedIngredient = multiplyIngredientQuantity(ingredient.trim(), frequency);
          allIngredients.push(multipliedIngredient);
        } else {
          allIngredients.push(ingredient.trim());
        }
      }
    });
  });
  
  return allIngredients;
}

// Re-export functions from other modules for backward compatibility
export { convertCategorizedToShoppingList } from "./categorizedConverter";
export { aggregateIngredients } from "./ingredientAggregator";
export { parseIngredient } from "./ingredientParser";
