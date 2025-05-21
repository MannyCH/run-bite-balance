
import { Recipe } from "@/context/types";
import { MealPlanItem } from "@/types/profile";
import { addDays, format, parse } from "date-fns";

/**
 * Generates meal plan items for each day between start and end date
 * @param mealPlanId ID of the meal plan
 * @param recipes Recipes to use in the meal plan, with meal types assigned
 * @param startDate Start date of the meal plan (YYYY-MM-DD format)
 * @param endDate End date of the meal plan (YYYY-MM-DD format)
 * @returns Array of meal plan items
 */
export function generateDatedMealItems(
  mealPlanId: string,
  recipes: Recipe[],
  startDate: string,
  endDate: string
): Partial<MealPlanItem>[] {
  // Parse the start and end dates
  const start = parse(startDate, 'yyyy-MM-dd', new Date());
  const end = parse(endDate, 'yyyy-MM-dd', new Date());
  
  // Calculate date range (number of days)
  const dayCount = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Group recipes by meal type
  const recipesByMealType: Record<string, Recipe[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    // snack: [], // Uncomment if you want to include snacks
  };
  
  // Sort recipes into meal type groups based on categories or assigned types
  recipes.forEach(recipe => {
    const categories = recipe.categories || [];
    
    if (categories.includes('breakfast')) {
      recipesByMealType.breakfast.push(recipe);
    } else if (categories.includes('lunch')) {
      recipesByMealType.lunch.push(recipe);
    } else if (categories.includes('dinner')) {
      recipesByMealType.dinner.push(recipe);
    } else if (categories.includes('snack')) {
      // recipesByMealType.snack.push(recipe); // Uncomment if you want to include snacks
    } else {
      // If no meal type category, assign based on properties or randomly
      const proteinContent = recipe.protein || 0;
      
      if (proteinContent < 10) {
        recipesByMealType.breakfast.push(recipe);
      } else if (proteinContent < 20) {
        recipesByMealType.lunch.push(recipe);
      } else {
        recipesByMealType.dinner.push(recipe);
      }
    }
  });
  
  // Create meal plan items for each day and meal type
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  
  for (let i = 0; i < dayCount; i++) {
    const currentDate = addDays(start, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    // Add breakfast for this day
    if (recipesByMealType.breakfast.length > 0) {
      const index = i % recipesByMealType.breakfast.length;
      const recipe = recipesByMealType.breakfast[index];
      
      mealPlanItems.push({
        meal_plan_id: mealPlanId,
        recipe_id: recipe.id,
        date: dateStr,
        meal_type: 'breakfast',
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        is_ai_generated: recipe.is_ai_generated,
        main_ingredient: recipe.main_ingredient
      });
    }
    
    // Add lunch for this day
    if (recipesByMealType.lunch.length > 0) {
      const index = i % recipesByMealType.lunch.length;
      const recipe = recipesByMealType.lunch[index];
      
      mealPlanItems.push({
        meal_plan_id: mealPlanId,
        recipe_id: recipe.id,
        date: dateStr,
        meal_type: 'lunch',
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        is_ai_generated: recipe.is_ai_generated,
        main_ingredient: recipe.main_ingredient
      });
    }
    
    // Add dinner for this day
    if (recipesByMealType.dinner.length > 0) {
      const index = i % recipesByMealType.dinner.length;
      const recipe = recipesByMealType.dinner[index];
      
      mealPlanItems.push({
        meal_plan_id: mealPlanId,
        recipe_id: recipe.id,
        date: dateStr,
        meal_type: 'dinner',
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        is_ai_generated: recipe.is_ai_generated,
        main_ingredient: recipe.main_ingredient
      });
    }
    
    // Uncomment to add snacks
    // if (recipesByMealType.snack.length > 0) {
    //   const index = i % recipesByMealType.snack.length;
    //   const recipe = recipesByMealType.snack[index];
    //   
    //   mealPlanItems.push({
    //     meal_plan_id: mealPlanId,
    //     recipe_id: recipe.id,
    //     date: dateStr,
    //     meal_type: 'snack',
    //     calories: recipe.calories,
    //     protein: recipe.protein,
    //     carbs: recipe.carbs,
    //     fat: recipe.fat,
    //     is_ai_generated: recipe.is_ai_generated,
    //     main_ingredient: recipe.main_ingredient
    //   });
    // }
  }
  
  return mealPlanItems;
}
