
// Types related to meal plan generation
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';

export interface GenerateMealPlanParams {
  userId: string;
  profile: UserProfile;
  recipes: Recipe[];
  startDate: string;
  endDate: string;
}

export interface MealPlanResult {
  mealPlan: MealPlan;
  mealPlanItems: MealPlanItem[];
}

export interface MealRequirements {
  dailyCalories: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  meals: {
    breakfast: { calories: number; protein: number };
    lunch: { calories: number; protein: number };
    dinner: { calories: number; protein: number };
    snack: { calories: number; protein: number };
  };
}
