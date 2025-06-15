
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
      lunch: Math.round(targetCalories * 0.40),
      dinner: Math.round(targetCalories * 0.35)
    }
  };
}

// Estimate calories burned during a run
function estimateRunCalories(run: any, userWeight: number = 70): number {
  // Basic calculation: ~0.75 calories per kg per km
  const caloriesPerKmPerKg = 0.75;
  const distance = run.distance || 0;
  return Math.round(distance * userWeight * caloriesPerKmPerKg);
}

// Calculate day-specific requirements including run calories
function calculateDaySpecificRequirements(baseRequirements: any, runs: any[], userWeight: number = 70) {
  if (!runs || runs.length === 0) {
    return baseRequirements;
  }

  // Calculate total calories burned from all runs on this day
  const runCalories = runs.reduce((total, run) => total + estimateRunCalories(run, userWeight), 0);
  
  // Add run calories to base target
  const adjustedCalories = baseRequirements.targetCalories + runCalories;
  
  // Recalculate meal distribution with adjusted calories
  return {
    ...baseRequirements,
    targetCalories: adjustedCalories,
    runCalories,
    mealDistribution: {
      breakfast: Math.round(adjustedCalories * 0.25),
      lunch: Math.round(adjustedCalories * 0.40),
      dinner: Math.round(adjustedCalories * 0.35)
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
  runs: any[],
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
    
    // Calculate base daily requirements
    const baseRequirements = calculateDailyRequirements(profile);
    if (!baseRequirements) {
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
    
    // Calculate dates for the meal plan and group runs by date
    const today = new Date(startDate);
    const endDateObj = new Date(endDate);
    const dayCount = Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24)) + 1;
    
    // Group runs by date
    const runsByDate: Record<string, any[]> = {};
    runs.forEach(run => {
      const runDate = new Date(run.date).toISOString().split('T')[0];
      if (!runsByDate[runDate]) {
        runsByDate[runDate] = [];
      }
      runsByDate[runDate].push(run);
    });
    
    // Calculate day-specific requirements
    const dailyRequirements: Record<string, any> = {};
    for (let day = 0; day < dayCount; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayRuns = runsByDate[dateStr] || [];
      dailyRequirements[dateStr] = calculateDaySpecificRequirements(
        baseRequirements, 
        dayRuns, 
        profile.weight || 70
      );
    }
    
    console.log(`Creating meal plan for ${dayCount} days`);
    console.log(`User preferences: ${JSON.stringify(dietaryInfo)}`);
    console.log(`Base daily requirements: ${JSON.stringify(baseRequirements)}`);
    console.log(`Runs found: ${runs.length}`);
    
    // Create detailed daily breakdown for OpenAI
    const dailyBreakdown = Object.entries(dailyRequirements).map(([date, reqs]) => {
      const dayRuns = runsByDate[date] || [];
      return {
        date,
        targetCalories: reqs.targetCalories,
        runCalories: reqs.runCalories || 0,
        hasRuns: dayRuns.length > 0,
        runs: dayRuns.map(run => ({
          title: run.title,
          distance: run.distance,
          duration: Math.round(run.duration / 60)
        })),
        meals: {
          breakfast: reqs.mealDistribution.breakfast,
          lunch: reqs.mealDistribution.lunch,
          dinner: reqs.mealDistribution.dinner
        }
      };
    });
    
    // Prepare the enhanced prompt for OpenAI
    const prompt = {
      role: "system",
      content: `You are a professional nutritionist creating a personalized meal plan for ${dayCount} days.

USER PROFILE & GOALS:
- Fitness Goal: ${profile.fitness_goal} weight
- Current Weight: ${profile.weight || 'unknown'}kg
- BMR: ${profile.bmr || 'unknown'} calories
- Activity Level: ${profile.activity_level || 'moderate'}

BASE DAILY CALORIC & MACRO TARGETS:
- Base Target Daily Calories: ${baseRequirements.targetCalories} calories
- Maintenance Calories: ${baseRequirements.maintenanceCalories} calories
- Daily Protein Target: ${baseRequirements.proteinGrams}g
- Daily Carbohydrate Target: ${baseRequirements.carbGrams}g  
- Daily Fat Target: ${baseRequirements.fatGrams}g

DAILY ACTIVITY & CALORIE ADJUSTMENTS:
${dailyBreakdown.map(day => `
Date ${day.date}:
- Target Calories: ${day.targetCalories} calories${day.runCalories > 0 ? ` (${baseRequirements.targetCalories} base + ${day.runCalories} run calories)` : ' (base calories)'}
- Breakfast: ~${day.meals.breakfast} calories
- Lunch: ~${day.meals.lunch} calories  
- Dinner: ~${day.meals.dinner} calories
${day.hasRuns ? `- Planned Runs: ${day.runs.map(run => `${run.title} (${run.distance}km, ${run.duration}min)`).join(', ')}` : '- No planned runs'}
`).join('')}

NUTRITIONAL APPROACH: ${nutritionalGuidance.focus}
Key Guidelines:
${nutritionalGuidance.guidelines.map(g => `- ${g}`).join('\n')}

DIETARY RESTRICTIONS & PREFERENCES:
- Food Allergies: ${dietaryInfo.allergies.join(', ') || 'None'}
- Foods to Avoid: ${dietaryInfo.foods_to_avoid.join(', ') || 'None'}
- Dietary Preferences: ${dietaryInfo.dietary_preferences.join(', ') || 'None'}
- Preferred Cuisines: ${dietaryInfo.preferred_cuisines.join(', ') || 'Any'}

Your task is to create a meal plan that:
1. Meets the specific caloric targets for each day and meal
2. Adjusts portions appropriately on high-activity/run days
3. Follows the user's nutritional approach (${profile.nutritional_theory || 'balanced'})
4. Respects all dietary restrictions and preferences
5. Provides appropriate portion guidance to meet caloric goals
6. Ensures variety and nutritional balance across the week

IMPORTANT MEAL SELECTION RULES:
- Focus on THREE main meals only (breakfast, lunch, dinner) - NO SNACKS
- Breakfast: Energizing foods appropriate for morning, higher carbs on run days
- Lunch: Balanced meals, larger portions on high-activity days
- Dinner: Satisfying meals with good protein for recovery on run days

PORTION GUIDANCE:
- Adjust recipe serving sizes to meet meal caloric targets
- On run days, increase portions proportionally across all meals
- Consider timing: if runs are planned, optimize pre/post-run nutrition in regular meals

IMPORTANT: Each meal_type MUST be one of these exact values: "breakfast", "lunch", or "dinner". Do not include snacks.

The response should be a JSON object following this exact structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "meal_type": "breakfast", // MUST be "breakfast", "lunch", or "dinner"
          "recipe_id": "the-recipe-id", 
          "explanation": "Why this recipe fits the nutritional approach, caloric target, and activity level for this day. Include portion guidance if needed."
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
    
    // Get user's planned runs for the date range - using a simple approach since there's no runs table
    // We'll parse the iCal feed data if available
    let runs: any[] = [];
    
    // For now, we'll create a mock implementation that the frontend can populate
    // The frontend should pass run data in the request body when available
    if (requestBody.runs && Array.isArray(requestBody.runs)) {
      runs = requestBody.runs;
      console.log(`Received ${runs.length} planned runs from frontend`);
    }
    
    // Generate AI meal plan
    try {
      const result = await generateAIMealPlan(
        userId, 
        profile as unknown as UserProfile, 
        recipes || [],
        runs,
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
