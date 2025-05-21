import React from "react";
import { MealPlanItem } from "@/components/MealPlan/MealPlanItem";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";

interface MealListProps {
  meals: MealPlanItemType[];
  recipes: Record<string, any>;
  title?: string;
  children?: React.ReactNode;
}

export const MealList: React.FC<MealListProps> = ({ meals, recipes, title, children }) => {
  // If children are provided, render them directly
  if (children) {
    return (
      <div className="mb-8">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    );
  }
  
  // Otherwise render based on meals data
  if (!meals || meals.length === 0) {
    return (
      <div className="mb-8">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="text-center py-4">
          <p className="text-muted-foreground">No meals planned</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="space-y-4">
        {meals.map((item) => {
          const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
          return <MealPlanItem key={item.id} item={item} recipe={recipe} />;
        })}
      </div>
    </div>
  );
};
