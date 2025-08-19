import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY_PERSONAL') || Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      currentRecipeId, 
      mealType, 
      targetCalories, 
      userId,
      mealPlanId 
    } = await req.json();

    console.log('Request params:', { currentRecipeId, mealType, targetCalories, userId });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile for preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get current recipe details
    const { data: currentRecipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', currentRecipeId)
      .single();

    if (!currentRecipe) {
      throw new Error('Current recipe not found');
    }

    // Get candidate recipes (exclude current recipe and recipes already in this meal plan)
    const { data: existingRecipeIds } = await supabase
      .from('meal_plan_items')
      .select('recipe_id')
      .eq('meal_plan_id', mealPlanId)
      .not('recipe_id', 'is', null);

    const excludeIds = [currentRecipeId, ...(existingRecipeIds?.map(item => item.recipe_id).filter(Boolean) || [])];

    // Build calorie bounds as integers to avoid decimal precision errors
    const minCalories = Math.floor(targetCalories * 0.4);
    const maxCalories = Math.ceil(targetCalories * 1.6);

    let candidateQuery = supabase
      .from('recipes')
      .select('id, title, calories, protein, carbs, fat, ingredients, categories, meal_type, seasonal_suitability, temperature_preference, dish_type, imgurl')
      .gte('calories', minCalories)
      .lte('calories', maxCalories);

    // Only add NOT IN clause if there are IDs to exclude
    if (excludeIds.length > 0) {
      const quotedIds = excludeIds.map(id => `'${id}'`).join(',');
      candidateQuery = candidateQuery.not('id', 'in', `(${quotedIds})`);
    }

    const { data: candidateRecipes, error: recipesError } = await candidateQuery;

    if (recipesError) {
      throw new Error(`Failed to fetch recipes: ${recipesError.message}`);
    }

    if (!candidateRecipes || candidateRecipes.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare context for OpenAI
    const currentSeason = getCurrentSeason();
    const contextPrompt = `
You are a nutrition expert helping select the best recipe replacements for a meal plan.

CURRENT RECIPE TO REPLACE:
- Name: ${currentRecipe.title}
- Calories: ${currentRecipe.calories}
- Meal Type: ${mealType}
- Target Calories: ${targetCalories}

USER PROFILE:
- Dietary Preferences: ${profile?.dietary_preferences?.join(', ') || 'None specified'}
- Food Allergies: ${profile?.food_allergies?.join(', ') || 'None'}
- Preferred Cuisines: ${profile?.preferred_cuisines?.join(', ') || 'None specified'}
- Foods to Avoid: ${profile?.foods_to_avoid?.join(', ') || 'None'}
- Meal Complexity: ${profile?.meal_complexity || 'moderate'}

CONTEXT:
- Current Season: ${currentSeason}
- Meal Type: ${mealType}
- Target Calories: ${targetCalories} (±30% acceptable)

CANDIDATE RECIPES:
${candidateRecipes.slice(0, 30).map((recipe, index) => `
${index + 1}. ${recipe.title}
   - Calories: ${recipe.calories}
   - Protein: ${recipe.protein}g, Carbs: ${recipe.carbs}g, Fat: ${recipe.fat}g
   - Categories: ${recipe.categories?.join(', ') || 'None'}
   - Meal Types: ${recipe.meal_type?.join(', ') || 'None'}
   - Seasonal: ${recipe.seasonal_suitability?.join(', ') || 'None'}
   - Temperature: ${recipe.temperature_preference || 'None'}
   - Ingredients: ${recipe.ingredients?.slice(0, 5).join(', ')}...
`).join('')}

Please rank the top 8 most suitable replacements considering:
1. Meal type appropriateness (${mealType})
2. Calorie similarity to target (${targetCalories})
3. Seasonal appropriateness (${currentSeason})
4. User dietary preferences and restrictions
5. Recipe variety and nutritional balance

Return ONLY a JSON array with this exact format:
[
  {
    "recipeIndex": 1,
    "matchPercentage": 95,
    "reason": "Perfect breakfast match with similar calories and seasonal ingredients"
  }
]

Select exactly 8 recipes, ordered by suitability (best first). Match percentage should be 0-100.
`;

    // Call OpenAI with retry logic
    let openAIData;
    let content;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`OpenAI attempt ${attempt}/3`);
        
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-2025-08-07',
            messages: [
              { role: 'system', content: 'You are a nutrition expert. Return only valid JSON.' },
              { role: 'user', content: contextPrompt }
            ],
            max_completion_tokens: 1000
          }),
        });

        if (!openAIResponse.ok) {
          const errorText = await openAIResponse.text();
          console.error(`OpenAI API error (attempt ${attempt}):`, openAIResponse.status, errorText);
          
          if (attempt === 3) {
            throw new Error(`OpenAI API error after 3 attempts: ${openAIResponse.statusText}`);
          }
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        openAIData = await openAIResponse.json();
        content = openAIData.choices[0].message.content;
        console.log(`OpenAI success on attempt ${attempt}`);
        break;
        
      } catch (error) {
        console.error(`OpenAI attempt ${attempt} failed:`, error);
        
        if (attempt === 3) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    console.log('OpenAI response:', content);

    // Parse AI response
    let aiSuggestions;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      aiSuggestions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to simple scoring
      aiSuggestions = candidateRecipes.slice(0, 8).map((recipe, index) => ({
        recipeIndex: index + 1,
        matchPercentage: Math.max(20, 90 - index * 10),
        reason: "AI parsing failed, using fallback scoring"
      }));
    }

    // Map AI suggestions to full recipe data
    const suggestions = aiSuggestions.map((suggestion: any) => {
      const recipe = candidateRecipes[suggestion.recipeIndex - 1];
      if (!recipe) return null;
      
      return {
        ...recipe,
        matchPercentage: suggestion.matchPercentage,
        reason: suggestion.reason
      };
    }).filter(Boolean);

    console.log(`Returning ${suggestions.length} suggestions`);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in suggest-recipe-replacements:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}