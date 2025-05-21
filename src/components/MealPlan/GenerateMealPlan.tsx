
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { generateMealPlanForUser } from "@/utils/mealPlan/generateMealPlanForUser";
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
      // Call the new generateMealPlanForUser function with the current date range
      const today = new Date();
      const startDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Set end date to 6 days from now (7 days total including today)
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 6);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Call the Supabase Edge Function to get AI-generated recipes
      const { data: edgeFunctionData, error: edgeFunctionError } = await fetch(
        "https://lnaaxnpffaoqjyccpeso.supabase.co/functions/v1/generate-meal-plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("supabase.auth.token")}`
          },
          body: JSON.stringify({
            userId: user.id,
            startDate: startDate,
            endDate: endDateStr,
            aiRecipeRatio: aiRecipeRatio,
            forceNewRecipes: true
          })
        }
      ).then(res => res.json());
      
      if (edgeFunctionError) {
        throw new Error(edgeFunctionError.message || "Failed to generate AI recipes");
      }
      
      if (!edgeFunctionData) {
        throw new Error("No data returned from AI recipe generation");
      }
      
      const result = await generateMealPlanForUser(
        user.id, 
        startDate, 
        endDateStr, 
        edgeFunctionData.aiGeneratedRecipes || []
      );

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
          description: `Your meal plan with ${aiRecipeCount} fresh AI recipes (${actualPercentage}%) has been generated successfully!`,
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
            Generate a personalized plan with {aiRecipeRatio}% fresh AI recipes based
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
