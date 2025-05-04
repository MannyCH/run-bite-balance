
import { Gender, FitnessGoal, ActivityLevel, MealComplexity } from "@/types/profile";

// Calculate BMR using Mifflin-St Jeor Equation
export const calculateBMR = (weight: number, height: number, age: number, gender: string): number => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

// Helper functions to safely cast string values to enum types
export const safeGenderCast = (value: string | null | undefined): Gender | undefined => {
  if (value && ['male', 'female', 'other'].includes(value)) {
    return value as Gender;
  }
  return undefined;
};

export const safeFitnessGoalCast = (value: string | null | undefined): FitnessGoal | undefined => {
  if (value && ['lose', 'maintain', 'gain'].includes(value)) {
    return value as FitnessGoal;
  }
  return undefined;
};

export const safeActivityLevelCast = (value: string | null | undefined): ActivityLevel | undefined => {
  if (value && ['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(value)) {
    return value as ActivityLevel;
  }
  return undefined;
};

export const safeMealComplexityCast = (value: string | null | undefined): MealComplexity | undefined => {
  if (value && ['simple', 'moderate', 'complex'].includes(value)) {
    return value as MealComplexity;
  }
  return undefined;
};

// Format helpers for display
export const formatActivityLevel = (level: string | null | undefined): string => {
  if (!level) return 'Not set';
  
  const formats: Record<string, string> = {
    sedentary: 'Sedentary',
    light: 'Lightly Active',
    moderate: 'Moderately Active',
    active: 'Very Active',
    very_active: 'Extremely Active'
  };
  
  return formats[level] || level;
};

export const formatGoal = (goal: string | null | undefined): string => {
  if (!goal) return 'Not set';
  
  const formats: Record<string, string> = {
    lose: 'Lose Weight',
    maintain: 'Maintain Weight',
    gain: 'Gain Weight'
  };
  
  return formats[goal] || goal;
};

export const formatNutritionalTheory = (theory: string | null | undefined): string => {
  if (!theory) return 'Not set';
  
  const formats: Record<string, string> = {
    tim_spector: 'Tim Spector Approach',
    keto: 'Ketogenic',
    paleo: 'Paleo',
    mediterranean: 'Mediterranean',
    balanced: 'Balanced'
  };
  
  return formats[theory] || theory;
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};
