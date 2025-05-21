
import React, { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateMealPlan } from "@/components/MealPlan/GenerateMealPlan";
import { DaySelector } from "@/components/MealPlan/DaySelector";
import { MealPlanContent } from "@/components/MealPlan/MealPlanContent";
import { NoMealPlan } from "@/components/MealPlan/NoMealPlan";
import { useMealPlan } from "@/hooks/useMealPlan";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { removeQuinoaRecipes } from "@/utils/recipeCleanup";

const WeeklyMealPlanner: React.FC = () => {
  const {
    isLoading,
    mealPlan,
    mealPlanItems,
    recipes,
    selectedDate,
    setSelectedDate,
    daysOfWeek,
    fetchLatestMealPlan,
  } = useMealPlan();
  
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveQuinoaRecipes = async () => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    try {
      const count = await removeQuinoaRecipes();
      
      if (count > 0) {
        toast({
          title: "Success",
          description: `Successfully removed ${count} quinoa recipes from the database.`,
        });
        
        // Refresh meal plan data if needed
        await fetchLatestMealPlan();
      } else {
        toast({
          title: "No Changes",
          description: "No quinoa recipes were found in the database.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove quinoa recipes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Weekly Meal Planner</h1>
        <p className="text-gray-600">
          View your personalized meal plan based on your profile
          <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700">
            Fresh AI recipes on every generate
          </Badge>
        </p>
      </div>

      {/* Generate Meal Plan Button */}
      <div className="flex justify-between mb-6">
        <GenerateMealPlan onMealPlanGenerated={fetchLatestMealPlan} />
        <button
          onClick={handleRemoveQuinoaRecipes}
          disabled={isRemoving}
          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
        >
          {isRemoving ? "Removing..." : "Remove Quinoa Recipes"}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : mealPlan ? (
        <>
          {/* Calendar Days */}
          <DaySelector 
            days={daysOfWeek}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Selected Day Meals */}
          <MealPlanContent 
            selectedDate={selectedDate}
            mealPlanItems={mealPlanItems}
            recipes={recipes}
          />
        </>
      ) : (
        // No meal plan exists
        <NoMealPlan
          isGenerating={false}
          onGenerateMealPlan={() => <GenerateMealPlan onMealPlanGenerated={fetchLatestMealPlan} />}
        />
      )}
    </MainLayout>
  );
};

export default WeeklyMealPlanner;
