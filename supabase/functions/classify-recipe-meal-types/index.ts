
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import OpenAI from "https://esm.sh/openai@4.20.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY_PERSONAL');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const BATCH_SIZE = 10;

    // Load recipes that don't have meal_type defined
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, ingredients, categories')
      .is('meal_type', null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }

    if (!recipes || recipes.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No untagged recipes found',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Classifying ${recipes.length} recipes...`);

    // Create prompt for OpenAI
    const prompt = `You are a culinary AI expert. Classify each recipe as one or more meal types from: breakfast, lunch, dinner, snack.

Consider:
- Breakfast: Light meals, cereals, eggs, pastries, smoothies, coffee items
- Lunch: Sandwiches, salads, soups, light mains, wraps
- Dinner: Main courses, hearty meals, complex dishes, multi-course items
- Snack: Small portions, finger foods, appetizers, desserts, quick bites

Return ONLY valid JSON array like this:
[
  { "id": "recipe-id-1", "meal_type": ["breakfast"] },
  { "id": "recipe-id-2", "meal_type": ["lunch", "dinner"] }
]

Recipes to classify:
${recipes.map(r => `ID: ${r.id}
Title: ${r.title}
Ingredients: ${(r.ingredients || []).slice(0, 10).join(', ')}
Categories: ${(r.categories || []).join(', ')}`).join('\n---\n')}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an expert meal classification system. Always return valid JSON arrays with meal type classifications." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    let parsed;
    try {
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      // Try to parse as object first, then extract array
      const result = JSON.parse(content);
      if (Array.isArray(result)) {
        parsed = result;
      } else if (result.recipes && Array.isArray(result.recipes)) {
        parsed = result.recipes;
      } else if (result.classifications && Array.isArray(result.classifications)) {
        parsed = result.classifications;
      } else {
        // If it's an object with recipe IDs as keys, convert to array
        parsed = Object.entries(result).map(([id, meal_type]) => ({ id, meal_type }));
      }
    } catch (err) {
      console.error('Failed to parse OpenAI response:', response.choices[0].message.content);
      throw new Error(`JSON parsing failed: ${err.message}`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Expected array of classifications');
    }

    // Update recipes in Supabase
    let updated = 0;
    const errors = [];

    for (const classification of parsed) {
      if (!classification.id || !classification.meal_type || !Array.isArray(classification.meal_type)) {
        console.warn('Invalid classification format:', classification);
        continue;
      }

      const { error: updateError } = await supabase
        .from('recipes')
        .update({ meal_type: classification.meal_type })
        .eq('id', classification.id);

      if (updateError) {
        console.error(`Failed to update recipe ${classification.id}:`, updateError);
        errors.push({ id: classification.id, error: updateError.message });
      } else {
        console.log(`Updated recipe ${classification.id} with meal types: ${classification.meal_type.join(', ')}`);
        updated++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully classified ${updated} recipes`,
        processed: updated,
        total_found: recipes.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in classify-recipe-meal-types function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
