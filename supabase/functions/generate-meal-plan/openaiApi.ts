// openaiApi.ts – updated callOpenAIMealPlan with per-meal-type recipe filtering
import OpenAI from "https://esm.sh/openai@4.20.0";
import type { RecipeSummary } from "./types.ts";

/**
 * Initialize OpenAI client
 */
export function createOpenAIClient(): OpenAI {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY_PERSONAL");
  if (!openaiApiKey) {
    console.error("OpenAI API key not found in environment variables");
    throw new Error("OpenAI API key not configured");
  }

  return new OpenAI({ apiKey: openaiApiKey });
}

/**
 * Call OpenAI API for meal plan generation using grouped recipes
 */
export async function callOpenAIMealPlan(
  openai: OpenAI,
  systemPrompt: string,
  groupedRecipes: Record<"breakfast" | "lunch" | "dinner" | "snack", RecipeSummary[]>,
  startDate: string,
  endDate: string
) {
  console.log(`Calling OpenAI GPT-4o for meal plan from ${startDate} to ${endDate}`);

  const userMessage = `Create a meal plan from ${startDate} to ${endDate}. Here are the recipes per meal type:

BREAKFAST RECIPES:
${JSON.stringify(groupedRecipes.breakfast)}

LUNCH RECIPES:
${JSON.stringify(groupedRecipes.lunch)}

DINNER RECIPES:
${JSON.stringify(groupedRecipes.dinner)}

SNACK RECIPES:
${JSON.stringify(groupedRecipes.snack)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty content");
    }

    try {
      const parsed = JSON.parse(content);
      console.log("Successfully parsed AI response");
      return {
        message: "Meal plan generated",
        mealPlan: parsed
      };
    } catch (err) {
      console.error("Parsing error:", err);
      console.log("Raw content:", content);
      throw new Error("Could not parse OpenAI meal plan JSON");
    }
  } catch (err: any) {
    console.error("OpenAI API error:", JSON.stringify(err, null, 2));
    if (err.status === 401) throw new Error("Unauthorized – check API key");
    if (err.status === 429) throw new Error("Rate limit exceeded or quota used up");
    throw new Error(err.message || "Unknown OpenAI API error");
  }
}
