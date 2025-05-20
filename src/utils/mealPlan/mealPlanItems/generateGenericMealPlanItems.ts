
// Generate generic meal plan items when no profile requirements are available
import { MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { getRandomRecipe } from '../recipe';
import { getGenericRequirements } from '../requirements';
import { createMealPlanItem } from './helpers';

export function generateGenericMealPlanItems(
  mealPlanId: string,
  prioritizedRecipes: Recipe[],
  startDate: Date,
  dayCount: number
): Partial<MealPlanItem>[] {
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  const genericRequirements = getGenericRequirements();
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const usedRecipeIds: string[] = [];
    
    // Add breakfast - specify meal type for better selection
    const breakfast = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.breakfast.calories, 
      genericRequirements.meals.breakfast.protein, usedRecipeIds, 'breakfast');
    if (breakfast) {
      usedRecipeIds.push(breakfast.id);
      mealPlanItems.push(createMealPlanItem(
        mealPlanId,
        breakfast,
        dateStr,
        "breakfast",
        "A balanced breakfast to start your day"
      ));
    }
    
    // Add lunch - specify meal type for better selection
    const lunch = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.lunch.calories, 
      genericRequirements.meals.lunch.protein, usedRecipeIds, 'lunch');
    if (lunch) {
      usedRecipeIds.push(lunch.id);
      mealPlanItems.push(createMealPlanItem(
        mealPlanId,
        lunch,
        dateStr,
        "lunch",
        "A satisfying lunch with good protein content"
      ));
    }
    
    // Add dinner - specify meal type for better selection
    const dinner = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.dinner.calories, 
      genericRequirements.meals.dinner.protein, usedRecipeIds, 'dinner');
    if (dinner) {
      usedRecipeIds.push(dinner.id);
      mealPlanItems.push(createMealPlanItem(
        mealPlanId,
        dinner,
        dateStr,
        "dinner",
        "A nutritious dinner to end your day"
      ));
    }
    
    // Add snack - specify meal type for better selection
    const snack = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.snack.calories, 
      genericRequirements.meals.snack.protein, usedRecipeIds, 'snack');
    if (snack && Math.random() > 0.3) { // 70% chance of having a snack
      mealPlanItems.push(createMealPlanItem(
        mealPlanId,
        snack,
        dateStr,
        "snack",
        "A light snack to keep you going"
      ));
    }
  }
  
  return mealPlanItems;
}
