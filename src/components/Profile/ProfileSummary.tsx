
import React from "react";
import { UserProfile } from "@/types/profile";
import { formatActivityLevel, formatGoal, formatNutritionalTheory, getBMICategory } from "@/utils/profileUtils";

interface ProfileSummaryProps {
  profile: UserProfile;
}

export function ProfileSummary({ profile }: ProfileSummaryProps) {
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
  );
}
