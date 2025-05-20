
// Functions for generating meal plan items
import { UserProfile, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { 
  filterRecipesByPreferences, 
  prioritizeRecipes, 
  getRandomRecipe, 
  getContextForMeal 
} from './recipeUtils';
import { calculateDailyRequirements, getGenericRequirements } from './requirements';

// Helper function to generate meal plan items
export function generateMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  recipes: Recipe[],
  startDate: string,
  endDate: string
): Partial<MealPlanItem>[] {
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  
  // Calculate how many days we need to plan for
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

  // Filter and prioritize recipes based on user preferences
  let filteredRecipes = filterRecipesByPreferences(recipes, profile);
  let prioritizedRecipes = prioritizeRecipes(filteredRecipes, profile);

  // Get nutritional requirements
  const requirements = calculateDailyRequirements(profile);
  
  if (!requirements) {
    return generateGenericMealPlanItems(mealPlanId, prioritizedRecipes, start, dayCount);
  }

  return generatePersonalizedMealPlanItems(mealPlanId, profile, prioritizedRecipes, start, dayCount, requirements);
}

// Generate generic meal plan items when no profile requirements are available
function generateGenericMealPlanItems(
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
      mealPlanItems.push({
        id: crypto.randomUUID(), // Generate a temporary id
        meal_plan_id: mealPlanId,
        recipe_id: breakfast.id,
        date: dateStr,
        meal_type: "breakfast",
        nutritional_context: "A balanced breakfast to start your day",
        calories: breakfast.calories,
        protein: breakfast.protein,
        carbs: breakfast.carbs,
        fat: breakfast.fat
      });
    }
    
    // Add lunch - specify meal type for better selection
    const lunch = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.lunch.calories, 
      genericRequirements.meals.lunch.protein, usedRecipeIds, 'lunch');
    if (lunch) {
      usedRecipeIds.push(lunch.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Generate a temporary id
        meal_plan_id: mealPlanId,
        recipe_id: lunch.id,
        date: dateStr,
        meal_type: "lunch",
        nutritional_context: "A satisfying lunch with good protein content",
        calories: lunch.calories,
        protein: lunch.protein,
        carbs: lunch.carbs,
        fat: lunch.fat
      });
    }
    
    // Add dinner - specify meal type for better selection
    const dinner = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.dinner.calories, 
      genericRequirements.meals.dinner.protein, usedRecipeIds, 'dinner');
    if (dinner) {
      usedRecipeIds.push(dinner.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Generate a temporary id
        meal_plan_id: mealPlanId,
        recipe_id: dinner.id,
        date: dateStr,
        meal_type: "dinner",
        nutritional_context: "A nutritious dinner to end your day",
        calories: dinner.calories,
        protein: dinner.protein,
        carbs: dinner.carbs,
        fat: dinner.fat
      });
    }
    
    // Add snack - specify meal type for better selection
    const snack = getRandomRecipe(prioritizedRecipes, genericRequirements.meals.snack.calories, 
      genericRequirements.meals.snack.protein, usedRecipeIds, 'snack');
    if (snack && Math.random() > 0.3) { // 70% chance of having a snack
      mealPlanItems.push({
        id: crypto.randomUUID(), // Generate a temporary id
        meal_plan_id: mealPlanId,
        recipe_id: snack.id,
        date: dateStr,
        meal_type: "snack",
        nutritional_context: "A light snack to keep you going",
        calories: snack.calories,
        protein: snack.protein,
        carbs: snack.carbs,
        fat: snack.fat
      });
    }
  }
  
  return mealPlanItems;
}

// Generate personalized meal plan items based on calculated requirements
function generatePersonalizedMealPlanItems(
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
      mealPlanItems.push({
        id: crypto.randomUUID(), // Add required id field
        meal_plan_id: mealPlanId,
        recipe_id: breakfast.id,
        date: dateStr,
        meal_type: "breakfast",
        nutritional_context: getContextForMeal('breakfast', breakfast, profile),
        calories: breakfast.calories,
        protein: breakfast.protein,
        carbs: breakfast.carbs,
        fat: breakfast.fat
      });
    }
    
    // Add lunch - pass meal type for better selection
    const lunch = getRandomRecipe(prioritizedRecipes, requirements.meals.lunch.calories, 
      requirements.meals.lunch.protein, usedRecipeIds, 'lunch');
    if (lunch) {
      usedRecipeIds.push(lunch.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Add required id field
        meal_plan_id: mealPlanId,
        recipe_id: lunch.id,
        date: dateStr,
        meal_type: "lunch",
        nutritional_context: getContextForMeal('lunch', lunch, profile),
        calories: lunch.calories,
        protein: lunch.protein,
        carbs: lunch.carbs,
        fat: lunch.fat
      });
    }
    
    // Add dinner - pass meal type for better selection
    const dinner = getRandomRecipe(prioritizedRecipes, requirements.meals.dinner.calories, 
      requirements.meals.dinner.protein, usedRecipeIds, 'dinner');
    if (dinner) {
      usedRecipeIds.push(dinner.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Add required id field
        meal_plan_id: mealPlanId,
        recipe_id: dinner.id,
        date: dateStr,
        meal_type: "dinner",
        nutritional_context: getContextForMeal('dinner', dinner, profile),
        calories: dinner.calories,
        protein: dinner.protein,
        carbs: dinner.carbs,
        fat: dinner.fat
      });
    }
    
    // Add snack (only some days) - pass meal type for better selection
    if (Math.random() > 0.3) { // 70% chance of having a snack
      const snack = getRandomRecipe(prioritizedRecipes, requirements.meals.snack.calories, 
        requirements.meals.snack.protein, usedRecipeIds, 'snack');
      if (snack) {
        mealPlanItems.push({
          id: crypto.randomUUID(), // Add required id field
          meal_plan_id: mealPlanId,
          recipe_id: snack.id,
          date: dateStr,
          meal_type: "snack",
          nutritional_context: getContextForMeal('snack', snack, profile),
          calories: snack.calories,
          protein: snack.protein,
          carbs: snack.carbs,
          fat: snack.fat
        });
      }
    }
  }
  
  return mealPlanItems;
}
