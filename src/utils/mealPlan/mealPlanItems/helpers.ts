
// Helper functions for meal plan item creation
import { MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';

/**
 * Creates a meal plan item with common structure
 */
export function createMealPlanItem(
  mealPlanId: string,
  recipe: Recipe,
  date: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
  nutritionalContext: string
): Partial<MealPlanItem> {
  return {
    id: crypto.randomUUID(),
    meal_plan_id: mealPlanId,
    recipe_id: recipe.id,
    date: date,
    meal_type: mealType,
    nutritional_context: nutritionalContext,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat
  };
}
