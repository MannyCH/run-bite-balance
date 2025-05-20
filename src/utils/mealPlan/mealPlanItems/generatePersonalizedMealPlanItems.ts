
// Generate personalized meal plan items based on calculated requirements
import { UserProfile, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { getRandomRecipe, getContextForMeal } from '../recipe';
import { createMealPlanItem } from './helpers';

export function generatePersonalizedMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  prioritizedRecipes: Recipe[],
  startDate: Date,
  dayCount: number,
  requirements: any
): Partial<MealPlanItem>[] {
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const usedRecipeIds: string[] = [];
    
    // Add breakfast - pass meal type for better selection
    const breakfast = getRandomRecipe(prioritizedRecipes, requirements.meals.breakfast.calories, 
      requirements.meals.breakfast.protein, usedRecipeIds, 'breakfast');
    if (breakfast) {
      usedRecipeIds.push(breakfast.id);
      mealPlanItems.push(createMealPlanItem(
        mealPlanId,
        breakfast,
        dateStr,
        "breakfast",
        getContextForMeal('breakfast', breakfast, profile)
      ));
    }
    
    // Add lunch - pass meal type for better selection
    const lunch = getRandomRecipe(prioritizedRecipes, requirements.meals.lunch.calories, 
      requirements.meals.lunch.protein, usedRecipeIds, 'lunch');
    if (lunch) {
      usedRecipeIds.push(lunch.id);
      mealPlanItems.push(createMealPlanItem(
        mealPlanId,
        lunch,
        dateStr,
        "lunch",
        getContextForMeal('lunch', lunch, profile)
      ));
    }
    
    // Add dinner - pass meal type for better selection
    const dinner = getRandomRecipe(prioritizedRecipes, requirements.meals.dinner.calories, 
      requirements.meals.dinner.protein, usedRecipeIds, 'dinner');
    if (dinner) {
      usedRecipeIds.push(dinner.id);
      mealPlanItems.push(createMealPlanItem(
        mealPlanId,
        dinner,
        dateStr,
        "dinner",
        getContextForMeal('dinner', dinner, profile)
      ));
    }
    
    // Add snack (only some days) - pass meal type for better selection
    if (Math.random() > 0.3) { // 70% chance of having a snack
      const snack = getRandomRecipe(prioritizedRecipes, requirements.meals.snack.calories, 
        requirements.meals.snack.protein, usedRecipeIds, 'snack');
      if (snack) {
        mealPlanItems.push(createMealPlanItem(
          mealPlanId,
          snack,
          dateStr,
          "snack",
          getContextForMeal('snack', snack, profile)
        ));
      }
    }
  }
  
  return mealPlanItems;
}
