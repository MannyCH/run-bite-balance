
// Types for meal plan functionality
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';

export interface GenerateMealPlanParams {
  userId: string;
  profile: UserProfile;
  recipes: Recipe[];
  startDate: string;
  endDate: string;
  runs?: any[]; // Add runs parameter
}

export interface MealPlanResult {
  mealPlan: MealPlan;
  mealPlanItems: MealPlanItem[];
}

// Export DailyRequirements interface that was missing
export interface DailyRequirements {
  targetCalories: number;
  maintenanceCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  runCalories?: number;
  mealDistribution: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}
