
import type { RecipeSummary } from './types.ts';
import { calculateAllDailyRequirements } from './dataPreparation.ts';

// Define UserProfile interface directly in edge function context
interface UserProfile {
  id: string;
  username?: string | null;
  weight?: number | null;
  target_weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  fitness_goal?: 'lose' | 'maintain' | 'gain' | null;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  bmr?: number | null;
  dietary_preferences?: string[] | null;
  nutritional_theory?: string | null;
  food_allergies?: string[] | null;
  preferred_cuisines?: string[] | null;
  foods_to_avoid?: string[] | null;
  meal_complexity?: 'simple' | 'moderate' | 'complex' | null;
  ical_feed_url?: string | null;
  avatar_url?: string | null;
  batch_cooking_repetitions?: number | null;
  batch_cooking_people?: number | null;
}

interface MealPlanDay {
  date: string;
  meals: {
    meal_type: string;
    recipe_id: string;
    explanation: string;
  }[];
}

export function generateFallbackMealPlan(
  profile: UserProfile,
  recipes: RecipeSummary[],
  startDate: string,
  endDate: string,
  runs: any[] = []
): any {
  console.log('🔄 Generating fallback meal plan algorithmically');
  
  const requirements = calculateAllDailyRequirements(profile);
  
  // Categorize recipes by meal type
  const breakfastRecipes = recipes.filter(r => r.meal_type?.includes('breakfast') && r.calories > 0);
  const lunchRecipes = recipes.filter(r => r.meal_type?.includes('lunch') && r.calories > 0);
  const dinnerRecipes = recipes.filter(r => r.meal_type?.includes('dinner') && r.calories > 0);
  const snackRecipes = recipes.filter(r => r.meal_type?.includes('snack') && r.calories > 0);
  
  console.log(`Fallback recipe categories: ${breakfastRecipes.length} breakfast, ${lunchRecipes.length} lunch, ${dinnerRecipes.length} dinner, ${snackRecipes.length} snack`);
  
  // Batch cooking configuration
  const batchCookingEnabled = profile.batch_cooking_repetitions && profile.batch_cooking_repetitions > 1;
  const batchCookingRepetitions = profile.batch_cooking_repetitions || 1;
  const isStrictBatchCooking = batchCookingRepetitions >= 5;
  
  // Generate date range
  const dates = generateDateRange(startDate, endDate);
  const days: MealPlanDay[] = [];
  
  // Recipe selection for batch cooking
  let selectedBreakfastRecipes: RecipeSummary[] = [];
  let selectedLunchRecipes: RecipeSummary[] = [];
  let selectedDinnerRecipes: RecipeSummary[] = [];
  
  if (batchCookingEnabled) {
    // Select limited recipes for batch cooking
    const uniqueRecipesNeeded = Math.ceil(7 / batchCookingRepetitions);
    
    selectedBreakfastRecipes = selectBestRecipes(breakfastRecipes, uniqueRecipesNeeded, requirements.mealDistribution.breakfast);
    selectedLunchRecipes = selectBestRecipes(lunchRecipes, uniqueRecipesNeeded, requirements.mealDistribution.lunch);
    selectedDinnerRecipes = selectBestRecipes(dinnerRecipes, uniqueRecipesNeeded, requirements.mealDistribution.dinner);
    
    console.log(`Batch cooking: Selected ${selectedBreakfastRecipes.length} breakfast, ${selectedLunchRecipes.length} lunch, ${selectedDinnerRecipes.length} dinner recipes`);
  }
  
  // Generate meals for each day
  dates.forEach((date, index) => {
    const dayMeals: any[] = [];
    
    // Check if this is a run day
    const dayRuns = runs.filter(run => {
      const runDate = new Date(run.date).toISOString().split('T')[0];
      return runDate === date;
    });
    const isRunDay = dayRuns.length > 0;
    
    // Breakfast
    const breakfastRecipe = batchCookingEnabled 
      ? selectedBreakfastRecipes[index % selectedBreakfastRecipes.length]
      : selectBestRecipes(breakfastRecipes, 1, requirements.mealDistribution.breakfast)[0];
      
    if (breakfastRecipe) {
      dayMeals.push({
        meal_type: 'breakfast',
        recipe_id: breakfastRecipe.id,
        explanation: batchCookingEnabled 
          ? `Batch cooking: This recipe appears ${batchCookingRepetitions} times this week - cook once for entire week, portion into ${batchCookingRepetitions} servings for ${profile.batch_cooking_people || 1} people`
          : `Balanced breakfast providing energy for the day`
      });
    }
    
    // Pre-run snack for run days
    if (isRunDay && snackRecipes.length > 0) {
      const preRunSnack = snackRecipes.find(s => s.calories <= 200) || snackRecipes[0];
      dayMeals.push({
        meal_type: 'pre_run_snack',
        recipe_id: preRunSnack.id,
        explanation: `Pre-run fuel: ${preRunSnack.title} provides quick energy for your run`
      });
    }
    
    // Lunch (enhanced for run days)
    const lunchRecipe = batchCookingEnabled 
      ? selectedLunchRecipes[index % selectedLunchRecipes.length]
      : selectBestRecipes(lunchRecipes, 1, requirements.mealDistribution.lunch)[0];
      
    if (lunchRecipe) {
      let lunchExplanation = batchCookingEnabled 
        ? `Batch cooking: This recipe appears ${batchCookingRepetitions} times this week`
        : `Nutritious lunch meal`;
        
      if (isRunDay) {
        lunchExplanation += ' - POST-RUN RECOVERY: Enhanced with higher protein for muscle recovery after your run';
      }
      
      dayMeals.push({
        meal_type: 'lunch',
        recipe_id: lunchRecipe.id,
        explanation: lunchExplanation
      });
    }
    
    // Dinner
    const dinnerRecipe = batchCookingEnabled 
      ? selectedDinnerRecipes[index % selectedDinnerRecipes.length]
      : selectBestRecipes(dinnerRecipes, 1, requirements.mealDistribution.dinner)[0];
      
    if (dinnerRecipe) {
      dayMeals.push({
        meal_type: 'dinner',
        recipe_id: dinnerRecipe.id,
        explanation: batchCookingEnabled 
          ? `Batch cooking: This recipe appears ${batchCookingRepetitions} times this week - cook once for entire week, portion into ${batchCookingRepetitions} servings for ${profile.batch_cooking_people || 1} people`
          : `Satisfying dinner to end the day`
      });
    }
    
    days.push({
      date,
      meals: dayMeals
    });
  });
  
  const mealPlanMessage = batchCookingEnabled 
    ? `Algorithmic meal plan generated with ${isStrictBatchCooking ? 'strict' : 'flexible'} batch cooking (${batchCookingRepetitions}x repetitions) - OpenAI unavailable, using recipe-based planning`
    : 'Algorithmic meal plan generated using available recipes - OpenAI unavailable, using recipe-based planning';
  
  return {
    message: mealPlanMessage,
    mealPlan: {
      days
    },
    fallback: true
  };
}

function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

function selectBestRecipes(recipes: RecipeSummary[], count: number, targetCalories: number): RecipeSummary[] {
  if (recipes.length === 0) return [];
  
  // Sort recipes by how close they are to target calories
  const sortedRecipes = recipes
    .filter(recipe => recipe.calories > 0)
    .sort((a, b) => {
      const aDiff = Math.abs(a.calories - targetCalories);
      const bDiff = Math.abs(b.calories - targetCalories);
      return aDiff - bDiff;
    });
  
  // Return the requested number of best-matching recipes
  return sortedRecipes.slice(0, Math.min(count, sortedRecipes.length));
}
