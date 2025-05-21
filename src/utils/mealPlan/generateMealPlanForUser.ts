
import {
  fetchUserProfile,
  fetchRecipes,
  insertMealPlanItems,
  createOrUpdateMealPlan,
} from "./mealPlanDb";
import { processAIRecipes } from "./aiRecipeProcessor";
import { assignMealTypesWithAI } from "./assignMealTypesWithAI";
import { Recipe } from "@/context/types";
import { shuffleArray } from "../shuffleArray";
import { generateDatedMealItems } from "./generateDatedMealItems";

export async function generateMealPlanForUser(
  userId: string,
  startDate: string,
  endDate: string,
  aiGeneratedRaw: any[]
) {
  const totalMeals = 21; // 7 days × 3 meals
  const profile = await fetchUserProfile(userId);
  if (!profile) throw new Error("User profile not found");

  const aiRatio = profile.ai_recipe_ratio ?? 30;
  const aiCount = Math.round((aiRatio / 100) * totalMeals);
  const savedCount = totalMeals - aiCount;

  const allRecipes = (await fetchRecipes()) ?? [];
  const savedRecipes = shuffleArray(allRecipes.filter(r => !r.is_ai_generated)).slice(0, savedCount);

  const savedAIRecipes = await processAIRecipes(aiGeneratedRaw);
  const aiRecipes = Object.values(savedAIRecipes);

  const allUsedRecipes = [...savedRecipes, ...aiRecipes];
  const recipesWithMealType = await assignMealTypesWithAI(allUsedRecipes, profile);

  const mealPlan = await createOrUpdateMealPlan(userId, startDate, endDate);
  if (!mealPlan) throw new Error("Could not create meal plan");

  const mealPlanItems = generateDatedMealItems(
    mealPlan.id,
    recipesWithMealType,
    startDate,
    endDate
  );

  await insertMealPlanItems(mealPlanItems);

  return { mealPlan, mealPlanItems };
}
