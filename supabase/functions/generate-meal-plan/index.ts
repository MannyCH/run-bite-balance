import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import OpenAI from "https://esm.sh/openai@4.20.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ✅ Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing auth header" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: authHeader, // ✅ ensures Supabase uses the user's session
        },
      },
    }
  );

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { userId, aiRecipeRatio = 30 } = body;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // ✅ Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "User profile not found" }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  const totalMeals = 21;
  const aiCount = Math.max(1, Math.round((aiRecipeRatio / 100) * totalMeals));

  const dietary = {
    fitness_goal: profile.fitness_goal || "maintain",
    allergies: profile.food_allergies || [],
    cuisines: profile.preferred_cuisines || [],
    avoid: profile.foods_to_avoid || [],
    preferences: profile.dietary_preferences || [],
  };

  const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY_PERSONAL")! });

  const systemPrompt = `
You are a nutritionist chef. Create ${aiCount} original recipes based on:
- Preferences: ${JSON.stringify(dietary)}
- Each recipe must have:
  - title
  - ingredients (array of strings with quantity)
  - instructions (array)
  - calories, protein, carbs, fat
  - main_ingredient (no duplicates!)
  - meal_type: "breakfast", "lunch", or "dinner" (must match recipe style)
  - is_ai_generated: true

Return this structure:
{
  "recipes": [
    {
      "title": "...",
      "ingredients": [...],
      "instructions": [...],
      "calories": 400,
      "protein": 20,
      "carbs": 30,
      "fat": 10,
      "main_ingredient": "chicken",
      "meal_type": "lunch",
      "is_ai_generated": true
    }
  ]
}
`;

  const chat = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.9,
    max_tokens: 3000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Please generate the recipes now." },
    ],
  });

  const raw = chat.choices[0]?.message?.content;
  if (!raw) {
    return new Response(JSON.stringify({ error: "Empty response from OpenAI" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  let recipes;
  try {
    recipes = JSON.parse(raw).recipes;
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON from OpenAI" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const toSave = recipes.map((r: any) => ({
    title: r.title,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    ingredients: r.ingredients,
    instructions: r.instructions,
    categories: [r.meal_type],
    main_ingredient: r.main_ingredient,
    is_ai_generated: true,
    created_at: new Date().toISOString(),
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("recipes")
    .insert(toSave)
    .select();

  if (insertError) {
    return new Response(JSON.stringify({ error: "Error saving recipes" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ aiRecipes: inserted }), {
    status: 200,
    headers: corsHeaders,
  });
});
