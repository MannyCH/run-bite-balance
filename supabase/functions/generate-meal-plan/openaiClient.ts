
import { callOpenAIMealPlan } from "./openaiApi.ts";
import { calculateAllDailyRequirements, prepareRecipeData } from "./dataPreparation.ts";
import type { RecipeSummary } from './types.ts';

// Define UserProfile interface directly in edge function context
interface UserProfile {
  id: string;
  username?: string | null;
  weight?: number | null;
  target_weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  fitness_goal?: 'lose' | 'maintain' | 'gain' | null;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  bmr?: number | null;
  dietary_preferences?: string[] | null;
  nutritional_theory?: string | null;
  food_allergies?: string[] | null;
  preferred_cuisines?: string[] | null;
  foods_to_avoid?: string[] | null;
  meal_complexity?: 'simple' | 'moderate' | 'complex' | null;
  ical_feed_url?: string | null;
  avatar_url?: string | null;
}

/**
 * Helper function to check if a run is during lunch time (11:00-14:00)
 */
function isLunchTimeRun(run: any): boolean {
  const runDate = new Date(run.date);
  const hour = runDate.getHours();
  return hour >= 11 && hour <= 14;
}

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
    const runDate = new Date(run.date);
    const isLunchTime = isLunchTimeRun(run);
    console.log(`Run ${index + 1}: ${run.title} on ${run.date}, ${run.distance}km, ${Math.round(run.duration / 60)}min, lunch-time: ${isLunchTime}`);
  });

  // Create enhanced run context for the AI prompt with timing information
  const runContext = runs.length > 0 
    ? `\n\n**IMPORTANT RUN SCHEDULE WITH TIMING:**\n${runs.map(run => {
        const runDate = new Date(run.date);
        const isLunchTime = isLunchTimeRun(run);
        return `- ${run.date}: ${run.title} (${run.distance}km, ${Math.round(run.duration / 60)} minutes)${isLunchTime ? ' [LUNCH-TIME RUN]' : ''}`;
      }).join('\n')}\n\n**RUN-SPECIFIC MEAL RULES:**
      1. Pre-run snack (light breakfast recipe, ≤200 calories, easy to digest)
      2. For LUNCH-TIME RUNS (11:00-14:00): Skip post-run snack and enhance lunch with "POST-RUN RECOVERY" context
      3. For OTHER run times: Add post-run snack (light lunch recipe, ≤300 calories) only for runs 5km+
      4. Always use existing recipes from the provided list for snacks - never create custom items`
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
