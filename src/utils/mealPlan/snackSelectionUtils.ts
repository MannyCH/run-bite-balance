
import { Recipe } from '@/context/types';
import { RecipeDiversityManager } from './recipeSelection';

/**
 * Selects an appropriate recipe for snacks from existing recipes
 */
export function selectSnackRecipe(
  recipes: Recipe[],
  snackType: 'pre_run_snack' | 'post_run_snack',
  diversityManager: RecipeDiversityManager
): Recipe | null {
  // Filter recipes suitable for snacks
  const snackRecipes = recipes.filter(recipe => {
    if (snackType === 'pre_run_snack') {
      // Light breakfast items or low-calorie recipes (100-200 cal)
      const isLightBreakfast = recipe.meal_type?.includes('breakfast') && recipe.calories <= 200;
      const isLowCalorie = recipe.calories <= 200 && recipe.calories >= 100;
      return isLightBreakfast || isLowCalorie;
    } else {
      // Light lunch items or medium-calorie recipes (200-300 cal)
      const isLightLunch = recipe.meal_type?.includes('lunch') && recipe.calories <= 300;
      const isMediumCalorie = recipe.calories <= 300 && recipe.calories >= 200;
      return isLightLunch || isMediumCalorie;
    }
  });

  if (snackRecipes.length === 0) {
    console.warn(`No suitable recipes found for ${snackType}`);
    return null;
  }

  // Use diversity manager to select appropriate snack
  const targetCalories = snackType === 'pre_run_snack' ? 150 : 250;
  const proteinTarget = snackType === 'pre_run_snack' ? 5 : 15;

  return diversityManager.selectRecipeWithDiversity(snackRecipes, targetCalories, proteinTarget);
}

/**
 * Creates a snack meal plan item
 */
export function createSnackMealPlanItem(
  recipe: Recipe,
  mealPlanId: string,
  date: string,
  snackType: 'pre_run_snack' | 'post_run_snack'
) {
  const isPreRun = snackType === 'pre_run_snack';
  const contextMessage = isPreRun 
    ? `Pre-run fuel: ${recipe.title} provides quick energy for your run`
    : `Post-run recovery: ${recipe.title} helps with muscle recovery after your run`;

  return {
    id: crypto.randomUUID(),
    meal_plan_id: mealPlanId,
    recipe_id: recipe.id,
    date,
    meal_type: snackType,
    nutritional_context: contextMessage,
    custom_title: null,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat
  };
}
