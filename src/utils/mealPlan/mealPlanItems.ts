
// Functions for generating meal plan items
import { UserProfile, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { filterRecipesByPreferences, prioritizeRecipes, getContextForMeal } from './recipeUtils';
import { calculateDailyRequirements, getGenericRequirements } from './requirements';
import { RecipeDiversityManager } from './recipeSelection';

// Helper function to generate meal plan items
export function generateMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  recipes: Recipe[],
  startDate: string,
  endDate: string
): Partial<MealPlanItem>[] {
  console.log(`Generating meal plan items with ${recipes.length} recipes`);
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  
  // Calculate how many days we need to plan for
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

  // Filter and prioritize recipes based on user preferences
  let filteredRecipes = filterRecipesByPreferences(recipes, profile);
  let prioritizedRecipes = prioritizeRecipes(filteredRecipes, profile);

  console.log(`Using ${prioritizedRecipes.length} filtered and prioritized recipes`);

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
  console.log('Generating generic meal plan items with seasonal filtering and diversity management');
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  const genericRequirements = getGenericRequirements();
  const diversityManager = new RecipeDiversityManager();
  diversityManager.reset();
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    console.log(`Planning meals for day ${day + 1}: ${dateStr}`);
    
    // Add breakfast
    const breakfastRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'breakfast');
    const breakfast = diversityManager.selectRecipeWithDiversity(
      breakfastRecipes,
      genericRequirements.mealDistribution.breakfast, 
      genericRequirements.proteinGrams * 0.25
    );
    
    if (breakfast) {
      mealPlanItems.push({
        id: crypto.randomUUID(),
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
    
    // Add lunch
    const lunchRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'lunch');
    const lunch = diversityManager.selectRecipeWithDiversity(
      lunchRecipes,
      genericRequirements.mealDistribution.lunch, 
      genericRequirements.proteinGrams * 0.40
    );
    
    if (lunch) {
      mealPlanItems.push({
        id: crypto.randomUUID(),
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
    
    // Add dinner
    const dinnerRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'dinner');
    const dinner = diversityManager.selectRecipeWithDiversity(
      dinnerRecipes,
      genericRequirements.mealDistribution.dinner, 
      genericRequirements.proteinGrams * 0.35
    );
    
    if (dinner) {
      mealPlanItems.push({
        id: crypto.randomUUID(),
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
    
    // Move to next day for diversity tracking
    diversityManager.nextDay();
  }
  
  console.log(`Generated ${mealPlanItems.length} meal plan items with seasonal filtering and diversity`);
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
  console.log('Generating personalized meal plan items with seasonal filtering and diversity management');
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  const diversityManager = new RecipeDiversityManager();
  diversityManager.reset();
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    console.log(`Planning personalized meals for day ${day + 1}: ${dateStr}`);
    
    // Add breakfast
    const breakfastRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'breakfast');
    const breakfast = diversityManager.selectRecipeWithDiversity(
      breakfastRecipes,
      requirements.mealDistribution.breakfast, 
      requirements.proteinGrams * 0.25
    );
    
    if (breakfast) {
      mealPlanItems.push({
        id: crypto.randomUUID(),
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
    
    // Add lunch
    const lunchRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'lunch');
    const lunch = diversityManager.selectRecipeWithDiversity(
      lunchRecipes,
      requirements.mealDistribution.lunch, 
      requirements.proteinGrams * 0.40
    );
    
    if (lunch) {
      mealPlanItems.push({
        id: crypto.randomUUID(),
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
    
    // Add dinner
    const dinnerRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'dinner');
    const dinner = diversityManager.selectRecipeWithDiversity(
      dinnerRecipes,
      requirements.mealDistribution.dinner, 
      requirements.proteinGrams * 0.35
    );
    
    if (dinner) {
      mealPlanItems.push({
        id: crypto.randomUUID(),
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
    
    // Move to next day for diversity tracking
    diversityManager.nextDay();
  }
  
  console.log(`Generated ${mealPlanItems.length} personalized meal plan items with seasonal filtering and diversity`);
  return mealPlanItems;
}
