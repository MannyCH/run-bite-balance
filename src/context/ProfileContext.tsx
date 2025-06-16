
import React, { createContext, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  UserProfile, 
  ProfileFormData, 
  OnboardingStep
} from "@/types/profile";
import { useProfileData } from "@/hooks/useProfileData";
import { calculateBMR } from "@/utils/profileUtils";
import { useProfileState } from "@/hooks/useProfileState";
import { checkOnboardingStatus, saveProfile, saveProfileFormData } from "@/services/profileOperations";

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

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    profile,
    setProfile,
    isLoading,
    setIsLoading,
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    isOnboardingComplete
  } = useProfileState();

  const { fetchProfileData } = useProfileData(
    user?.id,
    setProfile,
    setFormData,
    setIsLoading,
    toast
  );

  // Load user profile
  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, fetchProfileData, setIsLoading]);

  // Wrapper functions to include the user ID from the auth context
  const handleCheckOnboardingStatus = async (): Promise<boolean> => {
    return await checkOnboardingStatus(user?.id);
  };

  const handleSaveProfile = async (profileData: Partial<UserProfile>) => {
    const result = await saveProfile(user?.id, profileData);
    
    if (result.error) {
      toast({
        title: "Error saving profile",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      // Update local state - ensuring we don't overwrite the entire profile with just the new data
      setProfile(prevProfile => prevProfile ? { ...prevProfile, ...result.profileData } : null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    }
    
    return result;
  };

  const handleSaveProfileFormData = async (data: ProfileFormData) => {
    const result = await saveProfileFormData(user?.id, data);
    
    if (result.error) {
      toast({
        title: "Error saving profile",
        description: result.error.message,
        variant: "destructive",
      });
    } else if (result.profileData) {
      // Update local state with the data returned from the service
      setProfile(prevProfile => 
        prevProfile ? { ...prevProfile, ...result.profileData } : null
      );
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    }
    
    return result;
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        isOnboardingComplete,
        currentStep,
        checkOnboardingStatus: handleCheckOnboardingStatus,
        saveProfile: handleSaveProfile,
        saveProfileFormData: handleSaveProfileFormData,
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

// Export OnboardingCheck component for convenience
export { default as OnboardingCheck } from '../components/Auth/OnboardingCheck';
