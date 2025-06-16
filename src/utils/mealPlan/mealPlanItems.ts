
// Functions for generating meal plan items
import { UserProfile, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';
import { filterRecipesByPreferences, prioritizeRecipes, getContextForMeal } from './recipeUtils';
import { calculateDailyRequirements, getGenericRequirements } from './requirements';
import { RecipeDiversityManager } from './recipeSelection';
import { isSameDay, parseISO, getHours } from 'date-fns';

/**
 * Checks if a run is scheduled during lunch time (11:00-14:00)
 */
function isLunchTimeRun(run: any): boolean {
  const runDate = new Date(run.date);
  const hour = getHours(runDate);
  return hour >= 11 && hour <= 14;
}

/**
 * Selects an appropriate recipe for snacks from existing recipes
 */
function selectSnackRecipe(
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
    
    // Check if this day has any runs and their timing
    const dayRuns = runs.filter(run => {
      const runDate = new Date(run.date);
      return isSameDay(runDate, currentDate);
    });
    
    const isRunDay = dayRuns.length > 0;
    const hasLunchTimeRun = dayRuns.some(run => isLunchTimeRun(run));
    console.log(`Planning meals for day ${day + 1}: ${dateStr} ${isRunDay ? '(RUN DAY)' : '(REST DAY)'}, lunch-time run: ${hasLunchTimeRun}`);
    
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
    
    // Add lunch (with run context if applicable)
    const lunchRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'lunch');
    const lunch = diversityManager.selectRecipeWithDiversity(
      lunchRecipes,
      genericRequirements.mealDistribution.lunch, 
      genericRequirements.proteinGrams * 0.40
    );
    
    if (lunch) {
      let lunchContext = "A satisfying lunch with good protein content";
      if (hasLunchTimeRun) {
        lunchContext = "POST-RUN RECOVERY LUNCH: Enhanced nutrition for muscle recovery after your lunch-time run";
      } else if (isRunDay) {
        lunchContext = "RUN DAY LUNCH: A satisfying lunch with good protein content for your training day";
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
    
    // Add post-run snack only if it's NOT a lunch-time run and it's a longer run
    if (isRunDay && !hasLunchTimeRun && dayRuns.some(run => run.distance >= 5)) {
      const postRunSnack = selectSnackRecipe(prioritizedRecipes, 'post_run_snack', diversityManager);
      if (postRunSnack) {
        mealPlanItems.push({
          id: crypto.randomUUID(),
          meal_plan_id: mealPlanId,
          recipe_id: postRunSnack.id,
          date: dateStr,
          meal_type: 'post_run_snack',
          nutritional_context: `Post-run recovery: ${postRunSnack.title} helps with muscle recovery after your run`,
          calories: postRunSnack.calories,
          protein: postRunSnack.protein,
          carbs: postRunSnack.carbs,
          fat: postRunSnack.fat
        });
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
    
    // Check if this day has any runs and their timing
    const dayRuns = runs.filter(run => {
      const runDate = new Date(run.date);
      return isSameDay(runDate, currentDate);
    });
    
    const isRunDay = dayRuns.length > 0;
    const hasLunchTimeRun = dayRuns.some(run => isLunchTimeRun(run));
    console.log(`Planning personalized meals for day ${day + 1}: ${dateStr} ${isRunDay ? '(RUN DAY)' : '(REST DAY)'}, lunch-time run: ${hasLunchTimeRun}`);
    
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
    
    // Add lunch (with run context if applicable)
    const lunchRecipes = diversityManager.getRecipesForMealType(prioritizedRecipes, 'lunch');
    const lunch = diversityManager.selectRecipeWithDiversity(
      lunchRecipes,
      requirements.mealDistribution.lunch, 
      requirements.proteinGrams * 0.40
    );
    
    if (lunch) {
      let lunchContext = getContextForMeal('lunch', lunch, profile);
      if (hasLunchTimeRun) {
        lunchContext = `POST-RUN RECOVERY LUNCH: ${lunchContext} Enhanced for muscle recovery after your lunch-time run.`;
      } else if (isRunDay) {
        lunchContext = `RUN DAY LUNCH: ${lunchContext}`;
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
    
    // Add post-run snack only if it's NOT a lunch-time run and it's a longer run
    if (isRunDay && !hasLunchTimeRun && dayRuns.some(run => run.distance >= 5)) {
      const postRunSnack = selectSnackRecipe(prioritizedRecipes, 'post_run_snack', diversityManager);
      if (postRunSnack) {
        mealPlanItems.push({
          id: crypto.randomUUID(),
          meal_plan_id: mealPlanId,
          recipe_id: postRunSnack.id,
          date: dateStr,
          meal_type: 'post_run_snack',
          nutritional_context: `Post-run recovery: ${postRunSnack.title} helps with muscle recovery after your run`,
          calories: postRunSnack.calories,
          protein: postRunSnack.protein,
          carbs: postRunSnack.carbs,
          fat: postRunSnack.fat
        });
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
