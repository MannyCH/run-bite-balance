
// Data preparation utilities for meal plan generation
import type { UserProfile } from "../../../src/types/profile.ts";
import type { DailyRequirements, RecipeSummary } from "./types.ts";
import { calculateDailyRequirements, calculateDaySpecificRequirements } from "./nutritionCalculator.ts";

/**
 * Prepare recipe summaries for OpenAI
 */
export function prepareRecipeSummaries(recipes: any[]): RecipeSummary[] {
  return recipes.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    ingredients: recipe.ingredients || [],
    categories: recipe.categories || [],
  }));
}

/**
 * Group runs by date
 */
export function groupRunsByDate(runs: any[]): Record<string, any[]> {
  const runsByDate: Record<string, any[]> = {};
  runs.forEach(run => {
    const runDate = new Date(run.date).toISOString().split('T')[0];
    if (!runsByDate[runDate]) {
      runsByDate[runDate] = [];
    }
    runsByDate[runDate].push(run);
  });
  return runsByDate;
}

/**
 * Calculate daily requirements for all days in the meal plan
 */
export function calculateAllDailyRequirements(
  profile: UserProfile,
  startDate: string,
  endDate: string,
  runsByDate: Record<string, any[]>
): { baseRequirements: DailyRequirements; dailyRequirements: Record<string, DailyRequirements> } {
  // Calculate base daily requirements
  const baseRequirements = calculateDailyRequirements(profile);
  if (!baseRequirements) {
    throw new Error("Unable to calculate daily requirements - missing profile data");
  }

  // Calculate dates for the meal plan
  const today = new Date(startDate);
  const endDateObj = new Date(endDate);
  const dayCount = Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24)) + 1;
  
  // Calculate day-specific requirements
  const dailyRequirements: Record<string, DailyRequirements> = {};
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const dayRuns = runsByDate[dateStr] || [];
    dailyRequirements[dateStr] = calculateDaySpecificRequirements(
      baseRequirements, 
      dayRuns, 
      profile.weight || 70
    );
  }

  return { baseRequirements, dailyRequirements };
}
