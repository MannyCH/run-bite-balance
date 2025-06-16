
// OpenAI API interaction utilities
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
  
  console.log("OpenAI API key found, attempting to use OpenAI API");
  
  return new OpenAI({
    apiKey: openaiApiKey,
  });
}

/**
 * Call OpenAI API for meal plan generation
 */
export async function callOpenAIMealPlan(
  openai: OpenAI,
  systemPrompt: string,
  recipeSummaries: RecipeSummary[],
  startDate: string,
  endDate: string
) {
  console.log(`Making request to OpenAI API with model: gpt-4o`);
  console.log(`Recipes count: ${recipeSummaries.length}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: `Create a meal plan from ${startDate} to ${endDate}. Here are the available recipes: ${JSON.stringify(recipeSummaries)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });
    
    console.log("OpenAI API response received successfully!");
    
    // Parse the AI-generated meal plan
    const aiResponse = response.choices[0].message.content;
    if (!aiResponse) {
      console.error("OpenAI returned empty response");
      throw new Error("Failed to generate meal plan from OpenAI");
    }
    
    try {
      const mealPlanData = JSON.parse(aiResponse);
      console.log("AI meal plan successfully generated and parsed");
      return {
        message: "AI-generated meal plan created successfully",
        mealPlan: mealPlanData
      };
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Raw response:", aiResponse);
      throw new Error("Failed to parse meal plan data");
    }
  } catch (apiError) {
    console.error("OpenAI API error details:", JSON.stringify(apiError, null, 2));
    if (apiError.status === 401) {
      throw new Error("OpenAI API authentication failed. Please check your API key.");
    } else if (apiError.status === 429) {
      throw new Error("OpenAI API rate limit exceeded or insufficient quota.");
    } else {
      throw new Error(`OpenAI API error: ${apiError.message || "Unknown error"}`);
    }
  }
}
