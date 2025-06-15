
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';

export interface GenerateMealPlanParams {
  userId: string;
  profile: UserProfile;
  recipes: Recipe[];
  startDate: string;
  endDate: string;
  runs?: any[];
}

export interface MealPlanResult {
  mealPlan: MealPlan;
  mealPlanItems: MealPlanItem[];
}

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

export interface DailyBreakdown {
  date: string;
  targetCalories: number;
  runCalories: number;
  hasRuns: boolean;
  runs: {
    title: string;
    distance: number;
    duration: number;
  }[];
  meals: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

export interface RecipeSummary {
  id: string;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  categories: string[];
}
