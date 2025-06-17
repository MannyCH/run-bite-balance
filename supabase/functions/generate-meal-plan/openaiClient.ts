
import { callOpenAIMealPlan } from "./openaiApi.ts";
import { generateFallbackMealPlan } from "./fallbackMealPlanner.ts";
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
  batch_cooking_repetitions?: number | null;
  batch_cooking_people?: number | null;
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

  // Log batch cooking configuration
  const batchCookingEnabled = profile.batch_cooking_repetitions && profile.batch_cooking_repetitions > 1;
  const batchCookingRepetitions = profile.batch_cooking_repetitions || 1;
  
  if (batchCookingEnabled) {
    console.log(`Batch cooking enabled: ${batchCookingRepetitions}x repetitions for ${profile.batch_cooking_people || 1} people`);
    
    if (batchCookingRepetitions >= 5) {
      console.log(`Using STRICT batch cooking mode (${batchCookingRepetitions}x exact repetitions)`);
    } else {
      console.log(`Using FLEXIBLE batch cooking mode (${batchCookingRepetitions}x target repetitions)`);
    }
  }

  // Separate snack recipes from main meal recipes
  const snackRecipes = validRecipes.filter(recipe => recipe.meal_type?.includes('snack'));
  const mainMealRecipes = validRecipes.filter(recipe => 
    !recipe.meal_type?.includes('snack') && 
    (recipe.meal_type?.includes('breakfast') || 
     recipe.meal_type?.includes('lunch') || 
     recipe.meal_type?.includes('dinner'))
  );

  console.log(`Recipe distribution: ${mainMealRecipes.length} main meal recipes, ${snackRecipes.length} snack recipes`);

  // Calculate nutritional requirements
  const requirements = calculateAllDailyRequirements(profile);
  
  console.log(`Runs found: ${runs.length}`);
  runs.forEach((run, index) => {
    console.log(`Run ${index + 1}: ${run.title} on ${run.date}, ${run.distance}km, ${Math.round(run.duration / 60)}min`);
  });

  // Create enhanced run context for the AI prompt
  const runContext = runs.length > 0 
    ? `\n\n**RUN SCHEDULE:**\n${runs.map(run => {
        return `- ${run.date}: ${run.title} (${run.distance}km, ${Math.round(run.duration / 60)} minutes)`;
      }).join('\n')}\n\n**RUN DAY MEAL STRATEGY:**
      1. Pre-run snack: Use ONLY snack-classified recipes (≤200 calories) for quick energy
      2. Enhanced lunch: Higher protein and recovery-focused to serve as post-run recovery meal  
      3. NO separate post-run snacks needed - enhanced lunch serves this purpose
      4. Always use existing recipes from the provided list for all meals
      5. Snack selections do NOT interfere with main meal batch cooking calculations`
    : '';

  // Try AI meal planning first
  try {
    console.log('🤖 Attempting AI meal plan generation...');
    const result = await callOpenAIMealPlan(
      profile,
      validRecipes,
      requirements,
      startDate,
      endDate,
      runContext
    );
    
    console.log(`✅ AI meal plan generated successfully with ${batchCookingEnabled ? 'batch cooking' : 'standard variety'} approach`);
    
    return result;
  } catch (error) {
    console.error('❌ AI meal plan generation failed:', error);
    console.log('🔄 Falling back to algorithmic meal planning...');
    
    // Use comprehensive fallback system
    try {
      const fallbackResult = generateFallbackMealPlan(
        profile,
        validRecipes,
        startDate,
        endDate,
        runs
      );
      
      console.log(`✅ Fallback meal plan generated successfully with ${batchCookingEnabled ? 'batch cooking' : 'standard variety'} approach`);
      
      return fallbackResult;
    } catch (fallbackError) {
      console.error('❌ Fallback meal plan generation also failed:', fallbackError);
      throw new Error('Both AI and fallback meal planning failed');
    }
  }
}
