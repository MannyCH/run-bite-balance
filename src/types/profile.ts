
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type FitnessGoal = 'lose' | 'maintain' | 'gain';
export type Gender = 'male' | 'female' | 'other';
export type MealComplexity = 'simple' | 'moderate' | 'complex';

export interface UserProfile {
  id: string;
  username?: string | null;
  weight?: number | null;
  target_weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: Gender | null;
  fitness_goal?: FitnessGoal | null;
  activity_level?: ActivityLevel | null;
  bmr?: number | null; // Basal Metabolic Rate
  dietary_preferences?: string[] | null;
  nutritional_theory?: string | null;
  food_allergies?: string[] | null;
  preferred_cuisines?: string[] | null;
  foods_to_avoid?: string[] | null;
  meal_complexity?: MealComplexity | null;
  ical_feed_url?: string | null;
  avatar_url?: string | null;
}

export type OnboardingStep = 'basic' | 'fitness' | 'dietary' | 'preferences' | 'complete';

export interface MealPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  created_at: string;
  status: 'draft' | 'active';
  items?: MealPlanItem[];
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  recipe_id?: string | null;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'pre_run_snack' | 'post_run_snack';
  nutritional_context?: string | null;
  custom_title?: string | null;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface ProfileFormData {
  basic: {
    weight: number | undefined;
    height: number | undefined;
    age: number | undefined;
    gender: Gender | undefined;
    targetWeight: number | undefined;
    fitnessGoal: FitnessGoal | undefined;
  };
  fitness: {
    activityLevel: ActivityLevel | undefined;
    icalFeedUrl: string | undefined;
  };
  dietary: {
    dietaryPreferences: string[];
    nutritionalTheory: string | undefined;
    foodAllergies: string[];
  };
  preferences: {
    preferredCuisines: string[];
    foodsToAvoid: string[];
    mealComplexity: MealComplexity | undefined;
  };
}
