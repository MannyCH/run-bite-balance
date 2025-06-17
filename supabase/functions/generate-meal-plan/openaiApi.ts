
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
  const lightRecipes = recipes.filter(r => r.calories <= 300);

  const systemPrompt = `You are a professional nutritionist and meal planning expert. Create a detailed 7-day meal plan that considers:

1. **User Profile**: ${profile.fitness_goal || 'maintain'} fitness goal, ${profile.activity_level || 'moderate'} activity level
2. **Nutritional Requirements**: ${requirements.targetCalories} calories/day, ${requirements.proteinGrams}g protein, ${requirements.carbGrams}g carbs, ${requirements.fatGrams}g fat
3. **Dietary Preferences**: ${profile.dietary_preferences?.join(', ') || 'none specified'}
4. **Allergies to Avoid**: ${profile.food_allergies?.join(', ') || 'none'}
5. **Foods to Avoid**: ${profile.foods_to_avoid?.join(', ') || 'none'}
6. **Preferred Cuisines**: ${profile.preferred_cuisines?.join(', ') || 'any'}
7. **Weather Context**: ${weatherContext}${runContext}

**CRITICAL REQUIREMENTS:**
- Use ONLY recipes from the provided list
- Each meal MUST include a valid recipe_id from the available recipes
- Include breakfast, lunch, and dinner for each day
- For run days, add pre-run snacks with meal_type "pre_run_snack" using light breakfast recipes (≤200 calories)
- **IMPORTANT RUN DAY RULES:**
  * Pre-run snacks: Use light breakfast recipes (≤200 calories) for quick energy before runs
  * Lunch on run days: Enhanced with higher protein and recovery-focused nutrition to serve as post-run recovery meal
  * No separate post-run snacks needed - lunch serves this purpose
- Provide nutritional context explaining why each meal fits the day's needs
- For run day lunches, include "POST-RUN RECOVERY" context emphasizing muscle recovery and glycogen replenishment
- Consider seasonal appropriateness and weather conditions
- Ensure variety across the week

**Available Recipe Categories:**
Breakfast Recipes (${breakfastRecipes.length} available): Use for breakfast and pre-run snacks
${breakfastRecipes.slice(0, 10).map(recipe => `ID: ${recipe.id}, Title: ${recipe.title}, Calories: ${recipe.calories}`).join('\n')}

Lunch Recipes (${lunchRecipes.length} available): Use for lunch (enhanced for recovery on run days)
${lunchRecipes.slice(0, 10).map(recipe => `ID: ${recipe.id}, Title: ${recipe.title}, Calories: ${recipe.calories}`).join('\n')}

Dinner Recipes (${dinnerRecipes.length} available): Use for dinner
${dinnerRecipes.slice(0, 10).map(recipe => `ID: ${recipe.id}, Title: ${recipe.title}, Calories: ${recipe.calories}`).join('\n')}

Light Recipes for Pre-run Snacks (≤300 cal, ${lightRecipes.length} available):
${lightRecipes.slice(0, 15).map(recipe => `ID: ${recipe.id}, Title: ${recipe.title}, Calories: ${recipe.calories}, Types: ${recipe.meal_type?.join(', ')}`).join('\n')}

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
  "message": "Brief summary of the meal plan approach",
  "mealPlan": {
    "days": [
      {
        "date": "YYYY-MM-DD",
        "meals": [
          {
            "meal_type": "breakfast|lunch|dinner|pre_run_snack",
            "recipe_id": "exact_recipe_id_from_list",
            "explanation": "Why this meal fits the day's nutritional and activity needs"
          }
        ]
      }
    ]
  }
}`;

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
