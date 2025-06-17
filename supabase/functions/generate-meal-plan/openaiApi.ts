
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

// Try to get the correct OpenAI API key - check both possible secret names
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY_PERSONAL");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Enhanced JSON extraction with better error handling
function extractJsonFromResponse(content: string): { json: string; isComplete: boolean } {
  console.log("Extracting JSON from response content...");
  console.log(`Response length: ${content.length} characters`);
  
  // First, try to find JSON wrapped in markdown code blocks
  const markdownJsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownJsonMatch) {
    console.log("Found JSON wrapped in markdown code blocks");
    const extractedJson = markdownJsonMatch[1].trim();
    return { json: extractedJson, isComplete: isJsonComplete(extractedJson) };
  }
  
  // If no markdown wrapping, look for JSON object boundaries
  const jsonStartIndex = content.indexOf('{');
  const jsonEndIndex = content.lastIndexOf('}');
  
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    console.log("Found JSON object boundaries in plain text");
    const extractedJson = content.substring(jsonStartIndex, jsonEndIndex + 1);
    return { json: extractedJson, isComplete: isJsonComplete(extractedJson) };
  }
  
  // If still no JSON found, return original content
  console.log("No JSON structure detected, returning original content");
  return { json: content, isComplete: false };
}

// Check if JSON response appears complete
function isJsonComplete(jsonString: string): boolean {
  try {
    // Count opening and closing braces
    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    
    // Count opening and closing brackets
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;
    
    // Basic completeness check - equal braces and brackets
    const balanced = openBraces === closeBraces && openBrackets === closeBrackets;
    
    if (!balanced) {
      console.log(`JSON appears incomplete: braces ${openBraces}/${closeBraces}, brackets ${openBrackets}/${closeBrackets}`);
      return false;
    }
    
    // Try to parse to verify it's valid JSON
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    console.log("JSON completeness check failed:", e.message);
    return false;
  }
}

// Validate that the parsed response has required structure
function validateMealPlanResponse(parsedResponse: any): { isValid: boolean; error?: string } {
  if (!parsedResponse || typeof parsedResponse !== 'object') {
    return { isValid: false, error: 'Response is not an object' };
  }
  
  if (!parsedResponse.mealPlan || !parsedResponse.mealPlan.days) {
    return { isValid: false, error: 'Missing mealPlan.days structure' };
  }
  
  const days = parsedResponse.mealPlan.days;
  if (!Array.isArray(days)) {
    return { isValid: false, error: 'Days is not an array' };
  }
  
  if (days.length !== 7) {
    return { isValid: false, error: `Expected 7 days, got ${days.length}` };
  }
  
  // Check each day has required structure
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    if (!day.date || !day.meals || !Array.isArray(day.meals)) {
      return { isValid: false, error: `Day ${i + 1} missing date or meals array` };
    }
    
    if (day.meals.length === 0) {
      return { isValid: false, error: `Day ${i + 1} has no meals` };
    }
  }
  
  return { isValid: true };
}

