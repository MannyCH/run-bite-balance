
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { generateMealPlanForUser } from "@/utils/mealPlan";

interface GenerateMealPlanProps {
  onMealPlanGenerated: () => Promise<void>;
}

export const GenerateMealPlan: React.FC<GenerateMealPlanProps> = ({
  onMealPlanGenerated
}) => {
  const { user } = useAuth();
  const { runs } = useApp();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate a new meal plan
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
      // Filter runs to only include planned runs for the next week
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const plannedRuns = runs.filter(run => {
        const runDate = new Date(run.date);
        return run.isPlanned && runDate >= today && runDate <= nextWeek;
      });

      console.log(`Generating meal plan with ${plannedRuns.length} planned runs`);

      const result = await generateMealPlanForUser(user.id, plannedRuns);

      if (result) {
        toast({
          title: "Success",
          description: "Your meal plan has been generated successfully!",
        });
        // Refresh data
        await onMealPlanGenerated();
      } else {
        toast({
          title: "Error",
          description: "Failed to generate a meal plan. Please try again.",
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
    <Card className="mb-6">
      <CardContent className="pt-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Need a new meal plan?</h3>
          <p className="text-muted-foreground">
            Generate a personalized plan based on your profile and planned runs
          </p>
        </div>
        <Button 
          onClick={handleGenerateMealPlan}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate New Plan'}
        </Button>
      </CardContent>
    </Card>
  );
};
