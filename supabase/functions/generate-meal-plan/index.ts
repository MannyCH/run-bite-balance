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
 * Generate completely new AI recipes based on user preferences
 */
async function generateAIRecipes(
  profile: UserProfile,
  aiRecipeRatio: number = 30
) {
  try {
    console.log(`Generating AI recipes based on user preferences. AI recipe ratio: ${aiRecipeRatio}%`);
    
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY_PERSONAL");
    if (!openaiApiKey) {
      console.error("OpenAI API key not found in environment variables");
      throw new Error("OpenAI API key not configured");
    }
    
    console.log("OpenAI API key found, attempting to generate new recipes");

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    
    // Determine the number of recipes to generate (1-4 based on the ratio and some randomness)
    // Higher AI recipe ratio means more recipes will be generated
    const numberOfRecipesToGenerate = Math.max(1, Math.min(4, Math.floor(aiRecipeRatio / 25)));
    
    console.log(`Will generate ${numberOfRecipesToGenerate} new AI recipes`);
    
    // Format the user's dietary preferences and restrictions
    const dietaryPreferences = {
      fitness_goal: profile.fitness_goal || "maintain",
      allergies: profile.food_allergies || [],
      preferred_cuisines: profile.preferred_cuisines || [],
      foods_to_avoid: profile.foods_to_avoid || [],
      dietary_preferences: profile.dietary_preferences || [],
    };
    
    console.log(`User preferences: ${JSON.stringify(dietaryPreferences)}`);
    
    // Create the system prompt for recipe generation - UPDATED FOR INGREDIENT VARIETY
    const systemPrompt = `You are a professional nutritionist and chef creating original recipes tailored to a user's preferences. 
    The user has the following dietary preferences: ${JSON.stringify(dietaryPreferences)}.
    
    Create ${numberOfRecipesToGenerate} original recipes that are NOT known popular recipes but your own creations.
    Each recipe must be complete with a title, list of ingredients with quantities, step-by-step instructions, and nutritional information.
    
    IMPORTANT REQUIREMENTS FOR INGREDIENT DIVERSITY:
    1. Each recipe MUST have a completely different main ingredient from the others
    2. Avoid using the same primary proteins, grains, or vegetables across recipes
    3. Examples of main ingredient diversity:
       - If one recipe uses chicken, others should use different proteins like fish, beef, tofu
       - If one recipe features quinoa, others should use different grains like rice, pasta, couscous
       - If one recipe focuses on cauliflower, others should feature different vegetables
    4. Provide a "main_ingredient" field that clearly identifies the primary ingredient of each recipe
    
    Additional Guidelines:
    1. Ensure recipes align with the user's fitness goal: ${profile.fitness_goal || "maintain"}
    2. Avoid any foods the user is allergic to or wants to avoid
    3. Prefer the user's preferred cuisines when possible
    4. Include proper nutritional values (calories, protein, carbs, fat)
    5. Create recipes appropriate for any meal type (breakfast, lunch, dinner, or snack)
    6. Make the recipes interesting and unique, not just variations of common dishes
    
    The response should be a JSON object following this exact structure:
    {
      "recipes": [
        {
          "title": "Recipe Title",
          "meal_type": "breakfast", // MUST be one of: "breakfast", "lunch", "dinner", "snack"
          "main_ingredient": "chicken", // REQUIRED: The primary ingredient that defines this recipe
          "ingredients": ["Ingredient 1 with quantity", "Ingredient 2 with quantity", ...],
          "instructions": ["Step 1", "Step 2", ...],
          "calories": 300, // estimated total calories
          "protein": 20, // grams of protein
          "carbs": 30, // grams of carbohydrates
          "fat": 10, // grams of fat
          "is_ai_generated": true // Always true for these recipes
        },
        // more recipes...
      ]
    }`;

    console.log(`Making request to OpenAI API with model: gpt-4o`);
    
    // Make the request to OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Create ${numberOfRecipesToGenerate} original recipes that would appeal to me based on my preferences. Make them creative and unique with DIFFERENT main ingredients for each recipe!`
          }
        ],
        temperature: 0.9, // Increased temperature for more creativity and variety
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });
      
      console.log("OpenAI API response received successfully!");
      
      // Parse the AI-generated recipes
      const aiResponse = response.choices[0].message.content;
      if (!aiResponse) {
        console.error("OpenAI returned empty response");
        throw new Error("Failed to generate recipes from OpenAI");
      }
      
      try {
        const recipesData = JSON.parse(aiResponse);
        console.log(`AI generated ${recipesData.recipes?.length || 0} recipes successfully`);
        return recipesData.recipes || [];
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        console.log("Raw response:", aiResponse);
        throw new Error("Failed to parse recipe data");
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
    console.error("Error generating AI recipes:", error);
    throw error;
  }
}

