
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateMealPlanForUser } from "@/utils/mealPlan";

interface ProfileActionsProps {
  isOnboardingComplete: boolean;
  hasMealPlan: boolean;
  userId: string | undefined;
}

export function ProfileActions({ 
  isOnboardingComplete, 
  hasMealPlan,
  userId 
}: ProfileActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMealPlan = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You need to be signed in to generate a meal plan.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMealPlanForUser(userId);
      
      if (result) {
        toast({
          title: "Meal Plan Generated",
          description: "Your personalized meal plan has been created successfully!",
        });
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

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {isOnboardingComplete && (
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
  );
}
