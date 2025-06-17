
import { MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { validateMealType } from './validators';

/**
 * Creates a standard meal plan item from AI response
 */
export function createMealPlanItemFromAI(
  meal: any,
  recipe: Recipe,
  mealPlanId: string,
  date: string,
  isRunDay: boolean
): Partial<MealPlanItem> {
  const { meal_type, explanation } = meal;
  const validMealType = validateMealType(meal_type);

  // Add contextual information for lunch on run days
  let contextualExplanation = explanation;
  if (isRunDay && validMealType === 'lunch') {
    contextualExplanation = `POST-RUN RECOVERY LUNCH: ${explanation} Enhanced for muscle recovery after your run.`;
  } else if (isRunDay && validMealType !== 'lunch') {
    contextualExplanation = `RUN DAY ${validMealType.toUpperCase()}: ${explanation}`;
  }

  console.log(`Creating meal item for ${date}: ${validMealType} - ${recipe.title}`);

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
  isRunDay: boolean
): Partial<MealPlanItem>[] {
  const mealPlanItems: Partial<MealPlanItem>[] = [];

  console.log(`Processing ${meals.length} meals for date ${date} (${isRunDay ? 'RUN DAY' : 'REST DAY'})`);

  for (const meal of meals) {
    const { recipe_id } = meal;
    
    // Check if recipe exists in our recipes map
    const recipe = recipesMap[recipe_id];
    if (!recipe) {
      console.warn(`Recipe not found: ${recipe_id}, skipping meal for ${date}`);
      continue;
    }

    const mealItem = createMealPlanItemFromAI(
      meal, 
      recipe, 
      mealPlanId, 
      date, 
      isRunDay
    );

    console.log(`✅ Added ${mealItem.meal_type}: ${recipe.title} (${recipe.calories} cal) for ${date}`);
    mealPlanItems.push(mealItem);
  }

  console.log(`✅ Processed ${mealPlanItems.length} meals for ${date}`);
  return mealPlanItems;
}
