import { MealPlanItem } from "@/types/profile";
import { Recipe } from "@/context/types";
import { addDays, formatISO } from "date-fns";

/**
 * Distribute recipes across the week by date and assigned meal_type.
 */
export function generateDatedMealItems(
  mealPlanId: string,
  recipes: (Recipe & { meal_type: MealPlanItem["meal_type"] })[],
  startDate: string,
  endDate: string
): Partial<MealPlanItem>[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const items: Partial<MealPlanItem>[] = [];
  const used = new Set<string>();

  // Use all allowed meal types, including "snack"
  const mealTypes: MealPlanItem["meal_type"][] = ["breakfast", "lunch", "dinner", "snack"];

  for (let d = 0; d < totalDays; d++) {
    const date = formatISO(addDays(start, d), { representation: "date" });

    for (const mealType of mealTypes) {
      const recipe = recipes.find(
        r => r.meal_type === mealType && !used.has(r.id)
      );
      if (!recipe) continue;

      items.push({
        meal_plan_id: mealPlanId,
        recipe_id: recipe.id,
        date,
        meal_type: mealType,
        custom_title: recipe.title,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        is_ai_generated: recipe.is_ai_generated ?? false,
        main_ingredient: recipe.main_ingredient ?? null,
      });

      used.add(recipe.id);
    }
  }

  return items;
}
