
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
        <MealList title="Breakfast">
          {breakfast.length > 0 ? (
            breakfast.map((item) => {
              const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
              return (
                <MealPlanItem
                  key={item.id}
                  title={recipe ? recipe.title : item.custom_title || "Custom Meal"}
                  mealType="breakfast"
                  recipeId={item.recipe_id}
                  nutritionalContext={item.nutritional_context}
                  stats={{
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fat: item.fat,
                  }}
                  isAiGenerated={item.is_ai_generated}
                  mainIngredient={item.main_ingredient}
                />
              );
            })
          ) : (
            <p className="text-gray-500">No breakfast planned</p>
          )}
        </MealList>

        {/* Lunch */}
        <MealList title="Lunch">
          {lunch.length > 0 ? (
            lunch.map((item) => {
              const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
              return (
                <MealPlanItem
                  key={item.id}
                  title={recipe ? recipe.title : item.custom_title || "Custom Meal"}
                  mealType="lunch"
                  recipeId={item.recipe_id}
                  nutritionalContext={item.nutritional_context}
                  stats={{
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fat: item.fat,
                  }}
                  isAiGenerated={item.is_ai_generated}
                  mainIngredient={item.main_ingredient}
                />
              );
            })
          ) : (
            <p className="text-gray-500">No lunch planned</p>
          )}
        </MealList>

        {/* Dinner */}
        <MealList title="Dinner">
          {dinner.length > 0 ? (
            dinner.map((item) => {
              const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
              return (
                <MealPlanItem
                  key={item.id}
                  title={recipe ? recipe.title : item.custom_title || "Custom Meal"}
                  mealType="dinner"
                  recipeId={item.recipe_id}
                  nutritionalContext={item.nutritional_context}
                  stats={{
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fat: item.fat,
                  }}
                  isAiGenerated={item.is_ai_generated}
                  mainIngredient={item.main_ingredient}
                />
              );
            })
          ) : (
            <p className="text-gray-500">No dinner planned</p>
          )}
        </MealList>

        {/* Snacks */}
        {snacks.length > 0 && (
          <MealList title="Snacks">
            {snacks.map((item) => {
              const recipe = item.recipe_id ? recipes[item.recipe_id] : null;
              return (
                <MealPlanItem
                  key={item.id}
                  title={recipe ? recipe.title : item.custom_title || "Custom Meal"}
                  mealType="snack"
                  recipeId={item.recipe_id}
                  nutritionalContext={item.nutritional_context}
                  stats={{
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fat: item.fat,
                  }}
                  isAiGenerated={item.is_ai_generated}
                  mainIngredient={item.main_ingredient}
                />
              );
            })}
          </MealList>
        )}
      </div>
    </div>
  );
};
