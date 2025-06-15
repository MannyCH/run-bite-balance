
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import type { UserProfile } from "../../../src/types/profile.ts";
import OpenAI from "https://esm.sh/openai@4.20.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate daily caloric and macronutrient requirements
function calculateDailyRequirements(profile: UserProfile) {
  if (!profile.bmr || !profile.activity_level || !profile.fitness_goal) {
    return null;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const maintenanceCalories = profile.bmr * activityMultipliers[profile.activity_level];
  
  let targetCalories;
  switch (profile.fitness_goal) {
    case 'lose':
      targetCalories = maintenanceCalories - 500; // 500 calorie deficit
      break;
    case 'gain':
      targetCalories = maintenanceCalories + 300; // 300 calorie surplus
      break;
    default:
      targetCalories = maintenanceCalories;
  }

  // Calculate macronutrient targets (in grams)
  const proteinGrams = Math.round((profile.weight || 70) * 1.6); // 1.6g per kg body weight
  const fatGrams = Math.round((targetCalories * 0.25) / 9); // 25% of calories from fat
  const carbGrams = Math.round((targetCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);

  return {
    targetCalories: Math.round(targetCalories),
    maintenanceCalories: Math.round(maintenanceCalories),
    proteinGrams,
    fatGrams,
    carbGrams,
    mealDistribution: {
      breakfast: Math.round(targetCalories * 0.25),
      lunch: Math.round(targetCalories * 0.35),
      dinner: Math.round(targetCalories * 0.30),
      snack: Math.round(targetCalories * 0.10)
    }
  };
}

// Get nutritional theory guidance
function getNutritionalTheoryGuidance(theory: string | null) {
  const guidance = {
    tim_spector: {
      focus: "Prioritize gut microbiome diversity with 30+ different plants per week",
      guidelines: [
        "Include fermented foods (yogurt, kefir, sauerkraut, kimchi)",
        "Emphasize fiber-rich foods and diverse vegetables",
        "Include nuts, seeds, and legumes for microbiome health",
        "Limit ultra-processed foods",
        "Focus on polyphenol-rich foods (berries, dark leafy greens, herbs, spices)"
      ]
    },
    mediterranean: {
      focus: "Mediterranean diet emphasizing whole foods, healthy fats, and moderate portions",
      guidelines: [
        "Use olive oil as primary fat source",
        "Include fish and seafood regularly",
        "Emphasize vegetables, fruits, whole grains, and legumes",
        "Include moderate amounts of dairy (especially yogurt and cheese)",
        "Limit red meat and processed foods"
      ]
    },
    keto: {
      focus: "Very low carbohydrate, high fat diet for ketosis",
      guidelines: [
        "Keep carbs under 20-25g net carbs per day",
        "High fat content (70-80% of calories)",
        "Moderate protein (20-25% of calories)",
        "Focus on meat, fish, eggs, low-carb vegetables, nuts, and healthy fats",
        "Avoid grains, sugar, most fruits, and starchy vegetables"
      ]
    },
    paleo: {
      focus: "Whole foods diet based on presumed ancient human diet",
      guidelines: [
        "Focus on meat, fish, eggs, vegetables, fruits, nuts, and seeds",
        "Avoid grains, legumes, dairy, and processed foods",
        "Emphasize grass-fed and organic when possible",
        "Include healthy fats from avocados, nuts, and olive oil"
      ]
    },
    balanced: {
      focus: "Traditional balanced approach with all major food groups",
      guidelines: [
        "Include all major food groups in moderation",
        "Balance proteins, carbohydrates, and fats",
        "Focus on whole, minimally processed foods",
        "Include variety to ensure nutrient adequacy"
      ]
    }
  };

  return guidance[theory as keyof typeof guidance] || guidance.balanced;
}

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
    
    // Calculate daily requirements
    const requirements = calculateDailyRequirements(profile);
    if (!requirements) {
      throw new Error("Unable to calculate daily requirements - missing profile data");
    }

    // Get nutritional theory guidance
    const nutritionalGuidance = getNutritionalTheoryGuidance(profile.nutritional_theory);
    
    // Create a summarized version of the recipes to send to OpenAI
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
    
    // Format dietary preferences and restrictions
    const dietaryInfo = {
      fitness_goal: profile.fitness_goal || "maintain",
      nutritional_theory: profile.nutritional_theory || "balanced",
      allergies: profile.food_allergies || [],
      preferred_cuisines: profile.preferred_cuisines || [],
      foods_to_avoid: profile.foods_to_avoid || [],
      dietary_preferences: profile.dietary_preferences || [],
    };
    
    // Calculate dates for the meal plan
    const today = new Date(startDate);
    const endDateObj = new Date(endDate);
    const dayCount = Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24)) + 1;
    
    console.log(`Creating meal plan for ${dayCount} days`);
    console.log(`User preferences: ${JSON.stringify(dietaryInfo)}`);
    console.log(`Daily requirements: ${JSON.stringify(requirements)}`);
    
    // Prepare the enhanced prompt for OpenAI
    const prompt = {
      role: "system",
      content: `You are a professional nutritionist creating a personalized meal plan for ${dayCount} days.

USER PROFILE & GOALS:
- Fitness Goal: ${profile.fitness_goal} weight
- Current Weight: ${profile.weight || 'unknown'}kg
- BMR: ${profile.bmr || 'unknown'} calories
- Activity Level: ${profile.activity_level || 'moderate'}

DAILY CALORIC & MACRO TARGETS:
- Target Daily Calories: ${requirements.targetCalories} calories
- Maintenance Calories: ${requirements.maintenanceCalories} calories
- Daily Protein Target: ${requirements.proteinGrams}g
- Daily Carbohydrate Target: ${requirements.carbGrams}g  
- Daily Fat Target: ${requirements.fatGrams}g

MEAL CALORIC DISTRIBUTION:
- Breakfast: ~${requirements.mealDistribution.breakfast} calories (25%)
- Lunch: ~${requirements.mealDistribution.lunch} calories (35%)
- Dinner: ~${requirements.mealDistribution.dinner} calories (30%)
- Snack: ~${requirements.mealDistribution.snack} calories (10%)

NUTRITIONAL APPROACH: ${nutritionalGuidance.focus}
Key Guidelines:
${nutritionalGuidance.guidelines.map(g => `- ${g}`).join('\n')}

DIETARY RESTRICTIONS & PREFERENCES:
- Food Allergies: ${dietaryInfo.allergies.join(', ') || 'None'}
- Foods to Avoid: ${dietaryInfo.foods_to_avoid.join(', ') || 'None'}
- Dietary Preferences: ${dietaryInfo.dietary_preferences.join(', ') || 'None'}
- Preferred Cuisines: ${dietaryInfo.preferred_cuisines.join(', ') || 'Any'}

Your task is to create a meal plan that:
1. Meets the specific caloric targets for each meal
2. Follows the user's nutritional approach (${profile.nutritional_theory || 'balanced'})
3. Respects all dietary restrictions and preferences
4. Provides appropriate portion guidance to meet caloric goals
5. Ensures variety and nutritional balance across the week

IMPORTANT MEAL SELECTION RULES:
- Breakfast: Light, energizing foods appropriate for morning (eggs, yogurt, oats, fruits)
- Lunch: Moderate, balanced meals (salads, soups, sandwiches, grain bowls)
- Dinner: More substantial, satisfying meals (proteins with vegetables and grains)
- Snacks: Only include if needed to meet daily caloric targets

PORTION GUIDANCE:
- Adjust recipe serving sizes to meet meal caloric targets
- If a recipe is too high/low in calories, suggest appropriate portion adjustments
- Consider the user's fitness goal when recommending portions

IMPORTANT: Each meal_type MUST be one of these exact values: "breakfast", "lunch", "dinner", or "snack". Do not use any other values.

The response should be a JSON object following this exact structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "meal_type": "breakfast", // MUST be "breakfast", "lunch", "dinner", or "snack"
          "recipe_id": "the-recipe-id", 
          "explanation": "Why this recipe fits the nutritional approach, caloric target, and user goals. Include portion guidance if needed."
        }
      ]
    }
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
