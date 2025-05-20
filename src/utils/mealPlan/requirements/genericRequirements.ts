
// Generate generic nutritional requirements
import { MealRequirements } from '../types';

/**
 * Generate generic requirements when profile data is incomplete
 */
export function getGenericRequirements(): MealRequirements {
  return {
    dailyCalories: 2000,
    meals: {
      breakfast: { calories: 500, protein: 25 },
      lunch: { calories: 700, protein: 35 },
      dinner: { calories: 600, protein: 30 },
      snack: { calories: 200, protein: 10 }
    }
  };
}
