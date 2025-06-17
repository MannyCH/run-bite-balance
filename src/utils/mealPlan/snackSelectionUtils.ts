
import { Recipe } from '@/context/types';
import { RecipeDiversityManager } from './recipeSelection';

/**
 * Selects an appropriate recipe for snacks from snack-classified recipes only
 */
export function selectSnackRecipe(
  recipes: Recipe[],
  snackType: 'pre_run_snack' | 'post_run_snack',
  diversityManager: RecipeDiversityManager
): Recipe | null {
  // Filter recipes to ONLY those classified as snacks
  const snackRecipes = recipes.filter(recipe => {
    // Only use recipes that are explicitly classified as snacks
    return recipe.meal_type?.includes('snack');
  });

  console.log(`Found ${snackRecipes.length} snack-classified recipes for ${snackType}`);

  if (snackRecipes.length === 0) {
    console.warn(`No snack-classified recipes found for ${snackType}`);
    return null;
  }

  // Filter by calorie range for snack type
  const filteredSnacks = snackRecipes.filter(recipe => {
    if (snackType === 'pre_run_snack') {
      // Light snacks for quick energy (100-200 cal)
      return recipe.calories <= 200 && recipe.calories >= 100;
    } else {
      // Post-run snacks handled by enhanced lunch, but if needed (200-300 cal)
      return recipe.calories <= 300 && recipe.calories >= 200;
    }
  });

  const targetSnacks = filteredSnacks.length > 0 ? filteredSnacks : snackRecipes;
  
  console.log(`Using ${targetSnacks.length} snacks after calorie filtering for ${snackType}`);

  // Use diversity manager to select appropriate snack
  const targetCalories = snackType === 'pre_run_snack' ? 150 : 250;
  const proteinTarget = snackType === 'pre_run_snack' ? 5 : 15;

  return diversityManager.selectRecipeWithDiversity(targetSnacks, targetCalories, proteinTarget);
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

/**
 * Creates a custom snack when no snack recipes are available
 */
export function createCustomSnackMealPlanItem(
  mealPlanId: string,
  date: string,
  snackType: 'pre_run_snack' | 'post_run_snack'
) {
  const isPreRun = snackType === 'pre_run_snack';
  
  const snackOptions = isPreRun 
    ? [
        { title: 'Banana with honey', calories: 150, protein: 2, carbs: 35, fat: 1 },
        { title: 'Energy bar', calories: 180, protein: 3, carbs: 30, fat: 6 },
        { title: 'Dates and almonds', calories: 160, protein: 4, carbs: 28, fat: 7 }
      ]
    : [
        { title: 'Greek yogurt with berries', calories: 250, protein: 15, carbs: 25, fat: 8 },
        { title: 'Protein smoothie', calories: 280, protein: 20, carbs: 30, fat: 5 },
        { title: 'Cottage cheese with fruit', calories: 220, protein: 18, carbs: 20, fat: 6 }
      ];

  const selectedSnack = snackOptions[Math.floor(Math.random() * snackOptions.length)];
  
  const contextMessage = isPreRun 
    ? `Pre-run fuel: ${selectedSnack.title} provides quick energy for your run`
    : `Post-run recovery: ${selectedSnack.title} helps with muscle recovery after your run`;

  return {
    id: crypto.randomUUID(),
    meal_plan_id: mealPlanId,
    recipe_id: null,
    date,
    meal_type: snackType,
    nutritional_context: contextMessage,
    custom_title: selectedSnack.title,
    calories: selectedSnack.calories,
    protein: selectedSnack.protein,
    carbs: selectedSnack.carbs,
    fat: selectedSnack.fat
  };
}
