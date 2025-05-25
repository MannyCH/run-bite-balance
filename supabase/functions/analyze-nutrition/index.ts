
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY_PERSONAL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ error: "OpenAI API key not found" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { ingredients, servings } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid ingredients provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const prompt = `
Analyze the following recipe ingredients and estimate the nutritional values per serving:

Ingredients:
${ingredients.map((ing: string) => `• ${ing}`).join('\n')}

Servings: ${servings || 1}

Please provide accurate nutritional estimates based on standard ingredient values. Consider typical portion sizes and cooking methods.

Return the response in this exact JSON format:
{
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>
}

Base your estimates on:
- Standard USDA nutritional data
- Typical cooking methods (assume minimal added oils unless specified)
- The specified number of servings
- Round to whole numbers

IMPORTANT: Return only the JSON object, no explanations or markdown.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional nutritionist. Provide accurate nutritional estimates based on ingredient lists. Return only clean JSON output.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    console.log("🔍 Raw OpenAI response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      throw new Error("Failed to analyze nutrition with OpenAI");
    }

    let nutritionData;
    const content = data.choices[0].message.content;

    try {
      // Try direct JSON parse
      nutritionData = JSON.parse(content);
    } catch {
      // Fallback to extracting JSON from wrapped text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from OpenAI response");
      }
    }

    // Validate the response structure
    if (!nutritionData.calories || !nutritionData.protein || !nutritionData.carbs || !nutritionData.fat) {
      throw new Error("Invalid nutrition data structure from OpenAI");
    }

    return new Response(JSON.stringify(nutritionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-nutrition function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
