import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

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
    const { items } = await req.json();

    const prompt = `
You are a helpful assistant. Clean and consolidate the following shopping list:

${JSON.stringify(items, null, 2)}

Instructions:
1. Remove words like "chopped", "organic", "sliced", "diced", etc.
2. Combine variations of the same item (e.g. "olivenöl", "olive oil", "extra virgin olive oil" → "Olive oil")
3. Normalize units and remove "EL", "TL", "TSP"
4. Group items like salt, pepper, oil
5. Summarize quantities across items
6. Output only a valid JSON array with this structure:

[
  {
    "id": "string", // keep original ID
    "name": "Broccoli",
    "quantity": "500g",
    "isBought": false
  },
  ...
]

IMPORTANT: Return only the valid JSON array. Do NOT include explanations, markdown, or text around it.
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
              "You are a helpful shopping list organizer. Return only clean JSON output.",
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

    let processedItems;
    const content = data.choices[0].message.content;

    try {
      // Try direct JSON parse
      processedItems = JSON.parse(content);
    } catch {
      // Fallback to extracting array from wrapped text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        processedItems = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from OpenAI response");
      }
    }

    return new Response(JSON.stringify({ items: processedItems }), {
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
