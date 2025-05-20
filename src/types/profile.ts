
// Gender type
export type Gender = 'male' | 'female' | 'other';

// FitnessGoal type
export type FitnessGoal = 'lose' | 'maintain' | 'gain';

// ActivityLevel type
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// MealComplexity type
export type MealComplexity = 'simple' | 'moderate' | 'complex';

// Status type for meal plans
export type MealPlanStatus = 'draft' | 'active' | 'archived';

// Onboarding step type
export type OnboardingStep = 'basic' | 'fitness' | 'dietary' | 'preferences' | 'complete';

// User profile interface matching the database schema
export interface UserProfile {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: Gender | null;
  target_weight?: number | null;
  fitness_goal?: FitnessGoal | null;
  activity_level?: ActivityLevel | null;
  ical_feed_url?: string | null;
  bmr?: number | null;
  dietary_preferences?: string[] | null;
  nutritional_theory?: string | null;
  food_allergies?: string[] | null;
  preferred_cuisines?: string[] | null;
  foods_to_avoid?: string[] | null;
  meal_complexity?: MealComplexity | null;
  ai_recipe_ratio?: number | null; // New field for AI recipe ratio
  created_at?: string;
  updated_at?: string;
}

// Interface for form data used in profile setup/edit
export interface ProfileFormData {
  basic: {
    weight?: number;
    height?: number;
    age?: number;
    gender?: Gender;
    targetWeight?: number;
    fitnessGoal?: FitnessGoal;
  };
  fitness: {
    activityLevel?: ActivityLevel;
    icalFeedUrl?: string;
  };
  dietary: {
    dietaryPreferences: string[];
    nutritionalTheory?: string;
    foodAllergies: string[];
  };
  preferences: {
    preferredCuisines: string[];
    foodsToAvoid: string[];
    mealComplexity?: MealComplexity;
    aiRecipeRatio?: number; // New field for AI recipe ratio
  };
}

// Meal plan interface
export interface MealPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  created_at: string;
  status: MealPlanStatus;
}

// Meal plan item interface with is_ai_generated field and main_ingredient field
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
  is_ai_generated?: boolean; // Field to track AI-generated recipes
  main_ingredient?: string | null; // New field to track main ingredient for variety
}
