
import React from "react";
import { Calendar } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MealPlanItem } from "./MealPlanItem";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const getSelectedDateMeals = () => {
    if (!mealPlanItems.length) return [];

    return mealPlanItems.filter(item => {
      const itemDate = parseISO(item.date);
      return isSameDay(itemDate, selectedDate);
    }).sort((a, b) => {
      // Sort by meal type: breakfast, lunch, dinner, snack
      const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
      return order[a.meal_type] - order[b.meal_type];
    });
  };

  // Check if there are any AI-generated meals for the selected date
  const hasAiGeneratedMeals = getSelectedDateMeals().some(item => item.is_ai_generated);

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
              <CardDescription>
                Your personalized meal plan for this day
                {hasAiGeneratedMeals && (
                  <span className="ml-2 text-purple-500 font-medium">
                    (includes AI-generated recipes)
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {getSelectedDateMeals().length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No meals planned for this day</p>
            </div>
          ) : (
            <div className="space-y-6">
              {getSelectedDateMeals().map((item) => {
                const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
                return <MealPlanItem key={item.id} item={item} recipe={recipe} />;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