/**
 * Generate meal plan using OpenAI
 */
async function generateAIMealPlan(
  userId: string,
  profile: UserProfile,
  recipes: any[],
  aiGeneratedRecipes: any[],
  startDate: string,
  endDate: string,
  aiRecipeRatio: number = 30
) {
  try {
    console.log(`Generating AI meal plan for user ${userId} from ${startDate} to ${endDate}`);
    console.log(`User AI recipe ratio preference: ${aiRecipeRatio}%`);
    
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
    // Include both database recipes and AI-generated recipes
    const allRecipes = [
      ...recipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        ingredients: recipe.ingredients || [],
        categories: recipe.categories || [],
        is_ai_generated: false,
        main_ingredient: recipe.main_ingredient || extractMainIngredient(recipe)
      })),
      ...aiGeneratedRecipes.map((recipe, index) => ({
        id: `ai-${index}`, // Temporary ID for AI recipes
        title: recipe.title,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        ingredients: recipe.ingredients || [],
        meal_type: recipe.meal_type || "dinner",
        is_ai_generated: true,
        main_ingredient: recipe.main_ingredient || extractMainIngredient(recipe)
      }))
    ];
    
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
    
    // Calculate how many meals should be AI-generated based on the ratio
    const totalMealsPerDay = 3; // Breakfast, lunch, dinner (excluding snacks for simplicity)
    const totalMeals = totalMealsPerDay * dayCount;
    const aiMealCount = Math.round((aiRecipeRatio / 100) * totalMeals);
    
    console.log(`Based on ${aiRecipeRatio}% preference, ${aiMealCount} out of ${totalMeals} meals should be AI-generated`);
    
    // Prepare the prompt for OpenAI - UPDATED FOR INGREDIENT VARIETY
    const prompt = {
      role: "system",
      content: `You are a professional nutritionist creating a meal plan for ${dayCount} days. 
      The user has the following dietary preferences: ${JSON.stringify(dietaryPreferences)}.
      
      Your task is to create a meal plan with breakfast, lunch, dinner, and potentially snacks for each day.
      For each meal, select the most appropriate recipe from the provided list.
      
      The user has specified that they want ${aiRecipeRatio}% of their meals to be AI-generated recipes.
      This means approximately ${aiMealCount} out of ${totalMeals} meals should be AI-generated.
      
      You have ${aiGeneratedRecipes.length} AI-generated recipes available (marked with is_ai_generated: true).
      Use these recipes to fulfill the ${aiRecipeRatio}% preference for AI-generated meals.
      
      CRITICAL INGREDIENT VARIETY REQUIREMENTS:
      1. NEVER repeat the same main ingredient more than once per day
      2. AVOID repeating main ingredients across the entire week when possible
      3. Track and record what main ingredients have been used on previous days
      4. Create maximum variety by distributing similar ingredients across different days
      5. Each recipe's main_ingredient field indicates its primary ingredient - use this to avoid repetition
      6. If you must reuse an ingredient, ensure it's separated by at least 3 days
      
      Additional Guidelines:
      1. Breakfast should be light, morning-appropriate foods
      2. Lunch should be moderate meals
      3. Dinner should be more substantial meals
      4. Add a snack if the total daily calories are below the user's requirements
      5. Ensure variety across the week
      6. Avoid any foods the user is allergic to or wants to avoid
      7. Prefer the user's preferred cuisines when possible
      8. For each meal, explain why it fits that time of day and the user's goals
      9. Distribute the AI-generated recipes (${aiMealCount} meals) evenly throughout the week
      
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
                "explanation": "Why this recipe is appropriate for this meal",
                "is_ai_generated": true // Include this field for AI-generated meals
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
    console.log(`Recipes count: ${allRecipes.length} (including ${aiGeneratedRecipes.length} AI-generated)`);
    
    // Make the request to OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [
          prompt,
          {
            role: "user", 
            content: `Create a meal plan from ${startDate} to ${endDate} with maximum ingredient variety. Here are the available recipes: ${JSON.stringify(allRecipes)}`
          }
        ],
        temperature: 0.8, // Increased temperature for more variety
        max_tokens: 2500,
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
          mealPlan: mealPlanData,
          aiGeneratedRecipes: aiGeneratedRecipes
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

/**
 * Extract the main ingredient from a recipe based on ingredients list
 * This is a fallback for recipes that don't have a main_ingredient field
 */
function extractMainIngredient(recipe: any): string {
  if (recipe.main_ingredient) {
    return recipe.main_ingredient;
  }
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return "unknown";
  }
  
  // Common protein sources that are often main ingredients
  const proteinKeywords = ["chicken", "beef", "pork", "turkey", "fish", "salmon", "tuna", "tofu", "tempeh", "eggs"];
  
  // Common grains that are often main ingredients
  const grainKeywords = ["rice", "pasta", "quinoa", "bread", "tortilla", "noodle", "couscous", "farro"];
  
  // Common vegetables that might be main ingredients
  const vegKeywords = ["cauliflower", "broccoli", "potato", "sweet potato", "squash", "eggplant", "zucchini"];
  
  // Common legumes
  const legumeKeywords = ["beans", "lentils", "chickpeas"];
  
  // All potential main ingredient keywords
  const allKeywords = [...proteinKeywords, ...grainKeywords, ...vegKeywords, ...legumeKeywords];
  
  // Look for potential main ingredients in the first few ingredients (which are usually the main ones)
  const firstFewIngredients = recipe.ingredients.slice(0, 3).join(" ").toLowerCase();
  
  for (const keyword of allKeywords) {
    if (firstFewIngredients.includes(keyword)) {
      return keyword;
    }
  }
  
  // If we couldn't find a match in common ingredients, just return the first ingredient
  const firstIngredient = recipe.ingredients[0].toLowerCase();
  // Extract the main part by removing quantities and prep instructions
  const mainPart = firstIngredient.split(" ").slice(1).join(" ").split(",")[0];
  return mainPart || "unknown";
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
    
    const { userId, startDate, endDate, aiRecipeRatio = 30, forceNewRecipes = false } = requestBody;
    
    if (!userId || !startDate || !endDate) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: userId, startDate, endDate' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log(`Processing meal plan request for user ${userId} from ${startDate} to ${endDate}`);
    console.log(`AI recipe ratio: ${aiRecipeRatio}%`);
    console.log(`Force new recipes: ${forceNewRecipes}`);
    
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
    
    // 1. Always generate AI recipes first based on the user's preferences
    let aiGeneratedRecipes = [];
    try {
      // Always generate fresh AI recipes for each meal plan
      aiGeneratedRecipes = await generateAIRecipes(profile as unknown as UserProfile, aiRecipeRatio);
      console.log(`Successfully generated ${aiGeneratedRecipes.length} AI recipes`);
    } catch (aiRecipeError) {
      console.error("Error generating AI recipes:", aiRecipeError);
      // Continue with existing recipes only
      aiGeneratedRecipes = [];
    }
    
    // 2. Get available recipes from the database
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
    
    console.log(`Fetched ${recipes.length} recipes from database for meal planning`);
    console.log(`Created ${aiGeneratedRecipes.length} AI-generated recipes`);
    
    // 3. Generate AI meal plan using both database recipes and AI-generated recipes
    try {
      const result = await generateAIMealPlan(
        userId, 
        profile as unknown as UserProfile, 
        recipes || [],
        aiGeneratedRecipes,
        startDate,
        endDate,
        aiRecipeRatio
      );
      
      console.log("Meal plan generated successfully");
      
      return new Response(JSON.stringify(result), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } catch (aiError) {
      console.error("AI meal plan generation failed:", aiError);
      
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
