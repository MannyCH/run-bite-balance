
import { Recipe } from '@/context/types';

// Tracking structure for ingredients to ensure variety
export interface IngredientTracking {
  byDay: Record<string, Set<string>>;
  allWeek: Set<string>;
}

// Structure for content hash mapping
export interface ContentHashMap {
  [hash: string]: Recipe;
}

// Interface for AI response meal structure
export interface AIMeal {
  meal_type: string;
  recipe_id: string;
  explanation?: string;
}

// Interface for AI response day structure
export interface AIDay {
  date: string;
  meals: AIMeal[];
}

// Interface for AI response meal plan structure
export interface AIMealPlan {
  days: AIDay[];
}

// Interface for the complete AI response
export interface AIResponse {
  mealPlan: AIMealPlan;
  aiGeneratedRecipes?: any[];
}

// Interface for a meal plan item to be inserted into database
export interface MealPlanItemForDb {
  meal_plan_id: string;
  date: string;
  meal_type: string;
  recipe_id?: string | null;
  custom_title?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  nutritional_context?: string | null;
  is_ai_generated?: boolean | null;
  main_ingredient?: string | null;
}
