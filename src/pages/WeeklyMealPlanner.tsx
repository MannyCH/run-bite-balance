
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateMealPlan } from "@/components/MealPlan/GenerateMealPlan";
import { DaySelector } from "@/components/MealPlan/DaySelector";
import { MealPlanContent } from "@/components/MealPlan/MealPlanContent";
import { NoMealPlan } from "@/components/MealPlan/NoMealPlan";
import { useMealPlan } from "@/hooks/useMealPlan";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { removeQuinoaRecipes } from "@/utils/mealPlan/recipe/deleteRecipes";

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
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleRemoveQuinoaRecipes = async () => {
    try {
      setIsRemoving(true);
      const result = await removeQuinoaRecipes();
      
      if (result.success) {
        if (result.count > 0) {
          toast({
            title: "Success",
            description: `Successfully removed ${result.count} quinoa recipes.`,
          });
          // Refresh data if we have a current meal plan
          if (mealPlan) {
            await fetchLatestMealPlan();
          }
        } else {
          toast({
            title: "No quinoa recipes found",
            description: "There were no quinoa recipes in the database to remove.",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to remove quinoa recipes. See console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleRemoveQuinoaRecipes:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while removing quinoa recipes.",
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
      <GenerateMealPlan onMealPlanGenerated={fetchLatestMealPlan} />
      
      {/* Remove Quinoa Recipes Button */}
      <div className="mb-6">
        <Button 
          onClick={handleRemoveQuinoaRecipes} 
          variant="outline" 
          disabled={isRemoving}
          className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          <AlertTriangle className="h-4 w-4" />
          {isRemoving ? 'Removing quinoa recipes...' : 'Remove all quinoa recipes'}
        </Button>
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
