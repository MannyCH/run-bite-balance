
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateMealPlan } from "@/components/MealPlan/GenerateMealPlan";
import { DaySelector } from "@/components/MealPlan/DaySelector";
import { MealPlanContent } from "@/components/MealPlan/MealPlanContent";
import { NoMealPlan } from "@/components/MealPlan/NoMealPlan";
import { useMealPlan } from "@/hooks/useMealPlan";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

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
  
  const { user } = useAuth();

  const handleClearMealPlan = async () => {
    if (!user || !mealPlan) return;
    
    try {
      // Delete meal plan items first
      const { error: itemsError } = await supabase
        .from('meal_plan_items')
        .delete()
        .eq('meal_plan_id', mealPlan.id);
      
      if (itemsError) throw itemsError;
      
      // Delete the meal plan
      const { error: planError } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlan.id);
      
      if (planError) throw planError;
      
      toast.success("Meal plan cleared successfully");
      fetchLatestMealPlan(); // Refresh the data
    } catch (error) {
      console.error('Error clearing meal plan:', error);
      toast.error("Failed to clear meal plan");
    }
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Weekly Meal Planner</h1>
            <p className="text-gray-600">
              View your personalized meal plan based on your profile
            </p>
          </div>
          {mealPlan && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearMealPlan}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Meal Plan
            </Button>
          )}
        </div>
      </div>

      {/* Generate Meal Plan Button */}
      <GenerateMealPlan onMealPlanGenerated={fetchLatestMealPlan} />

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
