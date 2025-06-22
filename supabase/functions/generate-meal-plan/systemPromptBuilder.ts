
import { fetchBernWeather } from "./weatherService.ts";
import { getBatchCookingConfig, buildBatchCookingPrompt, type BatchCookingConfig } from "./batchCookingUtils.ts";
import { RecipeSummary } from "./types.ts";

interface UserProfile {
  fitness_goal?: 'lose' | 'maintain' | 'gain' | null;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  dietary_preferences?: string[] | null;
  food_allergies?: string[] | null;
  foods_to_avoid?: string[] | null;
  preferred_cuisines?: string[] | null;
  meal_complexity?: 'simple' | 'moderate' | 'complex' | null;
  batch_cooking_enabled?: boolean | null;
  batch_cooking_intensity?: 'low' | 'medium' | 'high' | null;
  batch_cooking_people?: number | null;
}

export async function buildSystemPrompt(
  profile: UserProfile,
  recipes: RecipeSummary[],
  requirements: any,
  startDate: string,
  endDate: string,
  runContext: string
): Promise<string> {
  // Get weather context for Bern, Switzerland
  let weatherContext = 'Weather data unavailable.';
  try {
    const weatherData = await fetchBernWeather(startDate, endDate);
    if (weatherData) {
      weatherContext = `Current season in Bern: ${weatherData.season} with average temperature ${weatherData.averageTemp}°C. ${weatherData.temperatureCategory} conditions suggest ${weatherData.season === 'winter' ? 'warming, hearty meals' : weatherData.season === 'summer' ? 'lighter, refreshing meals' : 'seasonal comfort foods'}.`;
    }
  } catch (weatherError) {
    console.error('Error fetching weather data:', weatherError);
  }

  // Get batch cooking configuration
  const batchConfig = getBatchCookingConfig(profile);

  // Group recipes by meal type for better organization
  const breakfastRecipes = recipes.filter(r => r.meal_type?.includes('breakfast')).slice(0, 15);
  const lunchRecipes = recipes.filter(r => r.meal_type?.includes('lunch')).slice(0, 15);
  const dinnerRecipes = recipes.filter(r => r.meal_type?.includes('dinner')).slice(0, 15);
  const snackRecipes = recipes.filter(r => r.calories <= 200).slice(0, 10);

  return `You are a professional nutritionist creating a 7-day meal plan. Follow these rules exactly:

**USER PROFILE:**
- Goal: ${profile.fitness_goal || 'maintain'} weight
- Activity: ${profile.activity_level || 'moderate'}
- Daily Calories: ${requirements.targetCalories}
- Protein: ${requirements.proteinGrams}g | Carbs: ${requirements.carbGrams}g | Fat: ${requirements.fatGrams}g
- Dietary Preferences: ${profile.dietary_preferences?.join(', ') || 'none'}
- Allergies: ${profile.food_allergies?.join(', ') || 'none'}
- Foods to Avoid: ${profile.foods_to_avoid?.join(', ') || 'none'}
- Preferred Cuisines: ${profile.preferred_cuisines?.join(', ') || 'varied'}
- Meal Complexity: ${profile.meal_complexity || 'moderate'}

**WEATHER & SEASON:**
${weatherContext}

**RUN SCHEDULE:**${runContext}

**BATCH COOKING SETTINGS:**
${buildBatchCookingPrompt(batchConfig)}

**RECIPE DATABASE (Format: ID|Title|MealTypes|Calories|Protein|Carbs|Fat):**
BREAKFASTS (${breakfastRecipes.length}):
${breakfastRecipes.map(r => `${r.id}|${r.title}|${r.calories}c`).join('\n')}

LUNCHES (${lunchRecipes.length}):
${lunchRecipes.map(r => `${r.id}|${r.title}|${r.calories}c`).join('\n')}

DINNERS (${dinnerRecipes.length}):
${dinnerRecipes.map(r => `${r.id}|${r.title}|${r.calories}c`).join('\n')}

SNACKS ≤200cal (${snackRecipes.length}):
${snackRecipes.map(r => `${r.id}|${r.title}|${r.calories}c`).join('\n')}

**CRITICAL RULES:**
1. **JSON ONLY**: Return ONLY valid JSON, no markdown, no explanations, no extra text
2. **Recipe IDs**: Use ONLY the exact recipe IDs from above database
3. **Run Days**: Add "pre_run_snack" (≤200 cal) before runs, enhance lunch for post-run recovery
4. **Meal Types**: breakfast, lunch, dinner, pre_run_snack ONLY
5. **Seasonal**: Consider ${weatherContext.includes('winter') ? 'warming' : weatherContext.includes('summer') ? 'cooling' : 'seasonal'} foods
6. **Validation**: Every recipe_id MUST exist in the provided database

**REQUIRED JSON FORMAT:**
{
  "message": "Brief meal plan summary with${batchConfig.enabled ? ` ${batchConfig.intensity} intensity batch cooking strategy` : ' variety approach'}",
  "mealPlan": {
    "days": [
      {
        "date": "YYYY-MM-DD",
        "meals": [
          {
            "meal_type": "breakfast|lunch|dinner|pre_run_snack",
            "recipe_id": "exact-id-from-database",
            "explanation": "Why this meal fits the day${batchConfig.enabled ? ', portion notes if batched' : ''}"
          }
        ]
      }
    ]
  }
}

Generate the meal plan now. Return ONLY the JSON object.`;
}
