
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { generateMealPlanForUser } from "@/utils/mealPlan";
import { format, addDays, isSameDay, isWithinInterval } from "date-fns";

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
      // Calculate the meal plan date range (7 days starting from today)
      const today = new Date();
      const startDate = today;
      const endDate = addDays(today, 6); // 7 days total including today
      
      console.log(`Meal plan date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
      console.log(`Total runs available: ${runs.length}`);
      
      // Filter runs to only include planned runs within the meal plan date range
      const plannedRunsInRange = runs.filter(run => {
        const runDate = new Date(run.date);
        const isPlanned = run.isPlanned;
        const isInRange = isWithinInterval(runDate, { start: startDate, end: endDate });
        
        console.log(`Run "${run.title}" on ${format(runDate, 'yyyy-MM-dd')}: planned=${isPlanned}, inRange=${isInRange}`);
        
        return isPlanned && isInRange;
      });

      console.log(`Generating meal plan with ${plannedRunsInRange.length} planned runs in date range`);
      
      // Log details of each run being passed
      plannedRunsInRange.forEach(run => {
        console.log(`- Run: ${run.title}, Date: ${format(new Date(run.date), 'yyyy-MM-dd')}, Distance: ${run.distance}km, Duration: ${Math.round(run.duration / 60)}min`);
      });

      const result = await generateMealPlanForUser(user.id, plannedRunsInRange);

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
