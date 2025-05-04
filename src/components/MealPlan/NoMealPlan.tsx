
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NoMealPlanProps {
  isGenerating: boolean;
  onGenerateMealPlan: () => void;
}

export const NoMealPlan: React.FC<NoMealPlanProps> = ({ 
  isGenerating, 
  onGenerateMealPlan 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No Meal Plan Found</CardTitle>
        <CardDescription>
          You don't have any meal plans generated yet. Create one to get started!
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pt-4 pb-8">
        <Button
          onClick={onGenerateMealPlan}
          disabled={isGenerating}
          size="lg"
        >
          {isGenerating ? 'Generating...' : 'Generate Meal Plan'}
        </Button>
      </CardContent>
    </Card>
  );
};
