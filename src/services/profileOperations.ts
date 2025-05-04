
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/profile";
import { calculateBMR } from "@/utils/profileUtils";
import { saveProfileToSupabase } from "./profileService";

export async function checkOnboardingStatus(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('weight, height, age, gender, fitness_goal')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }

    // Check if basic profile data is complete
    return Boolean(
      data?.weight && 
      data?.height && 
      data?.age && 
      data?.gender && 
      data?.fitness_goal
    );
  } catch (error) {
    console.error('Error in checkOnboardingStatus:', error);
    return false;
  }
}

export async function saveProfile(userId: string | undefined, profileData: Partial<UserProfile>) {
  if (!userId) {
    return { error: new Error('User not authenticated'), profileData: null };
  }

  try {
    // Calculate BMR if we have the necessary data
    let bmrValue = undefined;
    if (
      profileData.weight && 
      profileData.height && 
      profileData.age && 
      profileData.gender
    ) {
      bmrValue = calculateBMR(
        profileData.weight, 
        profileData.height, 
        profileData.age, 
        profileData.gender
      );
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        bmr: bmrValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return { error, profileData: error ? null : profileData };
  } catch (error: any) {
    console.error('Error saving profile:', error);
    return { error, profileData: null };
  }
}

export async function saveProfileFormData(userId: string | undefined, formData: any) {
  if (!userId) {
    return { error: new Error('User not authenticated'), profileData: null };
  }

  try {
    const result = await saveProfileToSupabase(userId, formData, calculateBMR);
    // Ensure we always return a consistent object structure
    return { 
      error: result.error, 
      profileData: result.profileData || null 
    };
  } catch (error: any) {
    console.error('Error saving profile form data:', error);
    return { error, profileData: null };
  }
}
