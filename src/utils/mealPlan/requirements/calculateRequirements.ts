
// Calculate requirements based on user profile
import { UserProfile } from '@/types/profile';
import { MealRequirements } from '../types';

/**
 * Calculate daily requirements based on user profile
 */
export function calculateDailyRequirements(profile: UserProfile): MealRequirements | null {
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

  // Distribute calories throughout the day
  const breakfastCal = dailyCalories * 0.25;
  const lunchCal = dailyCalories * 0.35;
  const dinnerCal = dailyCalories * 0.3;
  const snackCal = dailyCalories * 0.1;
  
  // Distribute protein throughout the day
  const breakfastProtein = proteinGrams * 0.25;
  const lunchProtein = proteinGrams * 0.35;
  const dinnerProtein = proteinGrams * 0.3;
  const snackProtein = proteinGrams * 0.1;

  return {
    dailyCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    meals: {
      breakfast: { calories: breakfastCal, protein: breakfastProtein },
      lunch: { calories: lunchCal, protein: lunchProtein },
      dinner: { calories: dinnerCal, protein: dinnerProtein },
      snack: { calories: snackCal, protein: snackProtein }
    }
  };
}
