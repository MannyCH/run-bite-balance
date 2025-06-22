
import { Recipe } from "@/context/types";
import { MealPlanItem } from "@/types/profile";
import { multiplyIngredientQuantity } from "./quantityMultiplier";
import { parseRecipeServings } from "./servingsParser";

/**
 * Extract raw ingredients from recipes with frequency multipliers based on meal plan occurrences
 * and user's batch cooking people setting
 */
export function extractRawIngredientsWithFrequency(
  recipes: Recipe[], 
  mealPlanItems: MealPlanItem[],
  batchCookingPeople: number = 1
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
  
  // Extract ingredients and multiply by frequency and people scaling
  recipes.forEach(recipe => {
    if (!recipe.ingredients || !recipe.id) return;
    
    const frequency = recipeFrequency.get(recipe.id) || 1;
    const recipeServings = parseRecipeServings(recipe);
    
    // Calculate scaling factor: (people_to_cook_for / recipe_servings) * frequency
    const scalingFactor = (batchCookingPeople / recipeServings) * frequency;
    
    recipe.ingredients.forEach(ingredient => {
      if (ingredient && ingredient.trim()) {
        if (scalingFactor !== 1) {
          const scaledIngredient = multiplyIngredientQuantity(ingredient.trim(), scalingFactor);
          allIngredients.push(scaledIngredient);
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
