
// Functions for calculating nutritional requirements
import { UserProfile } from '@/types/profile';
import { DailyRequirements } from './types';

// Calculate daily requirements based on user profile
export function calculateDailyRequirements(profile: UserProfile): DailyRequirements | null {
  if (!profile.bmr) return null;

  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const multiplier = profile.activity_level ? 
    activityMultipliers[profile.activity_level as keyof typeof activityMultipliers] : 
    1.5; // Default to moderate

  // Calculate daily calories
  let dailyCalories = profile.bmr * multiplier;
  
  // Adjust based on fitness goal
  if (profile.fitness_goal === 'lose') {
    dailyCalories *= 0.85; // 15% deficit for weight loss
  } else if (profile.fitness_goal === 'gain') {
    dailyCalories *= 1.1; // 10% surplus for weight gain
  }

  // Calculate macronutrient targets
  let proteinPct, fatPct, carbsPct;
  
  if (profile.fitness_goal === 'lose') {
    proteinPct = 0.35; // Higher protein for weight loss
    fatPct = 0.35;
    carbsPct = 0.3;
  } else if (profile.fitness_goal === 'gain') {
    proteinPct = 0.25;
    fatPct = 0.3;
    carbsPct = 0.45; // Higher carbs for weight gain
  } else {
    proteinPct = 0.3;
    fatPct = 0.3;
    carbsPct = 0.4;
  }

  // Calculate grams (protein & carbs = 4 cal/g, fat = 9 cal/g)
  const proteinGrams = (dailyCalories * proteinPct) / 4;
  const carbsGrams = (dailyCalories * carbsPct) / 4;
  const fatGrams = (dailyCalories * fatPct) / 9;

  return {
    targetCalories: dailyCalories,
    maintenanceCalories: profile.bmr * multiplier,
    proteinGrams,
    carbGrams: carbsGrams,
    fatGrams,
    mealDistribution: {
      breakfast: dailyCalories * 0.25,  // 25%
      lunch: dailyCalories * 0.40,      // 40%
      dinner: dailyCalories * 0.35      // 35%
    }
  };
}

// Generate generic requirements when profile data is incomplete
export function getGenericRequirements(): DailyRequirements {
  return {
    targetCalories: 2000,
    maintenanceCalories: 2000,
    proteinGrams: 100,
    carbGrams: 200,
    fatGrams: 67,
    mealDistribution: {
      breakfast: 500,  // 25%
      lunch: 800,      // 40%
      dinner: 700      // 35%
    }
  };
}
