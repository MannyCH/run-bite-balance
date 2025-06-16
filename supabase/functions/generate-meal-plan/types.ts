// Type definitions for the meal plan generation
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

export interface NutritionalGuidance {
  focus: string;
  guidelines: string[];
}

export interface DailyBreakdown {
  date: string;
  targetCalories: number;
  runCalories: number;
  hasRuns: boolean;
  runs: Array<{
    title: string;
    distance: number;
    duration: number;
  }>;
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
  seasonal_suitability?: string[];
  temperature_preference?: string;
  dish_type?: string;
  seasonalScore?: number;
}
