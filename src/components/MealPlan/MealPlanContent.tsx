
import React, { useMemo } from "react";
import { Calendar } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { MealList } from "./MealList";
import { RecipeStatsFooter } from "./RecipeStatsFooter";
import { calculateRecipeStats } from "@/utils/mealPlan/recipe/recipeAnalytics";

interface MealPlanContentProps {
  selectedDate: Date;
  mealPlanItems: MealPlanItemType[];
  recipes: Record<string, any>;
}

export const MealPlanContent: React.FC<MealPlanContentProps> = ({
  selectedDate,
  mealPlanItems,
  recipes
}) => {
  // Get meals for the selected date
  const selectedDateMeals = useMemo(() => {
    if (!mealPlanItems.length) return [];

    return mealPlanItems.filter(item => {
      const itemDate = parseISO(item.date);
      return isSameDay(itemDate, selectedDate);
    }).sort((a, b) => {
      // Sort by meal type: breakfast, lunch, dinner, snack
      const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
      return order[a.meal_type] - order[b.meal_type];
    });
  }, [mealPlanItems, selectedDate]);

  // Check if there are any AI-generated meals for the selected date
  const hasAiGeneratedMeals = useMemo(() => 
    selectedDateMeals.some(item => item.is_ai_generated),
  [selectedDateMeals]);
  
  // Calculate uniqueness stats - both by ID, content, and main ingredients
  const uniqueRecipeStats = useMemo(() => 
    calculateRecipeStats(mealPlanItems, recipes, selectedDateMeals),
  [mealPlanItems, recipes, selectedDateMeals]);

  return (
    <>
      <Toaster position="top-right" />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Meals for {format(selectedDate, "EEEE, MMMM d")}
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>Your personalized meal plan for this day</span>
                {hasAiGeneratedMeals && (
                  <Badge className="ml-2 bg-purple-500 hover:bg-purple-600">
                    AI-generated
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MealList meals={selectedDateMeals} recipes={recipes} />
        </CardContent>
        {hasAiGeneratedMeals && (
          <RecipeStatsFooter uniqueRecipeStats={uniqueRecipeStats} />
        )}
      </Card>
    </>
  );
};
