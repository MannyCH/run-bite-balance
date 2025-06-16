
// Meal distribution and calorie calculation utilities
import type { DailyRequirements, DailyBreakdown } from "./types.ts";

/**
 * Calculate day-specific meal distribution based on activity
 */
export function calculateMealDistribution(
  targetCalories: number,
  hasRuns: boolean
): Record<string, number> {
  if (hasRuns) {
    // Run days: breakfast (25%), pre-run snack (8%), lunch as post-run (42%), dinner (25%)
    return {
      breakfast: Math.round(targetCalories * 0.25),
      pre_run_snack: Math.round(targetCalories * 0.08),
      lunch: Math.round(targetCalories * 0.42), // Lunch serves as post-run recovery
      dinner: Math.round(targetCalories * 0.25)
    };
  } else {
    // Rest days: breakfast (25%), lunch (40%), dinner (35%)
    return {
      breakfast: Math.round(targetCalories * 0.25),
      lunch: Math.round(targetCalories * 0.40),
      dinner: Math.round(targetCalories * 0.35)
    };
  }
}

/**
 * Create daily breakdown for meal planning
 */
export function createDailyBreakdown(
  dailyRequirements: Record<string, DailyRequirements>,
  runsByDate: Record<string, any[]>
): DailyBreakdown[] {
  return Object.entries(dailyRequirements).map(([date, reqs]) => {
    const dayRuns = runsByDate[date] || [];
    const isRunDay = dayRuns.length > 0;
    
    const mealDistribution = calculateMealDistribution(reqs.targetCalories, isRunDay);
    
    return {
      date,
      targetCalories: reqs.targetCalories,
      runCalories: reqs.runCalories || 0,
      hasRuns: isRunDay,
      runs: dayRuns.map(run => ({
        title: run.title,
        distance: run.distance,
        duration: Math.round(run.duration / 60)
      })),
      meals: mealDistribution
    };
  });
}
