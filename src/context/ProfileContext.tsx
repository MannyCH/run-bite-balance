
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

  const isOnboardingComplete = Boolean(
    profile?.weight && 
    profile?.height && 
    profile?.age && 
    profile?.gender && 
    profile?.fitness_goal
  );

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = (weight: number, height: number, age: number, gender: string): number => {
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  // Load user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
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
          
          // Populate form data from profile if it exists
          if (profileData) {
            setFormData({
              basic: {
                weight: profileData.weight || undefined,
                height: profileData.height || undefined,
                age: profileData.age || undefined,
                gender: profileData.gender || undefined,
                targetWeight: profileData.target_weight || undefined,
                fitnessGoal: profileData.fitness_goal || undefined,
              },
              fitness: {
                activityLevel: profileData.activity_level || undefined,
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
                mealComplexity: profileData.meal_complexity || undefined,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchProfile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, toast]);

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

      const profileData = {
        // Basic info
        weight: basic.weight,
        height: basic.height,
        age: basic.age,
        gender: basic.gender,
        target_weight: basic.targetWeight,
        fitness_goal: basic.fitnessGoal,
        
        // Fitness info
        activity_level: fitness.activityLevel,
        ical_feed_url: fitness.icalFeedUrl,
        bmr: bmrValue,
        
        // Dietary info
        dietary_preferences: dietary.dietaryPreferences,
        nutritional_theory: dietary.nutritionalTheory,
        food_allergies: dietary.foodAllergies,
        
        // Preferences
        preferred_cuisines: preferences.preferredCuisines,
        foods_to_avoid: preferences.foodsToAvoid,
        meal_complexity: preferences.mealComplexity,
        
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
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
      setProfile(prevProfile => 
        prevProfile ? { ...prevProfile, ...profileData } : null
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
