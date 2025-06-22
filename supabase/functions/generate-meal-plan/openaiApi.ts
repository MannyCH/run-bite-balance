
import { RecipeSummary } from "./types.ts";
import { buildSystemPrompt } from "./systemPromptBuilder.ts";
import { extractJsonFromResponse, validateMealPlanResponse } from "./responseValidator.ts";

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
  batch_cooking_enabled?: boolean | null;
  batch_cooking_intensity?: 'low' | 'medium' | 'high' | null;
  batch_cooking_people?: number | null;
}

const OPENAI_API_KEY_PERSONAL = Deno.env.get("OPENAI_API_KEY_PERSONAL");
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

  const systemPrompt = await buildSystemPrompt(
    profile,
    recipes,
    requirements,
    startDate,
    endDate,
    runContext
  );

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
    "Authorization": `Bearer ${OPENAI_API_KEY_PERSONAL}`,
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

    const batchCookingEnabled = profile.batch_cooking_enabled || false;
    const batchIntensity = profile.batch_cooking_intensity || 'medium';

    console.log(`✅ AI meal plan generated successfully with ${batchCookingEnabled ? `${batchIntensity} intensity batch cooking approach` : 'variety approach'}`);
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
