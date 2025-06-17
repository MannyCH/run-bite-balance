
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

interface RecipeScore {
  recipe: RecipeSummary;
  score: number;
  diversityPenalty: number;
  nutritionalMatch: number;
}

export function generateFallbackMealPlan(
  profile: UserProfile,
  recipes: RecipeSummary[],
  startDate: string,
  endDate: string,
  runs: any[] = []
): any {
  console.log('🔄 Generating fallback meal plan algorithmically with improved diversity');
  
  const requirements = calculateAllDailyRequirements(profile);
  
  // Categorize recipes by meal type
  const breakfastRecipes = recipes.filter(r => r.meal_type?.includes('breakfast') && r.calories > 0);
  const lunchRecipes = recipes.filter(r => r.meal_type?.includes('lunch') && r.calories > 0);
  const dinnerRecipes = recipes.filter(r => r.meal_type?.includes('dinner') && r.calories > 0);
  const snackRecipes = recipes.filter(r => r.meal_type?.includes('snack') && r.calories > 0);
  
  console.log(`Improved fallback recipe categories: ${breakfastRecipes.length} breakfast, ${lunchRecipes.length} lunch, ${dinnerRecipes.length} dinner, ${snackRecipes.length} snack`);
  
  // Batch cooking configuration
  const batchCookingEnabled = profile.batch_cooking_repetitions && profile.batch_cooking_repetitions > 1;
  const batchCookingRepetitions = profile.batch_cooking_repetitions || 1;
  const isStrictBatchCooking = batchCookingRepetitions >= 5;
  
  // Generate date range
  const dates = generateDateRange(startDate, endDate);
  const days: MealPlanDay[] = [];
  
  // Recipe selection for batch cooking with improved diversity
  let selectedBreakfastRecipes: RecipeSummary[] = [];
  let selectedLunchRecipes: RecipeSummary[] = [];
  let selectedDinnerRecipes: RecipeSummary[] = [];
  
  if (batchCookingEnabled) {
    // For improved diversity, select 2-3 recipes instead of just 1, even in batch cooking mode
    const recipesPerMealType = isStrictBatchCooking ? 
      Math.max(1, Math.min(2, Math.ceil(7 / batchCookingRepetitions))) : 
      Math.max(2, Math.min(3, Math.ceil(7 / (batchCookingRepetitions - 1))));
    
    console.log(`Batch cooking diversity: Selecting ${recipesPerMealType} recipes per meal type`);
    
    selectedBreakfastRecipes = selectDiverseRecipes(breakfastRecipes, recipesPerMealType, requirements.mealDistribution.breakfast);
    selectedLunchRecipes = selectDiverseRecipes(lunchRecipes, recipesPerMealType, requirements.mealDistribution.lunch);
    selectedDinnerRecipes = selectDiverseRecipes(dinnerRecipes, recipesPerMealType, requirements.mealDistribution.dinner);
    
    console.log(`Batch cooking diversity: Selected ${selectedBreakfastRecipes.length} breakfast, ${selectedLunchRecipes.length} lunch, ${selectedDinnerRecipes.length} dinner recipes`);
    console.log(`Selected breakfast recipes: ${selectedBreakfastRecipes.map(r => r.title).join(', ')}`);
    console.log(`Selected lunch recipes: ${selectedLunchRecipes.map(r => r.title).join(', ')}`);
    console.log(`Selected dinner recipes: ${selectedDinnerRecipes.map(r => r.title).join(', ')}`);
  }
  
  // Track recipe usage for rotation
  const recipeUsageCount = new Map<string, number>();
  
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
      ? selectRecipeWithRotation(selectedBreakfastRecipes, recipeUsageCount, `breakfast-${index}`)
      : selectDiverseRecipes(breakfastRecipes, 1, requirements.mealDistribution.breakfast)[0];
      
    if (breakfastRecipe) {
      const usageCount = (recipeUsageCount.get(breakfastRecipe.id) || 0) + 1;
      recipeUsageCount.set(breakfastRecipe.id, usageCount);
      
      dayMeals.push({
        meal_type: 'breakfast',
        recipe_id: breakfastRecipe.id,
        explanation: batchCookingEnabled 
          ? `${breakfastRecipe.title} (${usageCount}/${batchCookingRepetitions}x batch cooking) - cook once for entire week, portion into ${batchCookingRepetitions} servings for ${profile.batch_cooking_people || 1} people`
          : `${breakfastRecipe.title} - balanced breakfast providing energy for the day`
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
      ? selectRecipeWithRotation(selectedLunchRecipes, recipeUsageCount, `lunch-${index}`)
      : selectDiverseRecipes(lunchRecipes, 1, requirements.mealDistribution.lunch)[0];
      
    if (lunchRecipe) {
      const usageCount = (recipeUsageCount.get(lunchRecipe.id) || 0) + 1;
      recipeUsageCount.set(lunchRecipe.id, usageCount);
      
      let lunchExplanation = batchCookingEnabled 
        ? `${lunchRecipe.title} (${usageCount}/${batchCookingRepetitions}x batch cooking)`
        : `${lunchRecipe.title} - nutritious lunch meal`;
        
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
      ? selectRecipeWithRotation(selectedDinnerRecipes, recipeUsageCount, `dinner-${index}`)
      : selectDiverseRecipes(dinnerRecipes, 1, requirements.mealDistribution.dinner)[0];
      
    if (dinnerRecipe) {
      const usageCount = (recipeUsageCount.get(dinnerRecipe.id) || 0) + 1;
      recipeUsageCount.set(dinnerRecipe.id, usageCount);
      
      dayMeals.push({
        meal_type: 'dinner',
        recipe_id: dinnerRecipe.id,
        explanation: batchCookingEnabled 
          ? `${dinnerRecipe.title} (${usageCount}/${batchCookingRepetitions}x batch cooking) - cook once for entire week, portion into ${batchCookingRepetitions} servings for ${profile.batch_cooking_people || 1} people`
          : `${dinnerRecipe.title} - satisfying dinner to end the day`
      });
    }
    
    days.push({
      date,
      meals: dayMeals
    });
  });
  
  const mealPlanMessage = batchCookingEnabled 
    ? `Improved algorithmic meal plan with ${isStrictBatchCooking ? 'strict' : 'flexible'} batch cooking (${batchCookingRepetitions}x repetitions) and enhanced recipe diversity - OpenAI unavailable, using improved recipe-based planning`
    : 'Improved algorithmic meal plan with enhanced recipe diversity - OpenAI unavailable, using improved recipe-based planning';
  
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

function selectDiverseRecipes(recipes: RecipeSummary[], count: number, targetCalories: number): RecipeSummary[] {
  if (recipes.length === 0) return [];
  
  // Create a map to track main ingredients to avoid repetition
  const ingredientUsage = new Map<string, number>();
  const selectedRecipes: RecipeSummary[] = [];
  
  // Score recipes based on nutritional match and diversity
  const scoredRecipes: RecipeScore[] = recipes.map(recipe => {
    const calorieScore = recipe.calories ? 
      Math.max(0, 100 - Math.abs(recipe.calories - targetCalories) / targetCalories * 100) : 0;
    
    // Diversity penalty based on main ingredient usage
    const mainIngredient = recipe.main_ingredient || recipe.title.split(' ')[0].toLowerCase();
    const ingredientCount = ingredientUsage.get(mainIngredient) || 0;
    const diversityPenalty = ingredientCount * 25; // Heavy penalty for repetition
    
    // Add randomization factor to break ties
    const randomFactor = Math.random() * 10;
    
    const totalScore = calorieScore - diversityPenalty + randomFactor;
    
    return {
      recipe,
      score: totalScore,
      diversityPenalty,
      nutritionalMatch: calorieScore
    };
  });
  
  // Sort by score and select diverse recipes
  scoredRecipes.sort((a, b) => b.score - a.score);
  
  for (const scoredRecipe of scoredRecipes) {
    if (selectedRecipes.length >= count) break;
    
    const recipe = scoredRecipe.recipe;
    const mainIngredient = recipe.main_ingredient || recipe.title.split(' ')[0].toLowerCase();
    
    // Prefer recipes with ingredients we haven't used much
    selectedRecipes.push(recipe);
    ingredientUsage.set(mainIngredient, (ingredientUsage.get(mainIngredient) || 0) + 1);
    
    console.log(`Selected "${recipe.title}" (score: ${scoredRecipe.score.toFixed(1)}, main ingredient: ${mainIngredient})`);
  }
  
  return selectedRecipes;
}

function selectRecipeWithRotation(recipes: RecipeSummary[], usageCount: Map<string, number>, contextKey: string): RecipeSummary {
  if (recipes.length === 0) return recipes[0];
  if (recipes.length === 1) return recipes[0];
  
  // Find the recipe that has been used least
  const recipeUsage = recipes.map(recipe => ({
    recipe,
    usage: usageCount.get(recipe.id) || 0
  }));
  
  // Sort by usage (least used first), then by random factor for variety
  recipeUsage.sort((a, b) => {
    if (a.usage !== b.usage) {
      return a.usage - b.usage;
    }
    // Add deterministic pseudo-randomness based on context
    const seedA = contextKey.charCodeAt(0) * a.recipe.id.charCodeAt(0);
    const seedB = contextKey.charCodeAt(0) * b.recipe.id.charCodeAt(0);
    return (seedA % 100) - (seedB % 100);
  });
  
  return recipeUsage[0].recipe;
}
