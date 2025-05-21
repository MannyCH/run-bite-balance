
import React from "react";
import { format } from "date-fns";
import { MealPlanItem } from "./MealPlanItem";
import { MealList } from "./MealList";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";

interface MealPlanContentProps {
  selectedDate: Date;
  mealPlanItems: MealPlanItemType[];
  recipes: Record<string, any>;
}

export const MealPlanContent: React.FC<MealPlanContentProps> = ({
  selectedDate,
  mealPlanItems,
  recipes,
}) => {
  // Get items for the selected date
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const itemsForSelectedDate = mealPlanItems.filter(
    (item) => item.date === formattedDate
  );

  // Group items by meal type
  const breakfast = itemsForSelectedDate.filter(
    (item) => item.meal_type === "breakfast"
  );
  const lunch = itemsForSelectedDate.filter(
    (item) => item.meal_type === "lunch"
  );
  const dinner = itemsForSelectedDate.filter(
    (item) => item.meal_type === "dinner"
  );
  const snacks = itemsForSelectedDate.filter(
    (item) => item.meal_type === "snack"
  );

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Meals for {format(selectedDate, "EEEE, MMMM d")}
      </h2>

      <div className="space-y-8">
        {/* Breakfast */}
        <MealList title="Breakfast" meals={breakfast} recipes={recipes} />

        {/* Lunch */}
        <MealList title="Lunch" meals={lunch} recipes={recipes} />

        {/* Dinner */}
        <MealList title="Dinner" meals={dinner} recipes={recipes} />

        {/* Snacks */}
        {snacks.length > 0 && (
          <MealList title="Snacks" meals={snacks} recipes={recipes} />
        )}
      </div>
    </div>
  );
};
