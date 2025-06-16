
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  categories: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SeasonalClassification {
  seasonal_suitability: string[];
  temperature_preference: string;
  dish_type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting recipe seasonal classification process');

    // Get the authorization header for Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize OpenAI
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY_PERSONAL");
    if (!openaiApiKey) {
      console.error("OpenAI API key not found");
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Fetch all recipes
    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, title, ingredients, categories, calories, protein, carbs, fat');

    if (fetchError) {
      console.error('Error fetching recipes:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch recipes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!recipes || recipes.length === 0) {
      return new Response(JSON.stringify({ error: 'No recipes found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${recipes.length} recipes to classify`);

    // Process recipes in batches to avoid overwhelming OpenAI
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(recipes.length/batchSize)}`);
      
      const batchPromises = batch.map(recipe => classifyRecipe(openai, recipe));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < recipes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update recipes in database
    console.log('Updating recipes in database...');
    const updatePromises = results.map(async (result) => {
      if (result.error) {
        console.error(`Skipping update for recipe ${result.recipeId}: ${result.error}`);
        return { success: false, recipeId: result.recipeId, error: result.error };
      }

      const { error: updateError } = await supabase
        .from('recipes')
        .update({
          seasonal_suitability: result.classification.seasonal_suitability,
          temperature_preference: result.classification.temperature_preference,
          dish_type: result.classification.dish_type
        })
        .eq('id', result.recipeId);

      if (updateError) {
        console.error(`Error updating recipe ${result.recipeId}:`, updateError);
        return { success: false, recipeId: result.recipeId, error: updateError.message };
      }

      return { success: true, recipeId: result.recipeId };
    });

    const updateResults = await Promise.all(updatePromises);
    const successCount = updateResults.filter(r => r.success).length;
    const errorCount = updateResults.filter(r => !r.success).length;

    console.log(`Classification complete: ${successCount} successful, ${errorCount} errors`);

    return new Response(JSON.stringify({
      message: 'Recipe seasonal classification completed',
      totalRecipes: recipes.length,
      successful: successCount,
      errors: errorCount,
      details: updateResults.filter(r => !r.success)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in classify-recipes-seasonally function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function classifyRecipe(openai: OpenAI, recipe: Recipe): Promise<{
  recipeId: string;
  classification?: SeasonalClassification;
  error?: string;
}> {
  try {
    console.log(`Classifying recipe: ${recipe.title}`);

    const prompt = `Analyze this recipe for seasonal suitability in Switzerland/Central Europe context:

Recipe: "${recipe.title}"
Ingredients: ${recipe.ingredients?.join(', ') || 'No ingredients listed'}
Categories: ${recipe.categories?.join(', ') || 'No categories'}
Nutrition: ${recipe.calories} cal, ${recipe.protein}g protein, ${recipe.carbs}g carbs, ${recipe.fat}g fat

Please classify this recipe considering:

1. SEASONAL SUITABILITY (choose 1-4 seasons that fit best):
   - spring: Light, fresh ingredients, transitioning from winter
   - summer: Cold/light dishes, fresh produce, grilling, minimal cooking
   - autumn: Hearty but not heavy, harvest ingredients, warming dishes
   - winter: Heavy, warming, comforting, slow-cooked dishes
   - year_round: Basic dishes suitable any time

2. TEMPERATURE PREFERENCE:
   - hot_weather: Light, cold, refreshing dishes for hot days (>25°C)
   - cold_weather: Warming, hearty dishes for cold days (<10°C)
   - mild_weather: Suitable for moderate temperatures (10-25°C)
   - any: Works in any temperature

3. DISH TYPE (thermal effect):
   - warming: Generates warmth (hot soups, stews, spiced dishes)
   - cooling: Has cooling effect (cold dishes, fresh fruits, light salads)
   - neutral: No particular thermal effect

Consider Swiss eating patterns and ingredient seasonality. Be strict - don't default everything to "year_round".

Respond ONLY with valid JSON in this exact format:
{
  "seasonal_suitability": ["season1", "season2"],
  "temperature_preference": "preference",
  "dish_type": "type"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a culinary expert specializing in seasonal cooking and Swiss/European cuisine. Analyze recipes and classify them strictly by seasonal appropriateness. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    const aiResponse = response.choices[0].message.content;
    if (!aiResponse) {
      throw new Error('Empty response from OpenAI');
    }

    const classification = JSON.parse(aiResponse) as SeasonalClassification;
    
    // Validate the response
    const validSeasons = ['spring', 'summer', 'autumn', 'winter', 'year_round'];
    const validTempPrefs = ['hot_weather', 'cold_weather', 'mild_weather', 'any'];
    const validDishTypes = ['warming', 'cooling', 'neutral'];

    if (!Array.isArray(classification.seasonal_suitability) || 
        !classification.seasonal_suitability.every(s => validSeasons.includes(s))) {
      throw new Error('Invalid seasonal_suitability in response');
    }

    if (!validTempPrefs.includes(classification.temperature_preference)) {
      throw new Error('Invalid temperature_preference in response');
    }

    if (!validDishTypes.includes(classification.dish_type)) {
      throw new Error('Invalid dish_type in response');
    }

    console.log(`✓ Classified ${recipe.title}: ${classification.seasonal_suitability.join(', ')}, ${classification.temperature_preference}, ${classification.dish_type}`);

    return {
      recipeId: recipe.id,
      classification
    };

  } catch (error) {
    console.error(`Error classifying recipe ${recipe.title}:`, error);
    return {
      recipeId: recipe.id,
      error: error.message || 'Classification failed'
    };
  }
}
