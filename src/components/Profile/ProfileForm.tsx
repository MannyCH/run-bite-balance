import React, { useState } from "react";
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
import { generateMealPlanForUser } from "@/utils/mealPlan";
import { Loader, CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function ProfileForm() {
  const { 
    profile,
    formData,
    saveProfileFormData,
    isOnboardingComplete,
  } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasMealPlan, setHasMealPlan] = useState(false);

  // Check if user has a meal plan
  React.useEffect(() => {
    const checkMealPlan = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('meal_plans')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!error && data && data.length > 0) {
          setHasMealPlan(true);
        }
      } catch (error) {
        console.error('Error checking meal plan:', error);
      }
    };
    
    checkMealPlan();
  }, [user?.id]);

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

  const handleGenerateMealPlan = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You need to be signed in to generate a meal plan.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMealPlanForUser(user.id);
      
      if (result) {
        toast({
          title: "Meal Plan Generated",
          description: "Your personalized meal plan has been created successfully!",
        });
        setHasMealPlan(true);
        // Navigate to the meal planner page
        navigate("/meal-planner");
      } else {
        toast({
          title: "Error",
          description: "Failed to generate a meal plan. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Error",
        description: "Something went wrong while generating your meal plan.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isOnboardingComplete && profile && (
          <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h3 className="font-medium text-green-800">Generate a Meal Plan</h3>
              <p className="text-green-700 text-sm">Create a personalized weekly meal plan based on your profile.</p>
            </div>
            <Button 
              onClick={handleGenerateMealPlan} 
              className="bg-green-600 hover:bg-green-700 text-white mt-3 sm:mt-0"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" /> 
                  Generating...
                </>
              ) : (
                'Generate Meal Plan'
              )}
            </Button>
          </div>
        )}

        {hasMealPlan && (
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-800">View Your Meal Plan</h3>
              <p className="text-blue-700 text-sm">See your personalized weekly meal suggestions.</p>
            </div>
            <Button 
              onClick={() => navigate('/meal-planner')} 
              variant="outline"
              className="border-blue-300 hover:bg-blue-100 text-blue-700 mt-3 sm:mt-0"
            >
              <CalendarDays className="mr-2 h-4 w-4" /> 
              View Meal Plan
            </Button>
          </div>
        )}
      </div>
      
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
