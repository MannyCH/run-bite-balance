
import { RecipeSummary } from "./types.ts";
import { fetchBernWeather } from "./weatherService.ts";

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

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function extractJsonFromResponse(content: string): any {
  console.log(`Extracting JSON from response content...`);
  console.log(`Response length: ${content.length} characters`);
  
  // First try to parse as direct JSON
  try {
    const parsed = JSON.parse(content.trim());
    console.log(`✅ Successfully parsed response as direct JSON`);
    return parsed;
  } catch (directParseError) {
    console.log(`Direct JSON parse failed, looking for JSON object boundaries...`);
  }
  
  // Look for JSON object boundaries in text that might contain markdown or explanations
  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    console.log(`Found JSON object boundaries in plain text`);
    const jsonContent = content.substring(jsonStart, jsonEnd + 1);
    console.log(`Extracted JSON content: ${jsonContent.substring(0, 500)}${jsonContent.length > 500 ? '...' : ''}`);
    
    try {
      const parsed = JSON.parse(jsonContent);
      console.log(`✅ Successfully parsed and validated OpenAI response`);
      return parsed;
    } catch (extractedParseError) {
      console.error(`Failed to parse extracted JSON:`, extractedParseError);
    }
  }
  
  // If all parsing attempts fail, throw an error
  console.error(`Unable to extract valid JSON from response`);
  throw new Error('Failed to parse OpenAI response as JSON');
}

function validateMealPlanResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    console.error('Response is not a valid object');
    return false;
  }

  if (!response.message || typeof response.message !== 'string') {
    console.error('Missing or invalid message field');
    return false;
  }

  if (!response.mealPlan || !response.mealPlan.days || !Array.isArray(response.mealPlan.days)) {
    console.error('Missing or invalid mealPlan.days array');
    return false;
  }

  // Validate each day has required structure
  for (const day of response.mealPlan.days) {
    if (!day.date || !day.meals || !Array.isArray(day.meals)) {
      console.error(`Invalid day structure: missing date or meals array`);
      return false;
    }

    // Validate each meal has required fields
    for (const meal of day.meals) {
      if (!meal.meal_type || !meal.recipe_id) {
        console.error(`Invalid meal structure: missing meal_type or recipe_id`);
        return false;
      }
    }
  }

  return true;
}

export async function callOpenAIMealPlan(
  profile: UserProfile,
  recipes: RecipeSummary[],
  requirements: any,
  startDate: string,
  endDate: string,
  runContext: string = ''
): Promise<any> {
  console.log(`Calling OpenAI GPT-4.1 for meal plan from ${startDate} to ${endDate}`);

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

  // Check for batch cooking settings
  const batchCookingEnabled = profile.batch_cooking_repetitions && profile.batch_cooking_repetitions > 1;
  const batchRepetitions = profile.batch_cooking_repetitions || 1;
  const batchPeople = profile.batch_cooking_people || 1;

  // Calculate max unique recipes per meal type for batch cooking
  const totalDays = 7; // Always 7 days for weekly plan
  const maxUniqueDinners = batchCookingEnabled ? Math.ceil(totalDays / batchRepetitions) : totalDays;
  const maxUniqueLunches = batchCookingEnabled ? Math.ceil(totalDays / Math.max(2, batchRepetitions - 1)) : totalDays;
  const maxUniqueBreakfasts = batchCookingEnabled ? Math.ceil(totalDays / Math.max(2, batchRepetitions - 2)) : totalDays;

  // Create compact recipe format to save tokens
  const compactRecipes = recipes.map(r => {
    const mealTypes = Array.isArray(r.meal_type) ? r.meal_type : (r.meal_type ? [r.meal_type] : []);
    return `${r.id}|${r.title}|${mealTypes.join(',')}|${r.calories}c|${r.protein}p|${r.carbs}c|${r.fat}f`;
  }).join('\n');

  // Group recipes by meal type for better organization
  const breakfastRecipes = recipes.filter(r => r.meal_type?.includes('breakfast')).slice(0, 15);
  const lunchRecipes = recipes.filter(r => r.meal_type?.includes('lunch')).slice(0, 15);
  const dinnerRecipes = recipes.filter(r => r.meal_type?.includes('dinner')).slice(0, 15);
  const snackRecipes = recipes.filter(r => r.calories <= 200).slice(0, 10);

  const systemPrompt = `You are a professional nutritionist creating a 7-day meal plan. Follow these rules exactly:

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
${batchCookingEnabled ? `
- ENABLED: Repeat recipes ${batchRepetitions}x per week for ${batchPeople} people
- Max unique dinners: ${maxUniqueDinners} (priority for batching)
- Max unique lunches: ${maxUniqueLunches} (secondary priority)
- Max unique breakfasts: ${maxUniqueBreakfasts} (lower priority)
- NEVER batch snacks - always unique for run days
- Allow 2-4x variation based on practical needs
- Include portion notes like "Make double portion for 2 meals"` : `
- DISABLED: Provide variety across all 7 days
- Each day should have unique meal combinations`}

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
  "message": "Brief meal plan summary with${batchCookingEnabled ? ' batch cooking strategy' : ' variety approach'}",
  "mealPlan": {
    "days": [
      {
        "date": "YYYY-MM-DD",
        "meals": [
          {
            "meal_type": "breakfast|lunch|dinner|pre_run_snack",
            "recipe_id": "exact-id-from-database",
            "explanation": "Why this meal fits the day${batchCookingEnabled ? ', portion notes if batched' : ''}"
          }
        ]
      }
    ]
  }
}

Generate the meal plan now. Return ONLY the JSON object.`;

  const data = {
    model: "gpt-4.1-2025-04-14",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENAI_API_KEY}`,
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      console.error(await response.text());
      throw new Error(`OpenAI API call failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      console.error("OpenAI API error:", result.error);
      throw new Error(`OpenAI API returned an error: ${result.error.message}`);
    }

    const content = result.choices[0].message.content;
    console.log(`Raw Content from OpenAI (${content.length} chars): ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`);

    // Extract and validate JSON
    const parsedContent = extractJsonFromResponse(content);
    
    // Validate the response structure
    if (!validateMealPlanResponse(parsedContent)) {
      throw new Error("Invalid meal plan response structure from OpenAI");
    }

    console.log(`✅ AI meal plan generated successfully with ${batchCookingEnabled ? 'batch cooking approach' : 'variety approach'}`);
    console.log(`📊 Result overview: {
  hasMealPlan: ${!!parsedContent?.mealPlan},
  messageLength: ${parsedContent?.message?.length || 0},
  totalDays: ${parsedContent?.mealPlan?.days?.length || 0},
  isFallback: false
}`);
    
    return parsedContent;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
