
import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export function OnboardingComplete() {
  const { profile, calculateBMR } = useProfile();
  const navigate = useNavigate();
  
  // Calculate estimated daily calorie needs if we have all the necessary data
  const calculateDailyCaloricNeeds = () => {
    if (
      profile?.weight && 
      profile?.height && 
      profile?.age && 
      profile?.gender &&
      profile?.activity_level
    ) {
      // Start with BMR
      const bmr = calculateBMR(
        profile.weight,
        profile.height,
        profile.age,
        profile.gender
      );
      
      // Apply activity multiplier
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      
      const multiplier = activityMultipliers[profile.activity_level as keyof typeof activityMultipliers];
      return Math.round(bmr * multiplier);
    }
    
    return null;
  };
  
  const dailyCalories = calculateDailyCaloricNeeds();
  
  // Calculate macronutrient breakdown based on goals
  const calculateMacros = () => {
    if (!dailyCalories) return null;
    
    let proteinPct, carbsPct, fatPct;
    
    // Adjust macros based on fitness goal
    switch(profile?.fitness_goal) {
      case 'lose':
        proteinPct = 0.30; // 30% protein
        fatPct = 0.35;     // 35% fat
        carbsPct = 0.35;   // 35% carbs
        break;
      case 'gain':
        proteinPct = 0.25; // 25% protein
        fatPct = 0.25;     // 25% fat
        carbsPct = 0.50;   // 50% carbs
        break;
      default: // maintain
        proteinPct = 0.25; // 25% protein
        fatPct = 0.30;     // 30% fat
        carbsPct = 0.45;   // 45% carbs
    }
    
    // Calculate grams (protein & carbs = 4 cal/g, fat = 9 cal/g)
    const proteinGrams = Math.round((dailyCalories * proteinPct) / 4);
    const carbsGrams = Math.round((dailyCalories * carbsPct) / 4);
    const fatGrams = Math.round((dailyCalories * fatPct) / 9);
    
    return { proteinGrams, carbsGrams, fatGrams };
  };
  
  const macros = calculateMacros();
  
  // Generate a message based on the user's fitness goal
  const getGoalMessage = () => {
    switch(profile?.fitness_goal) {
      case 'lose':
        return "Based on your goals, we'll recommend a slight calorie deficit to support healthy weight loss.";
      case 'gain':
        return "Based on your goals, we'll recommend a calorie surplus to support muscle growth and weight gain.";
      default: // maintain
        return "Based on your goals, we'll recommend balanced nutrition to maintain your current weight.";
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-center">Profile Complete!</h2>
        <p className="text-muted-foreground text-center mt-2">
          We've calculated your personalized nutrition plan based on your information.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Your Daily Nutrition Summary</h3>
          {dailyCalories ? (
            <>
              <p className="text-lg font-semibold">{dailyCalories} calories per day</p>
              <p className="text-sm text-muted-foreground">{getGoalMessage()}</p>
              
              {macros && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 p-3 rounded-md text-center">
                    <div className="text-lg font-semibold">{macros.proteinGrams}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md text-center">
                    <div className="text-lg font-semibold">{macros.carbsGrams}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-md text-center">
                    <div className="text-lg font-semibold">{macros.fatGrams}g</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              We're missing some information to calculate your needs accurately.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">What happens next?</h3>
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-primary font-medium">1</span>
            </div>
            <p className="text-sm">
              Visit the <strong>Weekly Meal Planner</strong> to generate AI-powered meal plans based on your profile.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-primary font-medium">2</span>
            </div>
            <p className="text-sm">
              Track your meals and workouts to see how they align with your nutrition goals.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-primary font-medium">3</span>
            </div>
            <p className="text-sm">
              Update your profile anytime in your account settings as your goals change.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <Button onClick={() => navigate('/meal-planner')} className="w-full md:w-auto">
            Go to Weekly Meal Planner
          </Button>
        </div>
      </div>
    </div>
  );
}
