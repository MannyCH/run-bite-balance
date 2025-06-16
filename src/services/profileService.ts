
import { Gender, FitnessGoal, ActivityLevel, MealComplexity, ProfileFormData, UserProfile } from "@/types/profile";
import { supabase } from "@/integrations/supabase/client";
import { safeGenderCast, safeFitnessGoalCast, safeActivityLevelCast, safeMealComplexityCast } from "@/utils/profileUtils";

export const saveProfileToSupabase = async (
  userId: string, 
  data: ProfileFormData, 
  calculateBMR: (weight: number, height: number, age: number, gender: string) => number
) => {
  try {
    const { basic, fitness, dietary, preferences } = data;

    // Calculate BMR
    let bmrValue = undefined;
    if (basic.weight && basic.height && basic.age && basic.gender) {
      bmrValue = calculateBMR(
        basic.weight,
        basic.height,
        basic.age,
        basic.gender
      );
    }

    // Type safety checks for enum values
    // Only accept values that are valid for each enum type
    const genderValue = safeGenderCast(basic.gender);
    const fitnessGoalValue = safeFitnessGoalCast(basic.fitnessGoal);
    const activityLevelValue = safeActivityLevelCast(fitness.activityLevel);
    const mealComplexityValue = safeMealComplexityCast(preferences.mealComplexity);

    const profileData = {
      // Basic info - with proper type checking
      weight: basic.weight,
      height: basic.height,
      age: basic.age,
      gender: genderValue,
      target_weight: basic.targetWeight,
      fitness_goal: fitnessGoalValue,
      
      // Fitness info - with proper type checking
      activity_level: activityLevelValue,
      ical_feed_url: fitness.icalFeedUrl,
      bmr: bmrValue,
      
      // Dietary info
      dietary_preferences: dietary.dietaryPreferences,
      nutritional_theory: dietary.nutritionalTheory,
      food_allergies: dietary.foodAllergies,
      
      // Preferences - with proper type checking
      preferred_cuisines: preferences.preferredCuisines,
      foods_to_avoid: preferences.foodsToAvoid,
      meal_complexity: mealComplexityValue,
      
      // Batch cooking settings
      batch_cooking_repetitions: preferences.batchCookingRepetitions || 1,
      batch_cooking_people: preferences.batchCookingPeople || 1,
      
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId);

    if (error) {
      return { error, profileData: null };
    }

    return { error: null, profileData };
  } catch (error: any) {
    console.error('Error saving profile to Supabase:', error);
    return { error, profileData: null };
  }
};
