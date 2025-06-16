
// Functions for generating meal plan items
import { UserProfile, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { filterRecipesByPreferences, prioritizeRecipes, getContextForMeal } from './recipeUtils';
import { calculateDailyRequirements, getGenericRequirements } from './requirements';
import { RecipeDiversityManager } from './recipeSelection';
import { isSameDay, parseISO } from 'date-fns';

/**
 * Generates a run-based snack meal plan item
 */
function createRunSnackItem(
  mealPlanId: string,
  date: string,
  snackType: 'pre_run_snack' | 'post_run_snack'
): Partial<MealPlanItem> {
  if (snackType === 'pre_run_snack') {
    return {
      id: crypto.randomUUID(),
      meal_plan_id: mealPlanId,
      recipe_id: null,
      date,
      meal_type: 'pre_run_snack',
      nutritional_context: 'Pre-run fuel: Light carbs for quick energy, consumed 30-60 minutes before running',
      custom_title: 'Banana with a small amount of honey',
      calories: 150,
      protein: 2,
      carbs: 35,
      fat: 1
    };
  } else {
    return {
      id: crypto.randomUUID(),
      meal_plan_id: mealPlanId,
      recipe_id: null,
      date,
      meal_type: 'post_run_snack',
      nutritional_context: 'Post-run recovery: Protein and carbs within 30 minutes to aid muscle recovery',
      custom_title: 'Greek yogurt with berries',
      calories: 200,
      protein: 12,
      carbs: 25,
      fat: 6
    };
  }
}

/**
 * Checks if a specific date has any runs
 */
function hasRunsOnDate(date: Date, runs: any[]): boolean {
  return runs.some(run => {
    const runDate = new Date(run.date);
    return isSameDay(runDate, date);
  });
}

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
  console.log('Generating generic meal plan items with seasonal filtering, diversity management, and run-based snacks');
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  const genericRequirements = getGenericRequirements();
  const diversityManager = new RecipeDiversityManager();
  diversityManager.reset();
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const isRunDay = hasRunsOnDate(currentDate, runs);
    console.log(`Planning meals for day ${day + 1}: ${dateStr} ${isRunDay ? '(RUN DAY)' : '(REST DAY)'}`);
    
    // Add pre-run snack if it's a run day
    if (isRunDay) {
      mealPlanItems.push(createRunSnackItem(mealPlanId, dateStr, 'pre_run_snack'));
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
    
    // Add lunch (with run context if applicable)
    const lunchRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'lunch');
    const lunch = diversityManager.selectRecipeWithDiversity(
      lunchRecipes,
      genericRequirements.mealDistribution.lunch, 
      genericRequirements.proteinGrams * 0.40
    );
    
    if (lunch) {
      const lunchContext = isRunDay 
        ? "POST-RUN RECOVERY: A satisfying lunch with good protein content for muscle recovery"
        : "A satisfying lunch with good protein content";
        
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
    
    // Add post-run snack for longer runs (5km+)
    if (isRunDay) {
      const dayRuns = runs.filter(run => {
        const runDate = new Date(run.date);
        return isSameDay(runDate, currentDate);
      });
      
      if (dayRuns.some(run => run.distance >= 5)) {
        mealPlanItems.push(createRunSnackItem(mealPlanId, dateStr, 'post_run_snack'));
      }
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
  
  console.log(`Generated ${mealPlanItems.length} meal plan items with seasonal filtering, diversity, and run-based snacks`);
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
  console.log('Generating personalized meal plan items with seasonal filtering, diversity management, and run-based snacks');
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  const diversityManager = new RecipeDiversityManager();
  diversityManager.reset();
  
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const isRunDay = hasRunsOnDate(currentDate, runs);
    console.log(`Planning personalized meals for day ${day + 1}: ${dateStr} ${isRunDay ? '(RUN DAY)' : '(REST DAY)'}`);
    
    // Add pre-run snack if it's a run day
    if (isRunDay) {
      mealPlanItems.push(createRunSnackItem(mealPlanId, dateStr, 'pre_run_snack'));
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
    
    // Add lunch (with run context if applicable)
    const lunchRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'lunch');
    const lunch = diversityManager.selectRecipeWithDiversity(
      lunchRecipes,
      requirements.mealDistribution.lunch, 
      requirements.proteinGrams * 0.40
    );
    
    if (lunch) {
      let lunchContext = getContextForMeal('lunch', lunch, profile);
      if (isRunDay) {
        lunchContext = `POST-RUN RECOVERY: ${lunchContext}`;
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
    
    // Add post-run snack for longer runs (5km+)
    if (isRunDay) {
      const dayRuns = runs.filter(run => {
        const runDate = new Date(run.date);
        return isSameDay(runDate, currentDate);
      });
      
      if (dayRuns.some(run => run.distance >= 5)) {
        mealPlanItems.push(createRunSnackItem(mealPlanId, dateStr, 'post_run_snack'));
      }
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
  
  console.log(`Generated ${mealPlanItems.length} personalized meal plan items with seasonal filtering, diversity, and run-based snacks`);
  return mealPlanItems;
}