export async function callOpenAIMealPlan(
  profile: UserProfile,
  recipes: RecipeSummary[],
  requirements: any,
  startDate: string,
  endDate: string,
  runContext: string = ''
): Promise<any> {
  console.log(`Calling OpenAI GPT-4o-mini for meal plan from ${startDate} to ${endDate}`);
  console.log(`Using API key source: ${Deno.env.get("OPENAI_API_KEY_PERSONAL") ? "PERSONAL" : "STANDARD"}`);

  if (!OPENAI_API_KEY) {
    console.error('No OpenAI API key found in either OPENAI_API_KEY_PERSONAL or OPENAI_API_KEY');
    throw new Error('OpenAI API key not configured');
  }

  // Get weather context for Bern, Switzerland
  let weatherContext = 'Weather data unavailable.';
  try {
    const weatherData = await fetchBernWeather(startDate, endDate);
    if (weatherData) {
      weatherContext = `Weather in Bern: ${weatherData.season} season, avg ${weatherData.averageTemp}°C.`;
    }
  } catch (weatherError) {
    console.error('Error fetching weather data:', weatherError);
  }

  // Batch cooking configuration - simplified
  const batchCookingEnabled = profile.batch_cooking_repetitions && profile.batch_cooking_repetitions > 1;
  const batchCookingRepetitions = profile.batch_cooking_repetitions || 1;
  const isStrictBatchCooking = batchCookingRepetitions >= 5;

  // Calculate maximum repetitions for variety control
  const maxRepetitions = batchCookingEnabled ? batchCookingRepetitions : 3;

  // Build a more concise system prompt
  const systemPrompt = `You are a nutrition expert creating a 7-day meal plan.

USER PROFILE:
- Goal: ${profile.fitness_goal || 'maintain'}, Activity: ${profile.activity_level || 'moderate'}
- Calories: ${requirements.calories}/day, Protein: ${requirements.protein}g, Carbs: ${requirements.carbs}g, Fat: ${requirements.fat}g
- Dietary: ${profile.dietary_preferences?.join(', ') || 'none'} | Avoid: ${profile.food_allergies?.join(', ') || 'none'}
- Cuisines: ${profile.preferred_cuisines?.join(', ') || 'any'}

${weatherContext}${runContext}

${batchCookingEnabled ? `
BATCH COOKING (${batchCookingRepetitions}x repetitions for ${profile.batch_cooking_people || 1} people):
${isStrictBatchCooking ? 
  `- STRICT: Each recipe appears exactly ${batchCookingRepetitions} times` :
  `- FLEXIBLE: Aim for ${batchCookingRepetitions} repetitions, allow 2-4x variation`}
- Prioritize batch cooking for dinner (most complex), then lunch, then breakfast
- Snacks don't need batching (situational based on runs)
` : ''}

IMPORTANT RULE:
- Each recipe can be used at most ${maxRepetitions} times total across the entire week.
- Do not repeat the same recipe more than this.

AVAILABLE RECIPES:
${recipes.slice(0, 30).map(r => `${r.id}: ${r.title} (${r.meal_type?.join('/')}) ${r.calories}cal`).join('\n')}

RULES:
1. Use ONLY recipe IDs from the list above
2. Include pre_run_snack ONLY on run days using snack-type recipes (≤200 cal)
3. Enhanced lunch on run days serves as post-run recovery (higher protein)
4. Return ONLY valid JSON - no markdown, no explanation outside JSON

RESPONSE FORMAT:
{
  "message": "Brief meal plan summary",
  "mealPlan": {
    "days": [
      {
        "date": "YYYY-MM-DD",
        "meals": [
          {
            "meal_type": "breakfast|lunch|dinner|pre_run_snack",
            "recipe_id": "exact_recipe_id_from_list",
            "explanation": "Why this meal fits${batchCookingEnabled ? ' and batch cooking notes' : ''}"
          }
        ]
      }
    ]
  }
}`;

  const data = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096, // Increased from 2048 to allow complete responses
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
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}`);
      console.error('Error response:', errorText);
      throw new Error(`OpenAI API call failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.error) {
      console.error("OpenAI API error:", result.error);
      throw new Error(`OpenAI API returned an error: ${result.error.message}`);
    }

    const content = result.choices[0].message.content;
    console.log(`Raw Content from OpenAI (${content.length} chars):`, content.substring(0, 500) + '...');

    // Check if response was truncated
    const usage = result.usage;
    if (usage && usage.finish_reason === 'length') {
      console.warn("Response was truncated due to token limit");
      throw new Error("OpenAI response was truncated - try reducing prompt size or increasing max_tokens");
    }

    try {
      // Use enhanced JSON extraction
      const { json: extractedJson, isComplete } = extractJsonFromResponse(content);
      
      if (!isComplete) {
        console.warn("JSON appears incomplete or truncated");
        throw new Error("OpenAI response appears incomplete - JSON structure is not properly closed");
      }
      
      console.log("Extracted JSON content:", extractedJson.substring(0, 500) + '...');
      
      const parsedContent = JSON.parse(extractedJson);
      
      // Validate the parsed response structure
      const validation = validateMealPlanResponse(parsedContent);
      if (!validation.isValid) {
        console.error("Response validation failed:", validation.error);
        throw new Error(`OpenAI response validation failed: ${validation.error}`);
      }
      
      console.log("✅ Successfully parsed and validated OpenAI response");
      return parsedContent;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Content that failed to parse:", content);
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
