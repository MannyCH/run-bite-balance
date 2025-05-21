import {
  fetchUserProfile,
  fetchRecipes,
  insertMealPlanItems,
  createOrUpdateMealPlan,
} from "./mealPlanDb";
import { processAIRecipes } from "./aiRecipeProcessor";
import { generateDatedMealItems } from "./generateDatedMealItems";
import { MealPlanItem } from "@/types/profile";
import { Recipe } from "@/context/types";
import { shuffleArray } from "../utils/shuffleArray";

/**
 * Creates a weekly meal plan based on user preferences.
 * Mixes saved user recipes with new AI-generated ones.
 */
export async function generateMealPlanForUser(
  userId: string,
  startDate: string,
  endDate: string,
  aiGeneratedRaw: any[] // raw data returned from Supabase Edge Function
): Promise<{ mealPlan: any; mealPlanItems: MealPlanItem[] }> {
  const totalMeals = 21; // 7 days × 3 meals
  const profile = await fetchUserProfile(userId);
  if (!profile) throw new Error("User profile not found");

  const aiRatio = profile.ai_recipe_ratio ?? 30;
  const aiCount = Math.round((aiRatio / 100) * totalMeals);
  const savedCount = totalMeals - aiCount;

  // Fetch user's saved recipes
  const allRecipes = (await fetchRecipes()) ?? [];
  const savedRecipes = shuffleArray(
    allRecipes.filter((r) => !r.is_ai_generated)
  ).slice(0, savedCount);

  // Process and save the AI-generated recipes
  const savedAIRecipes = await processAIRecipes(aiGeneratedRaw);
  const aiRecipes = Object.values(savedAIRecipes);

  // All recipes now must include `meal_type`
  const allUsedRecipes = [...savedRecipes, ...aiRecipes] as (Recipe & {
    meal_type: MealPlanItem["meal_type"];
  })[];

  // Create or update the user's meal plan for the given week
  const mealPlan = await createOrUpdateMealPlan(userId, startDate, endDate);
  if (!mealPlan) throw new Error("Could not create meal plan");

  // Spread the recipes across 7 days × 3 meals
  const mealPlanItems = generateDatedMealItems(
    mealPlan.id,
    allUsedRecipes,
    startDate,
    endDate
  );

  // Save items to database
  const savedItems = await insertMealPlanItems(mealPlanItems);
  if (!savedItems) throw new Error("Failed to save meal plan items");

  return {
    mealPlan,
    mealPlanItems: savedItems,
  };
}
