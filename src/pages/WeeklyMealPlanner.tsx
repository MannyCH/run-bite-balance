
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateMealPlan } from "@/components/MealPlan/GenerateMealPlan";
import { DaySelector } from "@/components/MealPlan/DaySelector";
import { MealPlanContent } from "@/components/MealPlan/MealPlanContent";
import { NoMealPlan } from "@/components/MealPlan/NoMealPlan";
import { useMealPlan } from "@/hooks/useMealPlan";
import { Badge } from "@/components/ui/badge";

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
