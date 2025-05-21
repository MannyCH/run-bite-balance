import { openaiGenerateRecipe } from "@/integrations/openai";
import { getSavedRecipesForUser } from "@/utils/recipes";
import { insertMealPlan, insertMealPlanItems } from "./mealPlanDb";

export const generateMealPlanForUser = async (userId: string, aiRecipeRatio: number) => {
  const totalMeals = 10; // Adjust based on your use case
  const aiCount = Math.round((aiRecipeRatio / 100) * totalMeals);
  const savedCount = totalMeals - aiCount;

  console.log(`Generating ${aiCount} AI recipes and ${savedCount} saved recipes for user.`);

  // Step 1: Generate AI recipes
  const aiRecipes = [];
  for (let i = 0; i < aiCount; i++) {
    const aiRecipe = await openaiGenerateRecipe(userId);
    if (aiRecipe) {
      aiRecipes.push({
        ...aiRecipe,
        is_ai_generated: true,
      });
    }
  }

  // Step 2: Get saved recipes (you might want to shuffle or randomize)
  const savedRecipes = await getSavedRecipesForUser(userId, savedCount);
  const finalSaved = savedRecipes.slice(0, savedCount);

  // Step 3: Create meal plan entry
  const mealPlan = await insertMealPlan(userId);

  // Step 4: Build meal plan items
  const mealPlanItems = [...aiRecipes, ...finalSaved].map((recipe, index) => ({
    meal_plan_id: mealPlan.id,
    recipe_id: recipe.id,
    date: new Date().toISOString(), // Replace with dynamic dates if needed
    meal_type: "lunch", // Replace or rotate through 'breakfast', 'dinner', etc.
    is_ai_generated: recipe.is_ai_generated || false,
    nutritional_context: null,
    custom_title: recipe.title || null,
    calories: recipe.calories || 0,
    protein: recipe.protein || 0,
    carbs: recipe.carbs || 0,
    fat: recipe.fat || 0,
    main_ingredient: recipe.main_ingredient || null,
  }));

  // Step 5: Store items
  await insertMealPlanItems(mealPlanItems);

  return {
    mealPlan,
    mealPlanItems,
  };
};
