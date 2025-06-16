
// Data preparation utilities for meal plan generation
import type { UserProfile } from "../../../src/types/profile.ts";
import type { DailyRequirements } from "./types.ts";
import { calculateDailyRequirements, calculateDaySpecificRequirements } from "./nutritionCalculator.ts";

/**
 * Prepare recipe data for AI processing (renamed from prepareRecipeSummaries)
 */
export function prepareRecipeData(recipes: any[]): any[] {
  return recipes.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    calories: recipe.calories || 0,
    protein: recipe.protein || 0,
    carbs: recipe.carbs || 0,
    fat: recipe.fat || 0,
    meal_type: Array.isArray(recipe.meal_type) ? recipe.meal_type : (recipe.meal_type ? [recipe.meal_type] : ['any']),
    categories: recipe.categories || [],
    ingredients: recipe.ingredients || [],
    seasonal_suitability: recipe.seasonal_suitability || ['year_round'],
    temperature_preference: recipe.temperature_preference || 'any',
    dish_type: recipe.dish_type || 'neutral'
  }));
}

/**
 * Prepare recipe summaries for AI processing
 */
export function prepareRecipeSummaries(recipes: any[]): any[] {
  return recipes.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    calories: recipe.calories || 0,
    protein: recipe.protein || 0,
    carbs: recipe.carbs || 0,
    fat: recipe.fat || 0,
    meal_type: Array.isArray(recipe.meal_type) ? recipe.meal_type[0] : recipe.meal_type || 'any',
    categories: recipe.categories || [],
    ingredients: recipe.ingredients || [],
    seasonal_suitability: recipe.seasonal_suitability || ['year_round'],
    temperature_preference: recipe.temperature_preference || 'any',
    dish_type: recipe.dish_type || 'neutral'
  }));
}

/**
 * Group runs by date
 */
export function groupRunsByDate(runs: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  runs.forEach(run => {
    // Normalize date to YYYY-MM-DD format
    const date = run.date instanceof Date ? 
      run.date.toISOString().split('T')[0] : 
      new Date(run.date).toISOString().split('T')[0];
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(run);
  });
  
  return grouped;
}

/**
 * Calculate daily requirements for all dates in the range
 */
export function calculateAllDailyRequirements(
  profile: UserProfile,
  startDate: string,
  endDate: string,
  runsByDate: Record<string, any[]>
): { baseRequirements: DailyRequirements; dailyRequirements: Record<string, DailyRequirements> } {
  const baseRequirements = calculateDailyRequirements(profile);
  if (!baseRequirements) {
    // Fallback requirements
    const fallback = {
      targetCalories: 2000,
      maintenanceCalories: 2000,
      proteinGrams: 100,
      fatGrams: 67,
      carbGrams: 250,
      mealDistribution: {
        breakfast: 500,
        lunch: 800,
        dinner: 700
      }
    };
    return { 
      baseRequirements: fallback, 
      dailyRequirements: { [startDate]: fallback }
    };
  }

  const dailyRequirements: Record<string, DailyRequirements> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const runsForDay = runsByDate[dateStr] || [];
    
    dailyRequirements[dateStr] = calculateDaySpecificRequirements(
      baseRequirements,
      runsForDay,
      profile.weight || 70
    );
  }
  
  return { baseRequirements, dailyRequirements };
}

/**
 * Validate recipe data quality
 */
export function validateRecipeData(recipes: any[]): boolean {
  const hasValidRecipes = recipes.length > 0;
  const hasNutritionData = recipes.some(r => r.calories > 0 && r.protein > 0);
  const hasMealTypes = recipes.some(r => r.meal_type && r.meal_type !== 'any');
  
  console.log(`Recipe validation: ${recipes.length} recipes, nutrition: ${hasNutritionData}, meal types: ${hasMealTypes}`);
  
  return hasValidRecipes && hasNutritionData;
}
