
import { MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { validateMealType } from './validators';
import { isLunchTimeRun } from './runTimingUtils';

/**
 * Creates a standard meal plan item from AI response
 */
export function createMealPlanItemFromAI(
  meal: any,
  recipe: Recipe,
  mealPlanId: string,
  date: string,
  isRunDay: boolean,
  hasLunchTimeRun: boolean
): Partial<MealPlanItem> {
  const { meal_type, explanation } = meal;
  const validMealType = validateMealType(meal_type);

  // Add contextual information for lunch on run days
  let contextualExplanation = explanation;
  if (isRunDay && validMealType === 'lunch') {
    if (hasLunchTimeRun) {
      contextualExplanation = `POST-RUN RECOVERY LUNCH: ${explanation} Enhanced for muscle recovery after your lunch-time run.`;
    } else {
      contextualExplanation = `RUN DAY LUNCH: ${explanation}`;
    }
  }

  return {
    id: crypto.randomUUID(),
    meal_plan_id: mealPlanId,
    recipe_id: recipe.id,
    date,
    meal_type: validMealType,
    nutritional_context: contextualExplanation,
    custom_title: null,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat
  };
}

/**
 * Processes AI-generated meals for a specific day
 */
export function processAIMealsForDay(
  meals: any[],
  recipesMap: Record<string, Recipe>,
  mealPlanId: string,
  date: string,
  isRunDay: boolean,
  hasLunchTimeRun: boolean
): Partial<MealPlanItem>[] {
  const mealPlanItems: Partial<MealPlanItem>[] = [];

  for (const meal of meals) {
    const { recipe_id } = meal;
    
    // Check if recipe exists in our recipes map
    const recipe = recipesMap[recipe_id];
    if (!recipe) {
      console.warn(`Recipe not found: ${recipe_id}, skipping meal`);
      continue;
    }

    const mealItem = createMealPlanItemFromAI(
      meal, 
      recipe, 
      mealPlanId, 
      date, 
      isRunDay, 
      hasLunchTimeRun
    );

    console.log(`Adding ${mealItem.meal_type}: ${recipe.title} (${recipe.calories} cal)`);
    mealPlanItems.push(mealItem);
  }

  return mealPlanItems;
}
