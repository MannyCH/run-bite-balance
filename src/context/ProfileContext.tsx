
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  UserProfile, 
  ProfileFormData, 
  OnboardingStep
} from "@/types/profile";
import { useProfileData } from "@/hooks/useProfileData";
import { calculateBMR } from "@/utils/profileUtils";
import { saveProfileToSupabase } from "@/services/profileService";

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  currentStep: OnboardingStep;
  checkOnboardingStatus: () => Promise<boolean>;
  saveProfile: (profileData: Partial<UserProfile>) => Promise<{ error: any }>;
  saveProfileFormData: (formData: ProfileFormData) => Promise<{ error: any }>;
  calculateBMR: (weight: number, height: number, age: number, gender: string) => number;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<OnboardingStep>>;
}

const initialFormData: ProfileFormData = {
  basic: {
    weight: undefined,
    height: undefined,
    age: undefined,
    gender: undefined,
    targetWeight: undefined,
    fitnessGoal: undefined,
  },
  fitness: {
    activityLevel: undefined,
    icalFeedUrl: undefined,
  },
  dietary: {
    dietaryPreferences: [],
    nutritionalTheory: undefined,
    foodAllergies: [],
  },
  preferences: {
    preferredCuisines: [],
    foodsToAvoid: [],
    mealComplexity: undefined,
  },
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('basic');

  const { fetchProfileData } = useProfileData(
    user?.id,
    setProfile,
    setFormData,
    setIsLoading,
    toast
  );

  const isOnboardingComplete = Boolean(
    profile?.weight && 
    profile?.height && 
    profile?.age && 
    profile?.gender && 
    profile?.fitness_goal
  );

  // Load user profile
  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, fetchProfileData]);

  // Check if user needs to complete onboarding
  const checkOnboardingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('weight, height, age, gender, fitness_goal')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return false;
      }

      // Check if basic profile data is complete
      const isComplete = Boolean(
        data?.weight && 
        data?.height && 
        data?.age && 
        data?.gender && 
        data?.fitness_goal
      );

      return isComplete;
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
      return false;
    }
  };

  // Save profile data to Supabase
  const saveProfile = async (profileData: Partial<UserProfile>) => {
    if (!user?.id) {
      return { error: new Error('User not authenticated') };
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
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Error saving profile",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Update local state
      setProfile(prevProfile => prevProfile ? { ...prevProfile, ...profileData, bmr: bmrValue } : null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  // Save all form data at once
  const saveProfileFormData = async (data: ProfileFormData) => {
    if (!user?.id) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const result = await saveProfileToSupabase(user.id, data, calculateBMR);

      if (result.error) {
        toast({
          title: "Error saving profile",
          description: result.error.message,
          variant: "destructive",
        });
        return { error: result.error };
      }

      // Update local state
      setProfile(prevProfile => 
        prevProfile ? { ...prevProfile, ...result.profileData } : null
      );
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        isOnboardingComplete,
        currentStep,
        checkOnboardingStatus,
        saveProfile,
        saveProfileFormData,
        calculateBMR,
        formData,
        setFormData,
        setCurrentStep,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
