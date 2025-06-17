
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

  // Create simplified run context for the AI prompt
  const runContext = runs.length > 0 
    ? `\n\n**RUN SCHEDULE:**\n${runs.map(run => {
        return `- ${run.date}: ${run.title} (${run.distance}km, ${Math.round(run.duration / 60)} minutes)`;
      }).join('\n')}\n\n**RUN DAY MEAL STRATEGY:**
      1. Pre-run snack: Light breakfast recipe (≤200 calories) for quick energy
      2. Enhanced lunch: Higher protein and recovery-focused to serve as post-run recovery meal
      3. No separate post-run snacks needed - lunch serves this purpose
      4. Always use existing recipes from the provided list for all meals and snacks`
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
