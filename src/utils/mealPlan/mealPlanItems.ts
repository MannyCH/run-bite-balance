
// Functions for generating meal plan items
import { UserProfile, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { filterRecipesByPreferences, prioritizeRecipes, getContextForMeal } from './recipeUtils';
import { calculateDailyRequirements, getGenericRequirements } from './requirements';
import { RecipeDiversityManager } from './recipeSelection';
import { hasRunsOnDate } from './runTimingUtils';
import { selectSnackRecipe } from './snackSelectionUtils';

// Helper function to generate meal plan items
export function generateMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  recipes: Recipe[],
  startDate: string,
  endDate: string,
  runs: any[] = []
): Partial<MealPlanItem>[] {
  console.log(`Generating meal plan items with ${recipes.length} recipes and ${runs.length} runs`);
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
    return generateGenericMealPlanItems(mealPlanId, prioritizedRecipes, start, dayCount, runs);
  }

  return generatePersonalizedMealPlanItems(mealPlanId, profile, prioritizedRecipes, start, dayCount, requirements, runs);
}

// Generate generic meal plan items when no profile requirements are available
function generateGenericMealPlanItems(
  mealPlanId: string,
  prioritizedRecipes: Recipe[],
  startDate: Date,
  dayCount: number,
  runs: any[] = []
): Partial<MealPlanItem>[] {
  console.log('Generating generic meal plan items with seasonal filtering, diversity management, and simplified run logic');
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  const genericRequirements = getGenericRequirements();
  const diversityManager = new RecipeDiversityManager();
  diversityManager.reset();
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if this day has any runs
    const isRunDay = hasRunsOnDate(runs, currentDate);
    console.log(`Planning meals for day ${day + 1}: ${dateStr} ${isRunDay ? '(RUN DAY)' : '(REST DAY)'}`);
    
    // Add pre-run snack if it's a run day
    if (isRunDay) {
      const preRunSnack = selectSnackRecipe(prioritizedRecipes, 'pre_run_snack', diversityManager);
      if (preRunSnack) {
        mealPlanItems.push({
          id: crypto.randomUUID(),
          meal_plan_id: mealPlanId,
          recipe_id: preRunSnack.id,
          date: dateStr,
          meal_type: 'pre_run_snack',
          nutritional_context: `Pre-run fuel: ${preRunSnack.title} provides quick energy for your run`,
          calories: preRunSnack.calories,
          protein: preRunSnack.protein,
          carbs: preRunSnack.carbs,
          fat: preRunSnack.fat
        });
      }
    }
    
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
    
    // Add lunch (enhanced for recovery on run days)
    const lunchRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'lunch');
    const lunch = diversityManager.selectRecipeWithDiversity(
      lunchRecipes,
      genericRequirements.mealDistribution.lunch, 
      genericRequirements.proteinGrams * 0.40
    );
    
    if (lunch) {
      let lunchContext = "A satisfying lunch with good protein content";
      if (isRunDay) {
        lunchContext = "POST-RUN RECOVERY LUNCH: Enhanced nutrition for muscle recovery and glycogen replenishment after your run";
      }
        
      mealPlanItems.push({
        id: crypto.randomUUID(),
        meal_plan_id: mealPlanId,
        recipe_id: lunch.id,
        date: dateStr,
        meal_type: "lunch",
        nutritional_context: lunchContext,
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
  
  console.log(`Generated ${mealPlanItems.length} meal plan items with seasonal filtering, diversity, and simplified run logic`);
  return mealPlanItems;
}

// Generate personalized meal plan items based on calculated requirements
function generatePersonalizedMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  prioritizedRecipes: Recipe[],
  startDate: Date,
  dayCount: number,
  requirements: any,
  runs: any[] = []
): Partial<MealPlanItem>[] {
  console.log('Generating personalized meal plan items with seasonal filtering, diversity management, and simplified run logic');
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  const diversityManager = new RecipeDiversityManager();
  diversityManager.reset();
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if this day has any runs
    const isRunDay = hasRunsOnDate(runs, currentDate);
    console.log(`Planning personalized meals for day ${day + 1}: ${dateStr} ${isRunDay ? '(RUN DAY)' : '(REST DAY)'}`);
    
    // Add pre-run snack if it's a run day
    if (isRunDay) {
      const preRunSnack = selectSnackRecipe(prioritizedRecipes, 'pre_run_snack', diversityManager);
      if (preRunSnack) {
        mealPlanItems.push({
          id: crypto.randomUUID(),
          meal_plan_id: mealPlanId,
          recipe_id: preRunSnack.id,
          date: dateStr,
          meal_type: 'pre_run_snack',
          nutritional_context: `Pre-run fuel: ${preRunSnack.title} provides quick energy for your run`,
          calories: preRunSnack.calories,
          protein: preRunSnack.protein,
          carbs: preRunSnack.carbs,
          fat: preRunSnack.fat
        });
      }
    }
    
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
    
    // Add lunch (enhanced for recovery on run days)
    const lunchRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'lunch');
    const lunch = diversityManager.selectRecipeWithDiversity(
      lunchRecipes,
      requirements.mealDistribution.lunch, 
      requirements.proteinGrams * 0.40
    );
    
    if (lunch) {
      let lunchContext = getContextForMeal('lunch', lunch, profile);
      if (isRunDay) {
        lunchContext = `POST-RUN RECOVERY LUNCH: ${lunchContext} Enhanced for muscle recovery and glycogen replenishment after your run.`;
      }
      
      mealPlanItems.push({
        id: crypto.randomUUID(),
        meal_plan_id: mealPlanId,
        recipe_id: lunch.id,
        date: dateStr,
        meal_type: "lunch",
        nutritional_context: lunchContext,
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
  
  console.log(`Generated ${mealPlanItems.length} personalized meal plan items with seasonal filtering, diversity, and simplified run logic`);
  return mealPlanItems;
}
