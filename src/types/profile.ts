
export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  recipe_id?: string | null;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  nutritional_context?: string | null;
  custom_title?: string | null;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  is_ai_generated?: boolean; // New field to track AI-generated recipes
}
