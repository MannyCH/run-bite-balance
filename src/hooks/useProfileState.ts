
import { useState } from "react";
import { ProfileFormData, UserProfile, OnboardingStep } from "@/types/profile";

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
    batchCookingEnabled: false,
    batchCookingIntensity: 'medium',
    batchCookingPeople: 1,
  },
};

export function useProfileState() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('basic');

  // Compute if onboarding is complete based on profile data
  const isOnboardingComplete = Boolean(
    profile?.weight && 
    profile?.height && 
    profile?.age && 
    profile?.gender && 
    profile?.fitness_goal
  );

  return {
    profile,
    setProfile,
    isLoading,
    setIsLoading,
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    isOnboardingComplete,
    initialFormData
  };
}
