
import React from "react";
import { MealPlanItem } from "@/components/MealPlan/MealPlanItem";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";

interface MealListProps {
  meals: MealPlanItemType[];
  recipes: Record<string, any>;
}

export const MealList: React.FC<MealListProps> = ({ meals, recipes }) => {
  if (meals.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No meals planned for this day</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {meals.map((item) => {
        const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
        return <MealPlanItem key={item.id} item={item} recipe={recipe} />;
      })}
    </div>
  );
};
