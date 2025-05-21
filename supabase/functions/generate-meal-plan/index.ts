
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import type { UserProfile } from "../../../src/types/profile.ts";
import OpenAI from "https://esm.sh/openai@4.20.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate meal plan using OpenAI
 */
async function generateAIMealPlan(
  userId: string,
  profile: UserProfile,
  recipes: any[],
  startDate: string,
  endDate: string
) {
  try {
    console.log(`Generating AI meal plan for user ${userId} from ${startDate} to ${endDate}`);
    
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY_PERSONAL");
    if (!openaiApiKey) {
      console.error("OpenAI API key not found in environment variables");
      throw new Error("OpenAI API key not configured");
    }
    
    console.log("OpenAI API key found, attempting to use OpenAI API");

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    
    // Create a summarized version of the recipes to send to OpenAI
    // This keeps the token count down while providing enough information
    const recipeSummaries = recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      ingredients: recipe.ingredients || [],
      categories: recipe.categories || [],
    }));
    
    // Format the user's dietary preferences and restrictions
    const dietaryPreferences = {
      fitness_goal: profile.fitness_goal || "maintain",
      allergies: profile.food_allergies || [],
      preferred_cuisines: profile.preferred_cuisines || [],
      foods_to_avoid: profile.foods_to_avoid || [],
    };
    
    // Calculate dates for the meal plan
    const today = new Date(startDate);
    const endDateObj = new Date(endDate);
    const dayCount = Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24)) + 1;
    
    console.log(`Creating meal plan for ${dayCount} days`);
    console.log(`User preferences: ${JSON.stringify(dietaryPreferences)}`);
    
    // Prepare the prompt for OpenAI
    const prompt = {
      role: "system",
      content: `You are a professional nutritionist creating a meal plan for ${dayCount} days. 
      The user has the following dietary preferences: ${JSON.stringify(dietaryPreferences)}.
      
      Your task is to create a meal plan with breakfast, lunch, dinner, and potentially snacks for each day.
      For each meal, select the most appropriate recipe from the provided list.
      
      Guidelines:
      1. Breakfast should be light, morning-appropriate foods (cereal, eggs, toast, fruit, yogurt, etc.)
      2. Lunch should be moderate meals (sandwiches, salads, soups, etc.)
      3. Dinner should be more substantial meals (proteins with sides, pasta dishes, etc.)
      4. Add a snack if the total daily calories are below the user's requirements
      5. Ensure variety across the week
      6. Avoid any foods the user is allergic to or wants to avoid
      7. Prefer the user's preferred cuisines when possible
      8. For each meal, explain why it fits that time of day and the user's goals
      
      IMPORTANT: Each meal_type MUST be one of these exact values: "breakfast", "lunch", "dinner", or "snack". Do not use any other values.
      
      The response should be a JSON object following this exact structure:
      {
        "days": [
          {
            "date": "YYYY-MM-DD",
            "meals": [
              {
                "meal_type": "breakfast", // MUST be "breakfast", "lunch", "dinner", or "snack" - no other values
                "recipe_id": "the-recipe-id", 
                "explanation": "Why this recipe is appropriate for this meal"
              },
              // more meals for this day
            ]
          },
          // more days
        ]
      }
      
      Only include recipes from the provided list. Ensure every meal has a valid recipe_id from the list.`
    };

    console.log(`Making request to OpenAI API with model: gpt-4o`);
    console.log(`Recipes count: ${recipeSummaries.length}`);
    
    // Make the request to OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [
          prompt,
          {
            role: "user", 
            content: `Create a meal plan from ${startDate} to ${endDate}. Here are the available recipes: ${JSON.stringify(recipeSummaries)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
  } catch (error) {
    console.error("Error generating AI meal plan:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    // Get the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { userId, startDate, endDate } = requestBody;
    
    if (!userId || !startDate || !endDate) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: userId, startDate, endDate' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log(`Processing meal plan request for user ${userId} from ${startDate} to ${endDate}`);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch user profile',
        details: profileError.message
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!profile) {
      return new Response(JSON.stringify({ 
        error: 'User profile not found'
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Get available recipes
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*');
    
    if (recipesError) {
      console.error('Error fetching recipes:', recipesError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch recipes',
        details: recipesError.message
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!recipes || recipes.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No recipes found in the database'
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log(`Fetched ${recipes.length} recipes for meal planning`);
    
    // Generate AI meal plan
    try {
      const result = await generateAIMealPlan(
        userId, 
        profile as unknown as UserProfile, 
        recipes || [],
        startDate,
        endDate
      );
      
      console.log("Meal plan generated successfully");
      
      return new Response(JSON.stringify(result), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } catch (aiError) {
      console.error("AI meal plan generation failed:", aiError);
      console.log("Falling back to algorithmic meal planning...");
      
      // Return a specific error that the frontend can handle
      return new Response(JSON.stringify({ 
        error: aiError.message || 'Error generating AI meal plan',
        fallback: true 
      }), { 
        status: 200, // Important: Return 200 even for fallback so frontend can handle it
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  } catch (error) {
    console.error('Error in generate-meal-plan function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
