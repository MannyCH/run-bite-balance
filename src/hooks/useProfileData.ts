
import { useState, useCallback } from "react";
import { ProfileFormData, UserProfile } from "@/types/profile";
import { supabase } from "@/integrations/supabase/client";
import { safeGenderCast, safeFitnessGoalCast, safeActivityLevelCast, safeMealComplexityCast } from "@/utils/profileUtils";

export const useProfileData = (
  userId: string | undefined,
  setProfile: (profile: UserProfile | null) => void,
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>,
  setIsLoading: (isLoading: boolean) => void,
  toast: any
) => {
  
  const fetchProfileData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive",
        });
      } else if (profileData) {
        setProfile(profileData as UserProfile);
        
        // Populate form data from profile if it exists - with proper type casting
        if (profileData) {
          setFormData({
            basic: {
              weight: profileData.weight || undefined,
              height: profileData.height || undefined,
              age: profileData.age || undefined,
              gender: safeGenderCast(profileData.gender),
              targetWeight: profileData.target_weight || undefined,
              fitnessGoal: safeFitnessGoalCast(profileData.fitness_goal),
            },
            fitness: {
              activityLevel: safeActivityLevelCast(profileData.activity_level),
              icalFeedUrl: profileData.ical_feed_url || undefined,
            },
            dietary: {
              dietaryPreferences: profileData.dietary_preferences || [],
              nutritionalTheory: profileData.nutritional_theory || undefined,
              foodAllergies: profileData.food_allergies || [],
            },
            preferences: {
              preferredCuisines: profileData.preferred_cuisines || [],
              foodsToAvoid: profileData.foods_to_avoid || [],
              mealComplexity: safeMealComplexityCast(profileData.meal_complexity),
            },
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, setProfile, setFormData, setIsLoading, toast]);

  return { fetchProfileData };
};
