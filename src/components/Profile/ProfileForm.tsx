
import React from "react";
import { useProfile } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BasicInfoForm } from "./BasicInfoForm";
import { FitnessInfoForm } from "./FitnessInfoForm";
import { DietaryInfoForm } from "./DietaryInfoForm";
import { PreferencesForm } from "./PreferencesForm";
import { useNavigate } from "react-router-dom";

export function ProfileForm() {
  const { 
    profile,
    formData,
    saveProfileFormData,
    isOnboardingComplete,
  } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSaveProfile = async () => {
    const { error } = await saveProfileFormData(formData);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile: " + error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    }
  };

  // Redirect to profile setup if onboarding isn't complete
  const handleCompleteSetup = () => {
    navigate('/profile-setup');
  };

  if (!isOnboardingComplete) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Your Profile is Incomplete</h3>
        <p className="text-muted-foreground mb-4">
          Complete your profile setup to get personalized meal recommendations.
        </p>
        <Button onClick={handleCompleteSetup}>
          Complete Profile Setup
        </Button>
      </div>
    );
  }

  // Calculate BMI if we have the data
  const calculateBMI = () => {
    if (profile?.weight && profile?.height) {
      // BMI = weight (kg) / (height (m))^2
      const heightInMeters = profile.height / 100;
      const bmi = profile.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Profile Summary</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="text-muted-foreground">Height</div>
              <div>{profile.height ? `${profile.height} cm` : 'Not set'}</div>
              
              <div className="text-muted-foreground">Weight</div>
              <div>{profile.weight ? `${profile.weight} kg` : 'Not set'}</div>
              
              <div className="text-muted-foreground">Goal</div>
              <div>{formatGoal(profile.fitness_goal)}</div>
              
              <div className="text-muted-foreground">Activity</div>
              <div>{formatActivityLevel(profile.activity_level)}</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Nutrition Data</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="text-muted-foreground">BMR</div>
              <div>{profile.bmr ? `${Math.round(profile.bmr)} calories` : 'Not calculated'}</div>
              
              {bmi && (
                <>
                  <div className="text-muted-foreground">BMI</div>
                  <div>{bmi} ({bmiCategory})</div>
                </>
              )}
              
              <div className="text-muted-foreground">Preferred Diet</div>
              <div>{formatNutritionalTheory(profile.nutritional_theory)}</div>
              
              <div className="text-muted-foreground">Dietary Restrictions</div>
              <div>{profile.dietary_preferences?.length 
                ? profile.dietary_preferences.join(', ') 
                : 'None'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Separator />
      
      {/* Edit Profile Tabs */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="fitness">Fitness</TabsTrigger>
          <TabsTrigger value="dietary">Diet</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <BasicInfoForm />
        </TabsContent>
        
        <TabsContent value="fitness">
          <FitnessInfoForm />
        </TabsContent>
        
        <TabsContent value="dietary">
          <DietaryInfoForm />
        </TabsContent>
        
        <TabsContent value="preferences">
          <PreferencesForm />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button onClick={handleSaveProfile}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// Helper functions for formatting
function formatActivityLevel(level: string | null | undefined): string {
  if (!level) return 'Not set';
  
  const formats: Record<string, string> = {
    sedentary: 'Sedentary',
    light: 'Lightly Active',
    moderate: 'Moderately Active',
    active: 'Very Active',
    very_active: 'Extremely Active'
  };
  
  return formats[level] || level;
}

function formatGoal(goal: string | null | undefined): string {
  if (!goal) return 'Not set';
  
  const formats: Record<string, string> = {
    lose: 'Lose Weight',
    maintain: 'Maintain Weight',
    gain: 'Gain Weight'
  };
  
  return formats[goal] || goal;
}

function formatNutritionalTheory(theory: string | null | undefined): string {
  if (!theory) return 'Not set';
  
  const formats: Record<string, string> = {
    tim_spector: 'Tim Spector Approach',
    keto: 'Ketogenic',
    paleo: 'Paleo',
    mediterranean: 'Mediterranean',
    balanced: 'Balanced'
  };
  
  return formats[theory] || theory;
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
