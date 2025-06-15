
// Nutrition and calorie calculation utilities
import type { UserProfile } from "../../../src/types/profile.ts";
import type { DailyRequirements } from "./types.ts";

// Calculate daily caloric and macronutrient requirements
export function calculateDailyRequirements(profile: UserProfile): DailyRequirements | null {
  if (!profile.bmr || !profile.activity_level || !profile.fitness_goal) {
    return null;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const maintenanceCalories = profile.bmr * activityMultipliers[profile.activity_level];
  
  let targetCalories;
  switch (profile.fitness_goal) {
    case 'lose':
      targetCalories = maintenanceCalories - 500; // 500 calorie deficit
      break;
    case 'gain':
      targetCalories = maintenanceCalories + 300; // 300 calorie surplus
      break;
    default:
      targetCalories = maintenanceCalories;
  }

  // Calculate macronutrient targets (in grams)
  const proteinGrams = Math.round((profile.weight || 70) * 1.6); // 1.6g per kg body weight
  const fatGrams = Math.round((targetCalories * 0.25) / 9); // 25% of calories from fat
  const carbGrams = Math.round((targetCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);

  return {
    targetCalories: Math.round(targetCalories),
    maintenanceCalories: Math.round(maintenanceCalories),
    proteinGrams,
    fatGrams,
    carbGrams,
    mealDistribution: {
      breakfast: Math.round(targetCalories * 0.25),
      lunch: Math.round(targetCalories * 0.40),
      dinner: Math.round(targetCalories * 0.35)
    }
  };
}

// Estimate calories burned during a run
export function estimateRunCalories(run: any, userWeight: number = 70): number {
  // Basic calculation: ~0.75 calories per kg per km
  const caloriesPerKmPerKg = 0.75;
  const distance = run.distance || 0;
  return Math.round(distance * userWeight * caloriesPerKmPerKg);
}

// Calculate day-specific requirements including run calories
export function calculateDaySpecificRequirements(baseRequirements: DailyRequirements, runs: any[], userWeight: number = 70): DailyRequirements {
  if (!runs || runs.length === 0) {
    return baseRequirements;
  }

  // Calculate total calories burned from all runs on this day
  const runCalories = runs.reduce((total, run) => total + estimateRunCalories(run, userWeight), 0);
  
  // Add run calories to base target
  const adjustedCalories = baseRequirements.targetCalories + runCalories;
  
  // Recalculate meal distribution with adjusted calories
  return {
    ...baseRequirements,
    targetCalories: adjustedCalories,
    runCalories,
    mealDistribution: {
      breakfast: Math.round(adjustedCalories * 0.25),
      lunch: Math.round(adjustedCalories * 0.40),
      dinner: Math.round(adjustedCalories * 0.35)
    }
  };
}
