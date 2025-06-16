
import { UserProfile } from "../../../src/types/profile.ts";
import { callOpenAIMealPlan } from "./openaiApi.ts";
import { calculateAllDailyRequirements, prepareRecipeData } from "./dataPreparation.ts";
import type { RecipeSummary } from './types.ts';

export async function generateAIMealPlan(
  userId: string,
  profile: UserProfile,
  recipes: RecipeSummary[],
  runs: any[],
  startDate: string,
  endDate: string
): Promise<any> {
  console.log(`Generating AI meal plan for user ${userId} from ${startDate} to ${endDate}`);
  
  // Filter valid recipes with basic nutritional data
  const validRecipes = recipes.filter(recipe => 
    recipe.calories > 0 && 
    recipe.protein >= 0 && 
    recipe.carbs >= 0 && 
    recipe.fat >= 0 &&
    recipe.meal_type && 
    recipe.meal_type.length > 0
  );

  if (validRecipes.length === 0) {
    throw new Error('No valid recipes available for meal planning');
  }

  // Calculate nutritional requirements
  const requirements = calculateAllDailyRequirements(profile);
  
  console.log(`Runs found: ${runs.length}`);
  runs.forEach((run, index) => {
    console.log(`Run ${index + 1}: ${run.title} on ${run.date}, ${run.distance}km, ${Math.round(run.duration / 60)}min`);
  });

  // Create run context for the AI prompt
  const runContext = runs.length > 0 
    ? `\n\nIMPORTANT RUN SCHEDULE:\n${runs.map(run => 
        `- ${run.date}: ${run.title} (${run.distance}km, ${Math.round(run.duration / 60)} minutes)`
      ).join('\n')}\n\nFor run days, include:
      1. Pre-run snack (light carbs, 150-200 calories, easy to digest)
      2. Post-run snack for runs 5km+ (protein + carbs for recovery, 200-300 calories)
      3. Adjust lunch portions for better post-run recovery`
    : '';

  try {
    const result = await callOpenAIMealPlan(
      profile,
      validRecipes,
      requirements,
      startDate,
      endDate,
      runContext
    );
    
    return result;
  } catch (error) {
    console.error('Error generating AI meal plan:', error);
    throw error;
  }
}
