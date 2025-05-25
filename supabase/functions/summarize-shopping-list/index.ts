
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
    const { ingredients } = await req.json();

    const prompt = `
Here is a list of ingredients extracted from a weekly meal plan:

${ingredients.map((ing: string) => `• ${ing}`).join('\n')}

Please:
1. Combine duplicate ingredients by summing their amounts
2. Sum partial quantities (e.g., 1/4 + 1 = 1.25)
3. Ignore quantities for basic items like olive oil, salt, and pepper
4. Mark optional ingredients with "(optional)"
5. Normalize ingredient names (e.g., "Zwiebel" and "onion" count as the same)
6. Categorize all ingredients into:
   • Fruits
   • Vegetables
   • Dairy Products
   • Grains & Legumes
   • Meat & Fish
   • Canned & Dry Goods
   • Spices & Condiments
   • Other

Output the final shopping list grouped by category in this JSON format:

{
  "categories": {
    "Fruits": [
      {"id": "unique-id", "name": "Apple", "quantity": "3", "isBought": false}
    ],
    "Vegetables": [
      {"id": "unique-id", "name": "Broccoli", "quantity": "500g", "isBought": false}
    ],
    "Dairy Products": [...],
    "Grains & Legumes": [...],
    "Meat & Fish": [...],
    "Canned & Dry Goods": [...],
    "Spices & Condiments": [...],
    "Other": [...]
  }
}

IMPORTANT: Return only the valid JSON object. Do NOT include explanations, markdown, or text around it.
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
            content:
              "You are a helpful shopping list organizer. Return only clean JSON output with categorized ingredients.",
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
      throw new Error("Failed to process shopping list with OpenAI");
    }

    let processedData;
    const content = data.choices[0].message.content;

    try {
      // Try direct JSON parse
      processedData = JSON.parse(content);
    } catch {
      // Fallback to extracting JSON from wrapped text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        processedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from OpenAI response");
      }
    }

    return new Response(JSON.stringify(processedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in summarize-shopping-list function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
