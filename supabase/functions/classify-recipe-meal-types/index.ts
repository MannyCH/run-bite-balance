
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import OpenAI from "https://esm.sh/openai@4.20.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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
          processed: 0,
          total_found: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Classifying ${recipes.length} recipes...`);

    // Create prompt for OpenAI - request JSON array directly
    const prompt = `You are a culinary AI expert. Classify each recipe as one or more meal types from: breakfast, lunch, dinner, snack.

Consider:
- Breakfast: Light meals, cereals, eggs, pastries, smoothies, coffee items
- Lunch: Sandwiches, salads, soups, light mains, wraps
- Dinner: Main courses, hearty meals, complex dishes, multi-course items
- Snack: Small portions, finger foods, appetizers, desserts, quick bites

Return ONLY a valid JSON array with this exact format:
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
          content: "You are an expert meal classification system. Always return valid JSON arrays with meal type classifications. Return ONLY the JSON array, no markdown formatting, no explanations." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      max_tokens: 2000
    });

    let parsed;
    try {
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      console.log('Raw OpenAI response:', content);
      
      // Clean the response more aggressively
      let cleanedContent = content.trim();
      
      // Remove markdown code blocks
      cleanedContent = cleanedContent.replace(/```json\s*/g, '');
      cleanedContent = cleanedContent.replace(/```\s*/g, '');
      
      // Remove any extra text before or after the JSON array
      const arrayStart = cleanedContent.indexOf('[');
      const arrayEnd = cleanedContent.lastIndexOf(']');
      
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        cleanedContent = cleanedContent.substring(arrayStart, arrayEnd + 1);
      }
      
      console.log('Cleaned response:', cleanedContent);
      
      // Parse the JSON directly as an array
      parsed = JSON.parse(cleanedContent);
      
      if (!Array.isArray(parsed)) {
        console.error('OpenAI returned non-array:', typeof parsed, parsed);
        throw new Error('Expected array from OpenAI, got: ' + typeof parsed);
      }
      
      console.log('Parsed classifications:', parsed.length, 'items');
    } catch (err) {
      console.error('Failed to parse OpenAI response:', response.choices[0].message.content);
      console.error('Parse error:', err.message);
      throw new Error(`JSON parsing failed: ${err.message}`);
    }

    // Update recipes in Supabase with validation
    let updated = 0;
    const errors = [];

    for (const classification of parsed) {
      // Validate classification structure
      if (!classification || typeof classification !== 'object') {
        console.warn('Invalid classification object:', classification);
        errors.push({ id: 'unknown', error: 'Invalid classification object structure' });
        continue;
      }

      const { id, meal_type } = classification;

      // Validate ID is present and is a valid UUID
      if (!id || typeof id !== 'string') {
        console.warn('Missing or invalid ID in classification:', classification);
        errors.push({ id: 'unknown', error: 'Missing or invalid ID' });
        continue;
      }

      if (!isValidUUID(id)) {
        console.warn('Invalid UUID format for ID:', id);
        errors.push({ id, error: 'Invalid UUID format' });
        continue;
      }

      // Validate meal_type is present and is an array
      if (!meal_type || !Array.isArray(meal_type)) {
        console.warn('Missing or invalid meal_type for ID:', id, meal_type);
        errors.push({ id, error: 'Missing or invalid meal_type array' });
        continue;
      }

      // Validate that the recipe ID exists in our fetched recipes
      const recipeExists = recipes.some(recipe => recipe.id === id);
      if (!recipeExists) {
        console.warn('Recipe ID not found in batch:', id);
        errors.push({ id, error: 'Recipe ID not found in current batch' });
        continue;
      }

      try {
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ meal_type })
          .eq('id', id);

        if (updateError) {
          console.error(`Failed to update recipe ${id}:`, updateError);
          errors.push({ id, error: updateError.message });
        } else {
          console.log(`Successfully updated recipe ${id} with meal types: ${meal_type.join(', ')}`);
          updated++;
        }
      } catch (dbError) {
        console.error(`Database error for recipe ${id}:`, dbError);
        errors.push({ id, error: `Database error: ${dbError.message}` });
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
