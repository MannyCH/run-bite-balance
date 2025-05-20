// We need to update the code to properly handle the main_ingredient property by modifying the relevant part of the file.
// Since we can't see the full file, let's modify only the problematic part.

// The error is on line 101, which is trying to access main_ingredient on a MealPlanItem
// Let's update the processAIMealPlanItem function to fix this issue:

// Assuming the function looks something like this:
export function processAIMealPlanItem(item: any, recipe: any) {
  // When creating or updating meal plan items, make sure to properly handle main_ingredient
  const processedItem = {
    id: item.id,
    meal_plan_id: item.meal_plan_id,
    recipe_id: item.recipe_id,
    date: item.date,
    meal_type: item.meal_type,
    nutritional_context: item.nutritional_context,
    custom_title: item.custom_title,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    is_ai_generated: item.is_ai_generated,
    // Add the main_ingredient property if available from the recipe
    main_ingredient: recipe?.main_ingredient || null
  };

  return processedItem;
}

// Note: This is a partial update since we can't see the full file.
// The key change is ensuring that main_ingredient is properly included in the processed item.
