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
      weatherContext = `The weather in Bern is ${weatherData.season} season with an average temperature of ${weatherData.averageTemp}°C (${weatherData.temperatureCategory} conditions).`;
    }
  } catch (weatherError) {
    console.error('Error fetching weather data:', weatherError);
  }

  // Categorize recipes for easier selection
  const breakfastRecipes = recipes.filter(r => r.meal_type?.includes('breakfast'));
  const lunchRecipes = recipes.filter(r => r.meal_type?.includes('lunch'));
  const dinnerRecipes = recipes.filter(r => r.meal_type?.includes('dinner'));
  const snackRecipes = recipes.filter(r => r.meal_type?.includes('snack'));

  // Batch cooking configuration
  const batchCookingEnabled = profile.batch_cooking_repetitions && profile.batch_cooking_repetitions > 1;
  const batchCookingRepetitions = profile.batch_cooking_repetitions || 1;
  const batchCookingPeople = profile.batch_cooking_people || 1;

  // Determine batch cooking mode based on repetition setting
  const isStrictBatchCooking = batchCookingRepetitions >= 5;
  const uniqueRecipesNeeded = Math.ceil(21 / batchCookingRepetitions); // 21 meals per week (7 days × 3 meals)

  let batchCookingInstructions = '';
  if (batchCookingEnabled) {
    if (isStrictBatchCooking) {
      batchCookingInstructions = `

**STRICT BATCH COOKING MODE (${batchCookingRepetitions}x repetitions):**
- EXACT repetitions required: Each selected recipe MUST appear exactly ${batchCookingRepetitions} times
- Calculate exact unique recipes needed: approximately ${uniqueRecipesNeeded} unique recipes for the week
- Priority order: Dinner (most important), Lunch (secondary), Breakfast (least important)
- NO flexibility in repetitions - user wants meal prep efficiency with exact repetitions
- Portion calculations: "Make ${batchCookingRepetitions}x portion for ${batchCookingPeople} people = ${batchCookingRepetitions * batchCookingPeople} total servings"

**STRICT MODE MEAL DISTRIBUTION:**
- Select exactly ${Math.ceil(7 / batchCookingRepetitions)} unique dinner recipes, each appearing ${batchCookingRepetitions} times
- Select exactly ${Math.ceil(7 / batchCookingRepetitions)} unique lunch recipes, each appearing ${batchCookingRepetitions} times  
- Select exactly ${Math.ceil(7 / batchCookingRepetitions)} unique breakfast recipes, each appearing ${batchCookingRepetitions} times
- Example: For 7 repetitions, use 1 dinner recipe 7 times, 1 lunch recipe 7 times, 1 breakfast recipe 7 times

**PORTION & STORAGE GUIDANCE:**
- Include meal prep instructions: "Cook once at start of week, portion into ${batchCookingRepetitions} containers"
- Add storage notes: "Refrigerate for 3-4 days, freeze remainder if cooking for full week"
- Reheating instructions for each recipe type
`;
    } else {
      batchCookingInstructions = `

**FLEXIBLE BATCH COOKING MODE (${batchCookingRepetitions}x target repetitions):**
- Target: Aim for recipes to appear ${batchCookingRepetitions} times, allow 2-${batchCookingRepetitions + 1} variation
- Priority: Focus batch cooking primarily on dinner recipes (most time-consuming)
- Allow intelligent variation based on run day requirements and nutritional needs
- Portion guidance: "Make ${batchCookingRepetitions}x portion for ${batchCookingPeople} people"
`;
    }
  }

  const systemPrompt = `You are a professional nutritionist and meal planning expert. Create a detailed 7-day meal plan that considers:

1. **User Profile**: ${profile.fitness_goal || 'maintain'} fitness goal, ${profile.activity_level || 'moderate'} activity level
2. **Nutritional Requirements**: ${requirements.targetCalories} calories/day, ${requirements.proteinGrams}g protein, ${requirements.carbGrams}g carbs, ${requirements.fatGrams}g fat
3. **Dietary Preferences**: ${profile.dietary_preferences?.join(', ') || 'none specified'}
4. **Allergies to Avoid**: ${profile.food_allergies?.join(', ') || 'none'}
5. **Foods to Avoid**: ${profile.foods_to_avoid?.join(', ') || 'none'}
6. **Preferred Cuisines**: ${profile.preferred_cuisines?.join(', ') || 'any'}
7. **Weather Context**: ${weatherContext}${runContext}

${batchCookingInstructions}

**CRITICAL SNACK REQUIREMENTS:**
- ONLY use recipes with meal_type "snack" for pre-run snacks and post-run snacks
- NEVER use breakfast, lunch, or dinner recipes as snacks
- If no snack recipes are available, create simple custom snacks (banana, energy bar, etc.)
- Snack recipes do NOT interfere with main meal batch cooking calculations

**RUN DAY MEAL STRATEGY:**
- Pre-run snacks: Use ONLY snack-classified recipes (≤200 calories) for quick energy
- Lunch on run days: Enhanced with higher protein and recovery nutrition to serve as post-run recovery meal
- NO separate post-run snacks needed - enhanced lunch serves this purpose
- Run day lunches should include "POST-RUN RECOVERY" context emphasizing muscle recovery

**MEAL TYPE SEPARATION:**
- Breakfast recipes: Only for breakfast meals
- Lunch recipes: For lunch (enhanced on run days for recovery)
- Dinner recipes: Only for dinner meals  
- Snack recipes: ONLY for pre/post-run snacks
- This separation ensures batch cooking works properly without interference

**Available Recipe Categories:**
Breakfast Recipes (${breakfastRecipes.length} available):
${breakfastRecipes.slice(0, 5).map(recipe => `ID: ${recipe.id}, Title: ${recipe.title}, Calories: ${recipe.calories}`).join('\n')}

Lunch Recipes (${lunchRecipes.length} available):
${lunchRecipes.slice(0, 5).map(recipe => `ID: ${recipe.id}, Title: ${recipe.title}, Calories: ${recipe.calories}`).join('\n')}

Dinner Recipes (${dinnerRecipes.length} available):
${dinnerRecipes.slice(0, 5).map(recipe => `ID: ${recipe.id}, Title: ${recipe.title}, Calories: ${recipe.calories}`).join('\n')}

Snack Recipes (${snackRecipes.length} available):
${snackRecipes.slice(0, 10).map(recipe => `ID: ${recipe.id}, Title: ${recipe.title}, Calories: ${recipe.calories}`).join('\n')}

**Complete Recipe List:**
${recipes.map(recipe => `
ID: ${recipe.id}
Title: ${recipe.title}
Meal Types: ${recipe.meal_type?.join(', ') || 'unspecified'}
Calories: ${recipe.calories}, Protein: ${recipe.protein}g, Carbs: ${recipe.carbs}g, Fat: ${recipe.fat}g
Seasonal: ${recipe.seasonal_suitability?.join(', ') || 'year-round'}
Temperature: ${recipe.temperature_preference || 'any'}
`).join('\n')}

Return a JSON object with this exact structure:
{
  "message": "Brief summary of the meal plan approach${batchCookingEnabled ? ` and ${isStrictBatchCooking ? 'strict' : 'flexible'} batch cooking strategy applied` : ''}",
  "mealPlan": {
    "days": [
      {
        "date": "YYYY-MM-DD",
        "meals": [
          {
            "meal_type": "breakfast|lunch|dinner|pre_run_snack",
            "recipe_id": "exact_recipe_id_from_list",
            "explanation": "Why this meal fits the day's needs${batchCookingEnabled ? ' and batch cooking notes' : ''}"
          }
        ]
      }
    ]
  }
}

${batchCookingEnabled ? `
**BATCH COOKING RESPONSE FORMAT:**
${isStrictBatchCooking ? 
`- For strict mode: "This recipe appears exactly ${batchCookingRepetitions} times this week - cook once for entire week, portion into ${batchCookingRepetitions} servings for ${batchCookingPeople} people"` :
`- For flexible mode: Include repetition count and portion guidance in explanation`}
- Explain meal prep and storage strategy
- Include reheating instructions when applicable
` : ''}`;

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
    console.log("Raw Content from OpenAI:", content);

    try {
      const parsedContent = JSON.parse(content);
      console.log("Parsed Content:", JSON.stringify(parsedContent, null, 2));
      return parsedContent;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Content that failed to parse:", content);
      throw new Error("Failed to parse OpenAI response as JSON");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
