import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { generateMealPlanForUser } from "@/utils/mealPlan";
import { useProfile } from "@/context/ProfileContext";

interface GenerateMealPlanProps {
  onMealPlanGenerated: () => Promise<void>;
}

export const GenerateMealPlan: React.FC<GenerateMealPlanProps> = ({
  onMealPlanGenerated,
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Get AI recipe ratio preference (default to 30% if not set)
  const aiRecipeRatio =
    profile?.ai_recipe_ratio !== null && profile?.ai_recipe_ratio !== undefined
      ? profile.ai_recipe_ratio
      : 30;

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
      const result = await generateMealPlanForUser(user.id, aiRecipeRatio);

      if (result) {
        const aiRecipeCount = result.mealPlanItems.filter(
          (item) => item.is_ai_generated
        ).length;
        const totalRecipes = result.mealPlanItems.length;
        const actualPercentage = Math.round(
          (aiRecipeCount / totalRecipes) * 100
        );

        toast({
          title: "Success",
          description: `Your meal plan with ${aiRecipeCount} AI recipes (${actualPercentage}%) has been generated successfully!`,
        });

        await onMealPlanGenerated();
      } else {
        toast({
          title: "Error",
          description: "Failed to generate a meal plan. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating meal plan:", error);
      toast({
        title: "Error",
        description:
          "Something went wrong while generating your meal plan.",
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
            Generate a personalized plan with {aiRecipeRatio}% AI recipes based
            on your profile and dietary preferences
          </p>
        </div>
        <Button onClick={handleGenerateMealPlan} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate New Plan"}
        </Button>
      </CardContent>
    </Card>
  );
};
